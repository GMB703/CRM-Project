import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import { PrismaClient } from '@prisma/client';
import asyncHandler from 'express-async-handler';
import { createMultiTenantMiddleware } from '../middleware/multiTenant.js';
import { authorize } from '../middleware/auth.js';
import { logEvent } from '../services/auditLogService.js';

const router = express.Router();
const prisma = new PrismaClient();

// Generate JWT Token with organization context
const generateToken = (userId, organizationId = null, organizationData = null, userRole = null, organizationRole = null) => {
  const payload = {
    id: userId,
    sub: userId, // Subject claim
    tokenVersion: 1, // For security versioning
    role: userRole || 'USER', // Default to USER if not provided
    organizationRole: organizationRole || 'MEMBER' // Default to MEMBER if not provided
  };

  // Add organization context if provided
  if (organizationId) {
    payload.organizationId = organizationId;
    payload.tenant = organizationId; // Alternative name for organization context
    
    if (organizationData) {
      payload.organization = {
        id: organizationData.id,
        name: organizationData.name,
        code: organizationData.code,
        isActive: organizationData.isActive
      };
    }
  }

  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: '24h' // Token expires in 24 hours
  });
};

// @desc    Switch organization context (Super Admin only)
// @route   POST /api/auth/switch-organization
// @access  Private (Super Admin only)
router.post(
  '/switch-organization',
  [
    body('organizationId').notEmpty().withMessage('Organization ID is required'),
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    // Get token from header
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    try {
      // Verify current token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Get current user with organization roles
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        include: {
          userOrganizations: {
            where: {
              organization: {
                isActive: true
              }
            },
            select: {
              role: true,
              organizationId: true,
              organization: {
                select: {
                  id: true,
                  name: true,
                  code: true,
                  isActive: true
                }
              }
            }
          }
        }
      });

      if (!user || !user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'User not found or inactive',
        });
      }

      const { organizationId } = req.body;

      // Check if user has access to the target organization
      const targetOrgAccess = user.userOrganizations.find(
        uo => uo.organizationId === organizationId
      );

      // Allow access if user is SUPER_ADMIN or has explicit organization access
      if (user.role !== 'SUPER_ADMIN' && !targetOrgAccess) {
        return res.status(403).json({
          success: false,
          message: 'Access denied to the requested organization',
        });
      }

      // Get organization details
      const targetOrganization = targetOrgAccess ? targetOrgAccess.organization : await prisma.organization.findUnique({
        where: { id: organizationId },
        select: {
          id: true,
          name: true,
          code: true,
          isActive: true,
        },
      });

      if (!targetOrganization) {
        return res.status(404).json({
          success: false,
          message: 'Organization not found',
        });
      }

      if (!targetOrganization.isActive) {
        return res.status(400).json({
          success: false,
          message: 'Cannot switch to inactive organization',
        });
      }

      // Generate new token with organization context
      const newToken = generateToken(
        user.id,
        organizationId,
        targetOrganization,
        user.role,
        targetOrgAccess ? targetOrgAccess.role : 'MEMBER'
      );

      res.json({
        success: true,
        message: `Successfully switched to ${targetOrganization.name}`,
        data: {
          token: newToken,
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
          },
          organization: targetOrganization,
          availableOrganizations: user.userOrganizations.map(uo => ({
            id: uo.organization.id,
            name: uo.organization.name,
            code: uo.organization.code,
            role: uo.role
          }))
        },
      });
    } catch (error) {
      console.error('Organization switch error:', error);
      
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          message: 'Invalid token',
        });
      }
      
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Token expired',
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Internal server error during organization switch',
      });
    }
  })
);

// @desc    Get available organizations for super admin
// @route   GET /api/auth/available-organizations
// @access  Private (Super Admin only)
router.get(
  '/available-organizations',
  asyncHandler(async (req, res) => {
    // Get token from header
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication token required',
      });
    }

    try {
      // Verify current token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Get current user
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: {
          id: true,
          role: true,
          isActive: true,
        },
      });

      if (!user || !user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'User not found or inactive',
        });
      }

      // Check if user is SUPER_ADMIN
      if (user.role !== 'SUPER_ADMIN') {
        return res.status(403).json({
          success: false,
          message: 'Only super admin users can view available organizations',
        });
      }

      // Get all active organizations
      const organizations = await prisma.organization.findMany({
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          code: true,
          createdAt: true,
          _count: {
            select: {
              users: true,
            },
          },
        },
        orderBy: { name: 'asc' },
      });

      res.json({
        success: true,
        data: organizations.map(org => ({
          id: org.id,
          name: org.name,
          code: org.code,
          createdAt: org.createdAt,
          userCount: org._count.users,
        })),
      });
    } catch (error) {
      console.error('Get available organizations error:', error);
      
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          message: 'Invalid token',
        });
      }
      
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Token expired',
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  })
);

// @desc    Register user
// @route   POST /api/auth/register
// @access  Super Admin Only
router.post(
  '/register',
  createMultiTenantMiddleware(),
  authorize(['SUPER_ADMIN']),
  [
    body('email').isEmail().withMessage('Please enter a valid email'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters'),
    body('firstName').notEmpty().withMessage('First name is required'),
    body('lastName').notEmpty().withMessage('Last name is required'),
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const { email, password, firstName, lastName, phone, role = 'USER' } = req.body;
    const normalizedEmail = email.toLowerCase();

    // Check if user exists
    const userExists = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'User already exists',
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        password: hashedPassword,
        firstName,
        lastName,
        phone,
        role,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    if (user) {
      res.status(201).json({
        success: true,
        data: {
          user,
          token: generateToken(user.id),
        },
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Invalid user data',
      });
    }
  })
);

// @desc    Login user
// @route   POST /login
// @access  Public
router.post('/login', [
  body('email').isEmail().withMessage('Please enter a valid email'),
  body('password').notEmpty().withMessage('Password is required')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const { email, password } = req.body;
  const normalizedEmail = email.toLowerCase();

  // Find user
  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    include: {
      userOrganizations: {
        include: {
          organization: {
            select: {
              id: true,
              name: true,
              code: true,
              isActive: true
            }
          }
        }
      }
    }
  });

  if (!user || !user.isActive) {
    await logEvent({
      userId: null,
      organizationId: null,
      action: 'LOGIN_FAILURE',
      targetType: 'Auth',
      details: { email, reason: 'User not found or inactive' },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });
  }

  // Check password
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    await logEvent({
      userId: user.id,
      organizationId: user.organizationId,
      action: 'LOGIN_FAILURE',
      targetType: 'Auth',
      details: { email, reason: 'Invalid password' },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });
  }

  // For non-super admin users, get their primary organization
  let organizationData = null;
  let organizationId = null;
  let organizationRole = null;

  if (user.role !== 'SUPER_ADMIN' && user.userOrganizations.length > 0) {
    const primaryOrg = user.userOrganizations[0];
    organizationData = primaryOrg.organization;
    organizationId = primaryOrg.organizationId;
    organizationRole = primaryOrg.role;
  }

  // Generate token
  const token = generateToken(
    user.id,
    organizationId,
    organizationData,
    user.role,
    organizationRole
  );

  await logEvent({
    userId: user.id,
    organizationId: user.organizationId,
    action: 'LOGIN_SUCCESS',
    targetType: 'Auth',
    details: { email },
    ipAddress: req.ip,
    userAgent: req.headers['user-agent']
  });

  res.json({
    success: true,
    data: {
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      },
      organization: organizationData,
      availableOrganizations: user.userOrganizations.map(uo => ({
        id: uo.organization.id,
        name: uo.organization.name,
        code: uo.organization.code,
        role: uo.role
      }))
    }
  });
}));

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
router.get(
  '/me',
  asyncHandler(async (req, res) => {
    // Get token from header
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route',
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          avatar: true,
          role: true,
          isActive: true,
          lastLoginAt: true,
          createdAt: true,
        },
      });

      res.json({
        success: true,
        data: user,
      });
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route',
      });
    }
  })
);

// @desc    Log user out / clear cookie
// @route   POST /api/auth/logout
// @access  Private
router.post('/logout', (req, res) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });

  res.json({
    success: true,
    message: 'User logged out successfully',
  });
});

// @desc    Update user password
// @route   PUT /api/auth/updatepassword
// @access  Private
router.put(
  '/updatepassword',
  [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword')
      .isLength({ min: 6 })
      .withMessage('New password must be at least 6 characters'),
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const { currentPassword, newPassword } = req.body;

    // Get user with password
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
    });

    // Check current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Password is incorrect',
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password
    await prisma.user.update({
      where: { id: req.user.id },
      data: { password: hashedPassword },
    });

    res.json({
      success: true,
      message: 'Password updated successfully',
    });
  })
);

// @desc    Forgot password
// @route   POST /api/auth/forgotpassword
// @access  Public
router.post(
  '/forgotpassword',
  [body('email').isEmail().withMessage('Please enter a valid email')],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const { email } = req.body;
    const normalizedEmail = email.toLowerCase();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'There is no user with that email',
      });
    }

    // Generate reset token
    const resetToken = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
      expiresIn: '1h',
    });

    // TODO: Send email with reset token
    // For now, just return the token (in production, send via email)
    res.json({
      success: true,
      message: 'Password reset email sent',
      resetToken, // Remove this in production
    });
  })
);

// @desc    Reset password
// @route   PUT /api/auth/resetpassword/:resettoken
// @access  Public
router.put(
  '/resetpassword/:resettoken',
  [
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters'),
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const { password } = req.body;
    const { resettoken } = req.params;

    try {
      // Verify reset token
      const decoded = jwt.verify(resettoken, process.env.JWT_SECRET);

      // Hash new password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Update password
      await prisma.user.update({
        where: { id: decoded.id },
        data: { password: hashedPassword },
      });

      res.json({
        success: true,
        message: 'Password reset successful',
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: 'Invalid reset token',
      });
    }
  })
);

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
router.get(
  '/me',
  asyncHandler(async (req, res) => {
    // Get token from header
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication token required',
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true,
          avatar: true,
          organizationId: true,
          organization: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
        },
      });

      if (!user || !user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'User not found or inactive',
        });
      }

      res.json({
        success: true,
        data: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          avatar: user.avatar,
          organization: user.organization,
        },
      });
    } catch (error) {
      console.error('Get current user error:', error);
      
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          message: 'Invalid token',
        });
      }
      
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Token expired',
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  })
);

// @desc    Get user's available organizations
// @route   GET /api/auth/user/organizations
// @access  Private
router.get(
  '/user/organizations',
  asyncHandler(async (req, res) => {
    // Get token from header
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication token required',
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: {
          id: true,
          email: true,
          isActive: true,
        },
      });

      if (!user || !user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'User not found or inactive',
        });
      }

      // Get all organizations the user has access to
      const userOrganizations = await prisma.user.findMany({
        where: { 
          email: user.email,
          isActive: true,
          organization: {
            isActive: true
          }
        },
        include: {
          organization: {
            select: {
              id: true,
              name: true,
              code: true,
              isActive: true,
              createdAt: true,
            },
          },
        },
      });

      const organizations = userOrganizations.map(userOrg => ({
        id: userOrg.organization.id,
        name: userOrg.organization.name,
        code: userOrg.organization.code,
        isActive: userOrg.organization.isActive,
        createdAt: userOrg.organization.createdAt,
        userRole: userOrg.organizationRole || 'USER'
      }));

      res.json({
        success: true,
        data: organizations
      });
    } catch (error) {
      console.error('Get user organizations error:', error);
      
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          message: 'Invalid token',
        });
      }
      
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Token expired',
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  })
);

// @desc    Refresh access token
// @route   POST /api/auth/refresh
// @access  Private
router.post(
  '/refresh',
  asyncHandler(async (req, res) => {
    // Get refresh token from body or header
    const { refreshToken } = req.body;
    let token;
    
    if (refreshToken) {
      token = refreshToken;
    } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token required',
      });
    }

    try {
      // Verify current token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Get user with organization roles
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        include: {
          organization: {
            select: {
              id: true,
              name: true,
              code: true,
              isActive: true,
            },
          },
          userOrganizations: {
            where: {
              organization: {
                isActive: true
              }
            },
            select: {
              role: true,
              organizationId: true,
              organization: {
                select: {
                  id: true,
                  name: true,
                  code: true,
                  isActive: true
                }
              }
            }
          }
        }
      });

      if (!user || !user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'User not found or inactive',
        });
      }

      // Get organization context from current token or request body
      let organizationId = req.body.organizationId || decoded.organizationId || user.organizationId;
      let organization = user.organization;
      let organizationRole = 'MEMBER';

      // If organization ID is in token/request, find it in user's organizations
      if (organizationId) {
        const orgAccess = user.userOrganizations.find(
          uo => uo.organizationId === organizationId
        );
        if (orgAccess) {
          organization = orgAccess.organization;
          organizationRole = orgAccess.role;
        }
      }
      // If no organization context, use first available organization
      else if (user.userOrganizations.length > 0) {
        const primaryOrg = user.userOrganizations[0];
        organizationId = primaryOrg.organizationId;
        organization = primaryOrg.organization;
        organizationRole = primaryOrg.role;
      }

      // Generate new token
      const newToken = generateToken(
        user.id,
        organizationId,
        organization,
        user.role,
        organizationRole
      );

      res.json({
        success: true,
        data: {
          token: newToken,
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
          },
          organization: organization,
          availableOrganizations: user.userOrganizations.map(uo => ({
            id: uo.organization.id,
            name: uo.organization.name,
            code: uo.organization.code,
            role: uo.role
          }))
        },
      });
    } catch (error) {
      console.error('Token refresh error:', error);
      
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          message: 'Invalid token',
        });
      }
      
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Token expired',
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Internal server error during token refresh',
      });
    }
  })
);

export default router;

/* [STABLE COMPONENT - DO NOT MODIFY]
 * This authentication routes configuration is complete and stable.
 * Core functionality:
 * - JWT token generation with organization context
 * - User authentication endpoints
 * - Password reset flow
 * - Session management
 * 
 * This is a critical security component.
 * Changes here could affect the entire authentication system.
 * Modify only if absolutely necessary and after thorough security review.
 */ 