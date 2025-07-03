import express from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createOrgContext } from '../services/databaseService.js';
import { createMultiTenantMiddleware } from '../middleware/multiTenant.js';
import UserService from '../services/userService.js';

const router = express.Router();
const prisma = new PrismaClient();

/**
 * Custom error classes for organization management
 */
class OrganizationError extends Error {
  constructor(message, statusCode = 400, code = 'ORGANIZATION_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }
}

/**
 * Validation middleware for organization creation
 */
const validateOrganizationCreation = (req, res, next) => {
  const { name, adminUser } = req.body;
  
  // Validate organization name
  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    return res.status(400).json({
      success: false,
      error: 'Organization name is required and must be at least 2 characters long'
    });
  }
  
  if (name.trim().length > 100) {
    return res.status(400).json({
      success: false,
      error: 'Organization name cannot exceed 100 characters'
    });
  }
  
  // Validate admin user data
  if (!adminUser || typeof adminUser !== 'object') {
    return res.status(400).json({
      success: false,
      error: 'Admin user information is required'
    });
  }
  
  const { email, password, firstName, lastName } = adminUser;
  
  if (!email || !password || !firstName || !lastName) {
    return res.status(400).json({
      success: false,
      error: 'Admin user must have email, password, firstName, and lastName'
    });
  }
  
  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      success: false,
      error: 'Valid email address is required for admin user'
    });
  }
  
  // Password validation
  if (password.length < 6) {
    return res.status(400).json({
      success: false,
      error: 'Admin user password must be at least 6 characters long'
    });
  }
  
  next();
};

/**
 * Role authorization middleware
 */
const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    const userRole = req.multiTenant?.organizationRole || req.organizationRole || req.user?.organizationRole;
    
    if (!userRole || !allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        required: allowedRoles,
        current: userRole
      });
    }
    
    next();
  };
};

/**
 * Super admin middleware
 */
const requireSuperAdmin = (req, res, next) => {
  if (req.user?.role !== 'SUPER_ADMIN') {
    return res.status(403).json({
      success: false,
      error: 'Super admin access required'
    });
  }
  next();
};

/**
 * POST /api/organizations/register
 * Public endpoint for organization registration with admin user
 */
router.post('/register', async (req, res) => {
  try {
    const { 
      organizationName, 
      adminName, 
      adminEmail, 
      adminPassword, 
      industry,
      primaryColor = '#1976d2',
      logoUrl,
      enabledFeatures = ['crm', 'projects', 'invoicing']
    } = req.body;
    
    // Validate required fields
    if (!organizationName || !adminEmail || !adminPassword || !adminName) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: organizationName, adminName, adminEmail, and adminPassword are required'
      });
    }
    
    // Validate organization name
    if (organizationName.trim().length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Organization name must be at least 2 characters long'
      });
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(adminEmail)) {
      return res.status(400).json({
        success: false,
        error: 'Valid email address is required'
      });
    }
    
    // Validate password strength
    if (adminPassword.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 6 characters long'
      });
    }
    
    // Check if organization name already exists
    const existingOrg = await prisma.organization.findFirst({
      where: { 
        name: {
          equals: organizationName.trim(),
          mode: 'insensitive'
        },
        isActive: true 
      }
    });
    
    if (existingOrg) {
      return res.status(409).json({
        success: false,
        error: 'Organization name already exists'
      });
    }
    
    // Check if admin user email already exists
    const existingUser = await prisma.user.findFirst({
      where: { 
        email: {
          equals: adminEmail.toLowerCase().trim(),
          mode: 'insensitive'
        }
      }
    });
    
    // Start database transaction for organization registration
    const result = await prisma.$transaction(async (tx) => {
      // Create organization
      const organization = await tx.organization.create({
        data: {
          name: organizationName.trim(),
          code: generateOrgCode(organizationName),
          isActive: true,
          settings: {
            companyName: organizationName.trim(),
            contactEmail: adminEmail.toLowerCase().trim(),
            industry: industry || null,
            primaryColor: primaryColor,
            logoUrl: logoUrl || null,
            enabledFeatures: enabledFeatures,
            createdAt: new Date()
          },
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
      
      let user;
      
      if (existingUser) {
        // If user exists, add them to this organization
        user = existingUser;
        
        // Create UserOrganization record
        await tx.userOrganization.create({
          data: {
            userId: user.id,
            organizationId: organization.id,
            role: 'OWNER',
            isActive: true,
            joinedAt: new Date()
          }
        });
        
        // Update user's primary organization if they don't have one
        if (!user.organizationId) {
          await tx.user.update({
            where: { id: user.id },
            data: {
              organizationId: organization.id,
              organizationRole: 'OWNER'
            }
          });
        }
      } else {
        // Create new admin user
        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash(adminPassword, salt);
        
        user = await tx.user.create({
          data: {
            email: adminEmail.toLowerCase().trim(),
            password: hashedPassword,
            firstName: adminName.split(' ')[0]?.trim() || adminName.trim(),
            lastName: adminName.split(' ').slice(1).join(' ').trim() || '',
            role: 'ADMIN',
            organizationId: organization.id,
            organizationRole: 'OWNER',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        });
        
        // Create UserOrganization record
        await tx.userOrganization.create({
          data: {
            userId: user.id,
            organizationId: organization.id,
            role: 'OWNER',
            isActive: true,
            joinedAt: new Date()
          }
        });
      }
      
      return { organization, user };
    });
    
    // Generate JWT token with organization context
    const tokenPayload = {
      sub: result.user.id,
      id: result.user.id,
      email: result.user.email,
      firstName: result.user.firstName,
      lastName: result.user.lastName,
      role: result.user.role,
      organizationId: result.organization.id,
      organizationName: result.organization.name,
      organizationCode: result.organization.code,
      organizationRole: 'OWNER',
      permissions: ['read', 'write', 'admin'],
      tokenVersion: 1,
      sessionId: `session_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
    };
    
    const token = jwt.sign(tokenPayload, process.env.JWT_SECRET);
    
    // Log successful registration
    console.log(`[REGISTRATION] New organization registered: ${result.organization.name} (${result.organization.id}) by ${result.user.email}`);
    
    res.status(201).json({
      success: true,
      data: {
        organization: {
          id: result.organization.id,
          name: result.organization.name,
          code: result.organization.code,
          settings: result.organization.settings
        },
        user: {
          id: result.user.id,
          email: result.user.email,
          firstName: result.user.firstName,
          lastName: result.user.lastName,
          role: result.user.role,
          organizationRole: 'OWNER'
        },
        token
      },
      message: 'Organization registered successfully'
    });
    
  } catch (error) {
    console.error('Organization registration error:', error);
    
    // Handle specific database errors
    if (error.code === 'P2002') {
      return res.status(409).json({
        success: false,
        error: 'A record with this information already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to register organization',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * POST /api/organizations
 * Create a new organization with initial admin user
 */
router.post('/', validateOrganizationCreation, async (req, res) => {
  try {
    const { name, settings = {}, adminUser } = req.body;
    
    // Check if organization name already exists
    const existingOrg = await prisma.organization.findFirst({
      where: { 
        name: name.trim(),
        isActive: true 
      }
    });
    
    if (existingOrg) {
      return res.status(409).json({
        success: false,
        error: 'Organization name already exists'
      });
    }
    
    // Check if admin user email already exists globally
    const existingUser = await prisma.user.findFirst({
      where: { email: adminUser.email.toLowerCase() }
    });
    
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'Admin user email already exists'
      });
    }
    
    // Start database transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create organization
      const organization = await tx.organization.create({
        data: {
          name: name.trim(),
          code: generateOrgCode(name),
          settings: settings || {},
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
      
      // Hash admin user password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(adminUser.password, salt);
      
      // Create admin user
      const admin = await tx.user.create({
        data: {
          email: adminUser.email.toLowerCase().trim(),
          password: hashedPassword,
          firstName: adminUser.firstName.trim(),
          lastName: adminUser.lastName.trim(),
          phone: adminUser.phone?.trim() || null,
          role: 'ADMIN',
          organizationId: organization.id,
          organizationRole: 'OWNER',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
      
      // Create UserOrganization record
      await tx.userOrganization.create({
        data: {
          userId: admin.id,
          organizationId: organization.id,
          role: 'OWNER',
          isActive: true,
          joinedAt: new Date()
        }
      });
      
      return { organization, admin };
    });
    
    // Generate JWT token for the new admin user
    const token = jwt.sign(
      {
        sub: result.admin.id,
        email: result.admin.email,
        organizationId: result.organization.id,
        organizationRole: 'OWNER',
        role: 'ADMIN',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours
        tokenVersion: 1
      },
      process.env.JWT_SECRET
    );
    
    // Prepare response (exclude password)
    const { password: _, ...adminResponse } = result.admin;
    
    res.status(201).json({
      success: true,
      data: {
        organization: result.organization,
        admin: adminResponse,
        token
      },
      message: 'Organization created successfully'
    });
    
  } catch (error) {
    console.error('Error creating organization:', error);
    
    if (error.code === 'P2002') {
      return res.status(409).json({
        success: false,
        error: 'Organization or user already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to create organization',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/organizations/current
 * Get current organization details
 */
router.get('/current', createMultiTenantMiddleware(), async (req, res) => {
  try {
    const organizationId = req.multiTenant?.organizationId || req.organizationId;
    const db = createOrgContext(organizationId);
    
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      include: {
        _count: {
          select: {
            users: true,
            clients: true,
            projects: true
          }
        }
      }
    });
    
    if (!organization) {
      return res.status(404).json({
        success: false,
        error: 'Organization not found'
      });
    }
    
    res.json({
      success: true,
      data: organization
    });
    
  } catch (error) {
    console.error('Error fetching organization:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch organization details'
    });
  }
});

/**
 * PATCH /api/organizations/current
 * Update current organization - Enhanced with comprehensive field support and validation
 */
router.patch('/current', 
  createMultiTenantMiddleware(), 
  requireRole(['ADMIN', 'OWNER']), 
  async (req, res) => {
    try {
      const organizationId = req.multiTenant?.organizationId || req.organizationId;
      const { name, settings, primaryColor, logo, isActive } = req.body;
      
      // Track what fields are being updated for response
      const updatedFields = [];
      const updateData = {};
      
      // Enhanced name validation and update
      if (name !== undefined) {
        if (typeof name !== 'string') {
          return res.status(400).json({
            success: false,
            error: 'Organization name must be a string',
            field: 'name',
            provided: typeof name
          });
        }
        
        const trimmedName = name.trim();
        if (trimmedName.length < 2) {
          return res.status(400).json({
            success: false,
            error: 'Organization name must be at least 2 characters long',
            field: 'name',
            provided: trimmedName.length
          });
        }
        
        if (trimmedName.length > 100) {
          return res.status(400).json({
            success: false,
            error: 'Organization name must be less than 100 characters',
            field: 'name',
            provided: trimmedName.length
          });
        }
        
        // Check for duplicate name (excluding current organization)
        const existingOrg = await prisma.organization.findFirst({
          where: { 
            name: trimmedName,
            id: { not: organizationId },
            isActive: true 
          }
        });
        
        if (existingOrg) {
          return res.status(409).json({
            success: false,
            error: 'Organization name already exists',
            field: 'name',
            conflictWith: existingOrg.id
          });
        }
        
        updateData.name = trimmedName;
        updatedFields.push('name');
      }
      
      // Enhanced settings validation
      if (settings !== undefined) {
        if (settings !== null && typeof settings !== 'object') {
          return res.status(400).json({
            success: false,
            error: 'Settings must be an object or null',
            field: 'settings',
            provided: typeof settings
          });
        }
        
        // Validate settings structure if provided
        if (settings && typeof settings === 'object') {
          try {
            // Ensure it's valid JSON serializable
            JSON.stringify(settings);
            
            // Validate specific setting fields if they exist
            if (settings.theme && typeof settings.theme !== 'string') {
              return res.status(400).json({
                success: false,
                error: 'Theme setting must be a string',
                field: 'settings.theme'
              });
            }
            
            if (settings.timezone && typeof settings.timezone !== 'string') {
              return res.status(400).json({
                success: false,
                error: 'Timezone setting must be a string',
                field: 'settings.timezone'
              });
            }
            
            if (settings.currency && typeof settings.currency !== 'string') {
              return res.status(400).json({
                success: false,
                error: 'Currency setting must be a string',
                field: 'settings.currency'
              });
            }
            
          } catch (jsonError) {
            return res.status(400).json({
              success: false,
              error: 'Settings must be valid JSON',
              field: 'settings'
            });
          }
        }
        
        updateData.settings = settings;
        updatedFields.push('settings');
      }
      
      // Enhanced primaryColor validation
      if (primaryColor !== undefined) {
        if (primaryColor !== null && typeof primaryColor !== 'string') {
          return res.status(400).json({
            success: false,
            error: 'Primary color must be a string or null',
            field: 'primaryColor',
            provided: typeof primaryColor
          });
        }
        
        if (primaryColor) {
          const trimmedColor = primaryColor.trim();
          
          // Validate hex color format
          const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
          if (!hexColorRegex.test(trimmedColor)) {
            return res.status(400).json({
              success: false,
              error: 'Primary color must be a valid hex color (e.g., #FF5733 or #F73)',
              field: 'primaryColor',
              provided: trimmedColor
            });
          }
          
          updateData.primaryColor = trimmedColor;
        } else {
          updateData.primaryColor = null;
        }
        
        updatedFields.push('primaryColor');
      }
      
      // Enhanced logo validation
      if (logo !== undefined) {
        if (logo !== null && typeof logo !== 'string') {
          return res.status(400).json({
            success: false,
            error: 'Logo must be a string URL or null',
            field: 'logo',
            provided: typeof logo
          });
        }
        
        if (logo) {
          const trimmedLogo = logo.trim();
          
          // Basic URL validation
          try {
            new URL(trimmedLogo);
            updateData.logo = trimmedLogo;
          } catch (urlError) {
            return res.status(400).json({
              success: false,
              error: 'Logo must be a valid URL',
              field: 'logo',
              provided: trimmedLogo
            });
          }
        } else {
          updateData.logo = null;
        }
        
        updatedFields.push('logo');
      }
      
      // Enhanced isActive validation (only OWNER can deactivate)
      if (isActive !== undefined) {
        if (typeof isActive !== 'boolean') {
          return res.status(400).json({
            success: false,
            error: 'isActive must be a boolean',
            field: 'isActive',
            provided: typeof isActive
          });
        }
        
        // Only OWNER can deactivate organization
        const userRole = req.multiTenant?.organizationRole || req.organizationRole || req.user?.organizationRole;
        if (!isActive && userRole !== 'OWNER') {
          return res.status(403).json({
            success: false,
            error: 'Only organization owners can deactivate the organization',
            field: 'isActive',
            requiredRole: 'OWNER',
            currentRole: userRole
          });
        }
        
        updateData.isActive = isActive;
        updatedFields.push('isActive');
      }
      
      // Check if any valid fields were provided
      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({
          success: false,
          error: 'No valid fields to update',
          availableFields: ['name', 'settings', 'primaryColor', 'logo', 'isActive'],
          providedFields: Object.keys(req.body)
        });
      }
      
      // Add timestamp
      updateData.updatedAt = new Date();
      
      // Perform the update
      const updated = await prisma.organization.update({
        where: { id: organizationId },
        data: updateData,
        include: {
          _count: {
            select: {
              users: true,
              clients: true,
              projects: true,
              userOrganizations: true
            }
          }
        }
      });
      
      // Enhanced response with detailed information
      res.json({
        success: true,
        data: updated,
        meta: {
          updatedFields,
          timestamp: updateData.updatedAt,
          updatedBy: {
            userId: req.user?.id,
            role: req.multiTenant?.organizationRole || req.organizationRole
          }
        },
        message: `Organization updated successfully. Updated fields: ${updatedFields.join(', ')}`
      });
      
    } catch (error) {
      console.error('Error updating organization:', error);
      
      // Enhanced error handling
      if (error.code === 'P2002') {
        return res.status(409).json({
          success: false,
          error: 'Organization name already exists',
          code: 'DUPLICATE_NAME',
          field: error.meta?.target || 'name'
        });
      }
      
      if (error.code === 'P2025') {
        return res.status(404).json({
          success: false,
          error: 'Organization not found',
          code: 'NOT_FOUND'
        });
      }
      
      res.status(500).json({
        success: false,
        error: 'Failed to update organization',
        code: 'UPDATE_FAILED',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

/**
 * GET /api/organizations/current/users
 * Get all users in the current organization
 */
router.get('/current/users', 
  createMultiTenantMiddleware(), 
  requireRole(['ADMIN', 'OWNER', 'MANAGER']), 
  async (req, res) => {
    try {
      const organizationId = req.multiTenant?.organizationId || req.organizationId;
      const { roles, organizationRoles, includeInactive } = req.query;
      
      // Parse role filters if provided
      const roleFilter = roles ? roles.split(',') : null;
      const orgRoleFilter = organizationRoles ? organizationRoles.split(',') : null;
      
      // Get users from the organization
      let users = await UserService.getUsersByOrganization(organizationId, roleFilter, orgRoleFilter);
      
      // Filter out inactive users unless specifically requested
      if (!includeInactive || includeInactive !== 'true') {
        users = users.filter(user => user.isActive);
      }
      
      res.json({
        success: true,
        data: users,
        meta: {
          total: users.length,
          organizationId,
          filters: {
            roles: roleFilter,
            organizationRoles: orgRoleFilter,
            includeInactive: includeInactive === 'true'
          }
        }
      });
      
    } catch (error) {
      console.error('Error fetching organization users:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch organization users',
        code: 'FETCH_USERS_FAILED'
      });
    }
  }
);

/**
 * POST /api/organizations/current/users
 * Add a new user to the current organization
 */
router.post('/current/users',
  createMultiTenantMiddleware(),
  requireRole(['ADMIN', 'OWNER']),
  async (req, res) => {
    try {
      const organizationId = req.multiTenant?.organizationId || req.organizationId;
      const { email, password, firstName, lastName, phone, role = 'USER', organizationRole = 'MEMBER' } = req.body;
      
      // Comprehensive input validation
      if (!email || !password || !firstName || !lastName) {
        return res.status(400).json({
          success: false,
          error: 'Email, password, first name, and last name are required',
          code: 'MISSING_REQUIRED_FIELDS',
          requiredFields: ['email', 'password', 'firstName', 'lastName']
        });
      }
      
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid email format',
          code: 'INVALID_EMAIL_FORMAT',
          field: 'email'
        });
      }
      
      // Validate password strength
      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          error: 'Password must be at least 6 characters long',
          code: 'WEAK_PASSWORD',
          field: 'password'
        });
      }
      
      // Validate role values
      const validRoles = ['USER', 'MANAGER', 'ADMIN'];
      const validOrgRoles = ['GUEST', 'MEMBER', 'MANAGER', 'ADMIN', 'OWNER'];
      
      if (!validRoles.includes(role)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid role',
          code: 'INVALID_ROLE',
          field: 'role',
          validValues: validRoles
        });
      }
      
      if (!validOrgRoles.includes(organizationRole)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid organization role',
          code: 'INVALID_ORG_ROLE',
          field: 'organizationRole',
          validValues: validOrgRoles
        });
      }
      
      // Only OWNER can create other OWNER accounts
      const requesterRole = req.multiTenant?.organizationRole || req.organizationRole;
      if (organizationRole === 'OWNER' && requesterRole !== 'OWNER') {
        return res.status(403).json({
          success: false,
          error: 'Only organization owners can create other owners',
          code: 'INSUFFICIENT_PERMISSIONS',
          requiredRole: 'OWNER',
          currentRole: requesterRole
        });
      }
      
      // Create the user
      const userData = { email, password, firstName, lastName, phone, role };
      const newUser = await UserService.createUser(userData, organizationId, organizationRole);
      
      res.status(201).json({
        success: true,
        data: newUser,
        message: `User ${firstName} ${lastName} added to organization successfully`
      });
      
    } catch (error) {
      console.error('Error adding user to organization:', error);
      
      if (error.message.includes('already exists')) {
        return res.status(409).json({
          success: false,
          error: 'User already exists in this organization',
          code: 'USER_EXISTS'
        });
      }
      
      res.status(500).json({
        success: false,
        error: 'Failed to add user to organization',
        code: 'ADD_USER_FAILED',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

/**
 * GET /api/organizations/current/users/:userId
 * Get specific user details in the current organization
 */
router.get('/current/users/:userId',
  createMultiTenantMiddleware(),
  requireRole(['ADMIN', 'OWNER', 'MANAGER']),
  async (req, res) => {
    try {
      const organizationId = req.multiTenant?.organizationId || req.organizationId;
      const { userId } = req.params;
      
      if (!userId) {
        return res.status(400).json({
          success: false,
          error: 'User ID is required',
          code: 'MISSING_USER_ID'
        });
      }
      
      // Get user details
      const user = await UserService.getUserById(userId, true);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found',
          code: 'USER_NOT_FOUND'
        });
      }
      
      // Check if user belongs to the current organization
      if (user.organizationId !== organizationId) {
        return res.status(404).json({
          success: false,
          error: 'User not found in this organization',
          code: 'USER_NOT_IN_ORG'
        });
      }
      
      // Remove password from response
      const { password, ...userResponse } = user;
      
      res.json({
        success: true,
        data: userResponse
      });
      
    } catch (error) {
      console.error('Error fetching user details:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch user details',
        code: 'FETCH_USER_FAILED'
      });
    }
  }
);

/**
 * PATCH /api/organizations/current/users/:userId
 * Update user role in the current organization
 */
router.patch('/current/users/:userId',
  createMultiTenantMiddleware(),
  requireRole(['ADMIN', 'OWNER']),
  async (req, res) => {
    try {
      const organizationId = req.multiTenant?.organizationId || req.organizationId;
      const { userId } = req.params;
      const { role, organizationRole } = req.body;
      const requesterId = req.user?.id;
      
      if (!userId) {
        return res.status(400).json({
          success: false,
          error: 'User ID is required',
          code: 'MISSING_USER_ID'
        });
      }
      
      if (!role && !organizationRole) {
        return res.status(400).json({
          success: false,
          error: 'At least one role field (role or organizationRole) is required',
          code: 'MISSING_ROLE_FIELDS',
          availableFields: ['role', 'organizationRole']
        });
      }
      
      // Get current user details
      const targetUser = await UserService.getUserById(userId, false);
      if (!targetUser || targetUser.organizationId !== organizationId) {
        return res.status(404).json({
          success: false,
          error: 'User not found in this organization',
          code: 'USER_NOT_FOUND'
        });
      }
      
      // Validate role values if provided
      if (role) {
        const validRoles = ['USER', 'MANAGER', 'ADMIN'];
        if (!validRoles.includes(role)) {
          return res.status(400).json({
            success: false,
            error: 'Invalid role',
            code: 'INVALID_ROLE',
            field: 'role',
            validValues: validRoles
          });
        }
      }
      
      if (organizationRole) {
        const validOrgRoles = ['GUEST', 'MEMBER', 'MANAGER', 'ADMIN', 'OWNER'];
        if (!validOrgRoles.includes(organizationRole)) {
          return res.status(400).json({
            success: false,
            error: 'Invalid organization role',
            code: 'INVALID_ORG_ROLE',
            field: 'organizationRole',
            validValues: validOrgRoles
          });
        }
      }
      
      // Prevent last owner from being demoted
      if (organizationRole && organizationRole !== 'OWNER' && targetUser.organizationRole === 'OWNER') {
        const ownerCount = await prisma.user.count({
          where: { 
            organizationId,
            organizationRole: 'OWNER',
            isActive: true
          }
        });
        
        if (ownerCount <= 1) {
          return res.status(400).json({
            success: false,
            error: 'Cannot demote the last owner of the organization',
            code: 'LAST_OWNER_PROTECTION'
          });
        }
      }
      
      // Only OWNER can promote to OWNER or demote OWNER
      const requesterRole = req.multiTenant?.organizationRole || req.organizationRole;
      if ((organizationRole === 'OWNER' || targetUser.organizationRole === 'OWNER') && requesterRole !== 'OWNER') {
        return res.status(403).json({
          success: false,
          error: 'Only organization owners can manage owner roles',
          code: 'INSUFFICIENT_PERMISSIONS',
          requiredRole: 'OWNER',
          currentRole: requesterRole
        });
      }
      
      // Update user roles
      const updatedUser = await UserService.updateUserRole(
        userId,
        role || targetUser.role,
        organizationRole || targetUser.organizationRole,
        requesterId
      );
      
      res.json({
        success: true,
        data: updatedUser,
        meta: {
          updatedFields: {
            role: role !== undefined,
            organizationRole: organizationRole !== undefined
          },
          previousRoles: {
            role: targetUser.role,
            organizationRole: targetUser.organizationRole
          }
        },
        message: 'User roles updated successfully'
      });
      
    } catch (error) {
      console.error('Error updating user roles:', error);
      
      if (error.message.includes('permission')) {
        return res.status(403).json({
          success: false,
          error: error.message,
          code: 'INSUFFICIENT_PERMISSIONS'
        });
      }
      
      res.status(500).json({
        success: false,
        error: 'Failed to update user roles',
        code: 'UPDATE_ROLES_FAILED',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

/**
 * DELETE /api/organizations/current/users/:userId
 * Remove user from the current organization
 */
router.delete('/current/users/:userId',
  createMultiTenantMiddleware(),
  requireRole(['ADMIN', 'OWNER']),
  async (req, res) => {
    try {
      const organizationId = req.multiTenant?.organizationId || req.organizationId;
      const { userId } = req.params;
      const { force } = req.query; // Optional force parameter for hard deletion
      const requesterId = req.user?.id;
      
      if (!userId) {
        return res.status(400).json({
          success: false,
          error: 'User ID is required',
          code: 'MISSING_USER_ID'
        });
      }
      
      // Get target user details
      const targetUser = await UserService.getUserById(userId, false);
      if (!targetUser || targetUser.organizationId !== organizationId) {
        return res.status(404).json({
          success: false,
          error: 'User not found in this organization',
          code: 'USER_NOT_FOUND'
        });
      }
      
      // Prevent removing the last owner
      if (targetUser.organizationRole === 'OWNER') {
        const ownerCount = await prisma.user.count({
          where: { 
            organizationId,
            organizationRole: 'OWNER',
            isActive: true
          }
        });
        
        if (ownerCount <= 1) {
          return res.status(400).json({
            success: false,
            error: 'Cannot remove the last owner of the organization',
            code: 'LAST_OWNER_PROTECTION'
          });
        }
      }
      
      // Prevent self-removal
      if (userId === requesterId) {
        return res.status(400).json({
          success: false,
          error: 'Users cannot remove themselves from the organization',
          code: 'SELF_REMOVAL_FORBIDDEN'
        });
      }
      
      // Only OWNER can remove other OWNER accounts
      const requesterRole = req.multiTenant?.organizationRole || req.organizationRole;
      if (targetUser.organizationRole === 'OWNER' && requesterRole !== 'OWNER') {
        return res.status(403).json({
          success: false,
          error: 'Only organization owners can remove other owners',
          code: 'INSUFFICIENT_PERMISSIONS',
          requiredRole: 'OWNER',
          currentRole: requesterRole
        });
      }
      
      if (force === 'true') {
        // Hard deletion - completely remove user (dangerous operation)
        await prisma.$transaction(async (tx) => {
          // Remove UserOrganization records
          await tx.userOrganization.deleteMany({
            where: { userId, organizationId }
          });
          
          // Deactivate user if this is their primary organization
          if (targetUser.organizationId === organizationId) {
            await tx.user.update({
              where: { id: userId },
              data: { isActive: false }
            });
          }
        });
        
        res.json({
          success: true,
          message: 'User permanently removed from organization',
          data: {
            userId,
            action: 'hard_delete',
            removedAt: new Date()
          }
        });
      } else {
        // Soft deletion - deactivate user
        await prisma.user.update({
          where: { id: userId },
          data: { 
            isActive: false,
            updatedAt: new Date()
          }
        });
        
        // Deactivate UserOrganization records
        await prisma.userOrganization.updateMany({
          where: { userId, organizationId },
          data: { 
            isActive: false,
            updatedAt: new Date()
          }
        });
        
        res.json({
          success: true,
          message: 'User deactivated in organization',
          data: {
            userId,
            action: 'soft_delete',
            deactivatedAt: new Date(),
            note: 'User can be reactivated by an administrator'
          }
        });
      }
      
    } catch (error) {
      console.error('Error removing user from organization:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to remove user from organization',
        code: 'REMOVE_USER_FAILED',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

/**
 * ========================================
 * ORGANIZATION SETTINGS MANAGEMENT API
 * ========================================
 */

/**
 * GET /api/organizations/current/settings
 * Retrieve current organization settings
 */
router.get('/current/settings',
  createMultiTenantMiddleware(),
  requireRole(['ADMIN', 'OWNER', 'MANAGER', 'MEMBER']),
  async (req, res) => {
    try {
      const organizationId = req.multiTenant?.organizationId || req.organizationId;
      const { keys } = req.query; // Optional: specific setting keys to retrieve
      
      const organization = await prisma.organization.findUnique({
        where: { id: organizationId },
        select: {
          id: true,
          name: true,
          settings: true,
          updatedAt: true
        }
      });
      
      if (!organization) {
        return res.status(404).json({
          success: false,
          error: 'Organization not found',
          code: 'ORG_NOT_FOUND'
        });
      }
      
      let settings = organization.settings || {};
      
      // If specific keys requested, filter the settings
      if (keys) {
        const requestedKeys = keys.split(',').map(key => key.trim());
        const filteredSettings = {};
        requestedKeys.forEach(key => {
          if (settings.hasOwnProperty(key)) {
            filteredSettings[key] = settings[key];
          }
        });
        settings = filteredSettings;
      }
      
      // Add default settings structure if none exist
      const defaultSettings = {
        theme: settings.theme || 'blue',
        timezone: settings.timezone || 'UTC',
        currency: settings.currency || 'USD',
        dateFormat: settings.dateFormat || 'MM/DD/YYYY',
        timeFormat: settings.timeFormat || '12h',
        language: settings.language || 'en',
        notifications: settings.notifications || {
          email: true,
          sms: false,
          push: true,
          projectUpdates: true,
          taskReminders: true,
          invoiceReminders: true
        },
        branding: settings.branding || {
          showLogo: true,
          customColors: false,
          customFonts: false
        },
        features: settings.features || {
          clientPortal: true,
          timeTracking: true,
          advancedReporting: false,
          integrations: true
        },
        security: settings.security || {
          twoFactorAuth: false,
          sessionTimeout: 480, // 8 hours in minutes
          passwordPolicy: 'standard'
        }
      };
      
      // Merge user settings with defaults
      const finalSettings = { ...defaultSettings, ...settings };
      
      res.json({
        success: true,
        data: {
          organizationId,
          organizationName: organization.name,
          settings: finalSettings,
          lastUpdated: organization.updatedAt
        },
        meta: {
          hasCustomSettings: Object.keys(settings).length > 0,
          requestedKeys: keys ? keys.split(',').map(k => k.trim()) : null,
          availableCategories: ['theme', 'timezone', 'currency', 'dateFormat', 'timeFormat', 'language', 'notifications', 'branding', 'features', 'security']
        }
      });
      
    } catch (error) {
      console.error('Error fetching organization settings:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch organization settings',
        code: 'SETTINGS_FETCH_FAILED'
      });
    }
  }
);

/**
 * PATCH /api/organizations/current/settings
 * Update specific organization settings
 */
router.patch('/current/settings',
  createMultiTenantMiddleware(),
  requireRole(['ADMIN', 'OWNER']),
  async (req, res) => {
    try {
      const organizationId = req.multiTenant?.organizationId || req.organizationId;
      const updates = req.body;
      
      if (!updates || typeof updates !== 'object' || Object.keys(updates).length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Settings updates are required',
          code: 'MISSING_SETTINGS',
          example: {
            theme: 'dark',
            timezone: 'America/New_York',
            notifications: { email: true }
          }
        });
      }
      
      // Get current organization and settings
      const organization = await prisma.organization.findUnique({
        where: { id: organizationId },
        select: { settings: true, name: true }
      });
      
      if (!organization) {
        return res.status(404).json({
          success: false,
          error: 'Organization not found',
          code: 'ORG_NOT_FOUND'
        });
      }
      
      const currentSettings = organization.settings || {};
      const updatedFields = [];
      const validationErrors = [];
      
      // Comprehensive settings validation
      const settingsValidators = {
        theme: (value) => {
          const validThemes = ['light', 'dark', 'blue', 'green', 'purple', 'custom'];
          if (!validThemes.includes(value)) {
            return `Theme must be one of: ${validThemes.join(', ')}`;
          }
          return null;
        },
        
        timezone: (value) => {
          // Basic timezone validation (you could use a library like moment-timezone for more robust validation)
          if (typeof value !== 'string' || value.length === 0) {
            return 'Timezone must be a non-empty string';
          }
          return null;
        },
        
        currency: (value) => {
          const validCurrencies = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'CHF', 'CNY'];
          if (!validCurrencies.includes(value)) {
            return `Currency must be one of: ${validCurrencies.join(', ')}`;
          }
          return null;
        },
        
        dateFormat: (value) => {
          const validFormats = ['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD', 'MMM DD, YYYY'];
          if (!validFormats.includes(value)) {
            return `Date format must be one of: ${validFormats.join(', ')}`;
          }
          return null;
        },
        
        timeFormat: (value) => {
          const validFormats = ['12h', '24h'];
          if (!validFormats.includes(value)) {
            return `Time format must be one of: ${validFormats.join(', ')}`;
          }
          return null;
        },
        
        language: (value) => {
          const validLanguages = ['en', 'es', 'fr', 'de', 'it', 'pt', 'zh', 'ja'];
          if (!validLanguages.includes(value)) {
            return `Language must be one of: ${validLanguages.join(', ')}`;
          }
          return null;
        },
        
        notifications: (value) => {
          if (typeof value !== 'object' || value === null) {
            return 'Notifications must be an object';
          }
          
          const validKeys = ['email', 'sms', 'push', 'projectUpdates', 'taskReminders', 'invoiceReminders'];
          for (const key of Object.keys(value)) {
            if (!validKeys.includes(key)) {
              return `Invalid notification setting: ${key}. Valid keys: ${validKeys.join(', ')}`;
            }
            if (typeof value[key] !== 'boolean') {
              return `Notification setting '${key}' must be a boolean`;
            }
          }
          return null;
        },
        
        branding: (value) => {
          if (typeof value !== 'object' || value === null) {
            return 'Branding must be an object';
          }
          
          const validKeys = ['showLogo', 'customColors', 'customFonts'];
          for (const key of Object.keys(value)) {
            if (!validKeys.includes(key)) {
              return `Invalid branding setting: ${key}. Valid keys: ${validKeys.join(', ')}`;
            }
            if (typeof value[key] !== 'boolean') {
              return `Branding setting '${key}' must be a boolean`;
            }
          }
          return null;
        },
        
        features: (value) => {
          if (typeof value !== 'object' || value === null) {
            return 'Features must be an object';
          }
          
          const validKeys = ['clientPortal', 'timeTracking', 'advancedReporting', 'integrations'];
          for (const key of Object.keys(value)) {
            if (!validKeys.includes(key)) {
              return `Invalid feature setting: ${key}. Valid keys: ${validKeys.join(', ')}`;
            }
            if (typeof value[key] !== 'boolean') {
              return `Feature setting '${key}' must be a boolean`;
            }
          }
          return null;
        },
        
        security: (value) => {
          if (typeof value !== 'object' || value === null) {
            return 'Security must be an object';
          }
          
          const validKeys = ['twoFactorAuth', 'sessionTimeout', 'passwordPolicy'];
          for (const key of Object.keys(value)) {
            if (!validKeys.includes(key)) {
              return `Invalid security setting: ${key}. Valid keys: ${validKeys.join(', ')}`;
            }
            
            if (key === 'sessionTimeout') {
              if (typeof value[key] !== 'number' || value[key] < 5 || value[key] > 1440) {
                return 'Session timeout must be a number between 5 and 1440 minutes';
              }
            } else if (key === 'passwordPolicy') {
              const validPolicies = ['basic', 'standard', 'strict'];
              if (!validPolicies.includes(value[key])) {
                return `Password policy must be one of: ${validPolicies.join(', ')}`;
              }
            } else if (typeof value[key] !== 'boolean') {
              return `Security setting '${key}' must be a boolean`;
            }
          }
          return null;
        }
      };
      
      // Validate each setting update
      for (const [key, value] of Object.entries(updates)) {
        if (settingsValidators[key]) {
          const error = settingsValidators[key](value);
          if (error) {
            validationErrors.push({ field: key, error, value });
          } else {
            updatedFields.push(key);
          }
        } else {
          validationErrors.push({ 
            field: key, 
            error: 'Unknown setting key', 
            value,
            availableKeys: Object.keys(settingsValidators)
          });
        }
      }
      
      // Return validation errors if any
      if (validationErrors.length > 0) {
        return res.status(400).json({
          success: false,
          error: 'Settings validation failed',
          code: 'VALIDATION_FAILED',
          validationErrors,
          validFields: updatedFields
        });
      }
      
      // Deep merge settings (preserving nested objects)
      const mergedSettings = JSON.parse(JSON.stringify(currentSettings));
      
      for (const [key, value] of Object.entries(updates)) {
        if (typeof value === 'object' && value !== null && typeof mergedSettings[key] === 'object' && mergedSettings[key] !== null) {
          // Deep merge for object values
          mergedSettings[key] = { ...mergedSettings[key], ...value };
        } else {
          // Direct assignment for primitive values
          mergedSettings[key] = value;
        }
      }
      
      // Update organization settings
      const updatedOrganization = await prisma.organization.update({
        where: { id: organizationId },
        data: { 
          settings: mergedSettings,
          updatedAt: new Date()
        },
        select: {
          id: true,
          name: true,
          settings: true,
          updatedAt: true
        }
      });
      
      res.json({
        success: true,
        data: {
          organizationId,
          organizationName: updatedOrganization.name,
          settings: updatedOrganization.settings,
          lastUpdated: updatedOrganization.updatedAt
        },
        meta: {
          updatedFields,
          totalFields: Object.keys(updates).length,
          mergeStrategy: 'deep',
          validationPassed: true
        },
        message: `Successfully updated ${updatedFields.length} setting${updatedFields.length === 1 ? '' : 's'}`
      });
      
    } catch (error) {
      console.error('Error updating organization settings:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update organization settings',
        code: 'SETTINGS_UPDATE_FAILED',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

/**
 * DELETE /api/organizations/current/settings
 * Reset specific settings to defaults or remove custom settings
 */
router.delete('/current/settings',
  createMultiTenantMiddleware(),
  requireRole(['ADMIN', 'OWNER']),
  async (req, res) => {
    try {
      const organizationId = req.multiTenant?.organizationId || req.organizationId;
      const { keys, resetToDefaults } = req.query;
      
      if (!keys && !resetToDefaults) {
        return res.status(400).json({
          success: false,
          error: 'Either "keys" parameter or "resetToDefaults=true" is required',
          code: 'MISSING_PARAMETERS',
          examples: {
            removeSpecific: '?keys=theme,timezone',
            resetAll: '?resetToDefaults=true'
          }
        });
      }
      
      const organization = await prisma.organization.findUnique({
        where: { id: organizationId },
        select: { settings: true, name: true }
      });
      
      if (!organization) {
        return res.status(404).json({
          success: false,
          error: 'Organization not found',
          code: 'ORG_NOT_FOUND'
        });
      }
      
      let newSettings;
      let removedFields = [];
      
      if (resetToDefaults === 'true') {
        // Reset all settings to empty (will use defaults)
        newSettings = {};
        removedFields = Object.keys(organization.settings || {});
      } else {
        // Remove specific keys
        const keysToRemove = keys.split(',').map(key => key.trim());
        newSettings = { ...(organization.settings || {}) };
        
        keysToRemove.forEach(key => {
          if (newSettings.hasOwnProperty(key)) {
            delete newSettings[key];
            removedFields.push(key);
          }
        });
      }
      
      // Update the organization
      const updatedOrganization = await prisma.organization.update({
        where: { id: organizationId },
        data: { 
          settings: newSettings,
          updatedAt: new Date()
        },
        select: {
          id: true,
          name: true,
          settings: true,
          updatedAt: true
        }
      });
      
      res.json({
        success: true,
        data: {
          organizationId,
          organizationName: updatedOrganization.name,
          settings: updatedOrganization.settings,
          lastUpdated: updatedOrganization.updatedAt
        },
        meta: {
          removedFields,
          resetToDefaults: resetToDefaults === 'true',
          remainingCustomSettings: Object.keys(updatedOrganization.settings || {}).length
        },
        message: resetToDefaults === 'true' 
          ? 'All settings reset to defaults'
          : `Removed ${removedFields.length} setting${removedFields.length === 1 ? '' : 's'}`
      });
      
    } catch (error) {
      console.error('Error resetting organization settings:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to reset organization settings',
        code: 'SETTINGS_RESET_FAILED',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

/**
 * GET /api/organizations/current/settings/schema
 * Get the settings schema/documentation
 */
router.get('/current/settings/schema',
  createMultiTenantMiddleware(),
  requireRole(['ADMIN', 'OWNER', 'MANAGER']),
  async (req, res) => {
    try {
      const settingsSchema = {
        theme: {
          type: 'string',
          description: 'UI theme for the organization',
          validValues: ['light', 'dark', 'blue', 'green', 'purple', 'custom'],
          default: 'blue'
        },
        timezone: {
          type: 'string',
          description: 'Organization timezone for date/time display',
          format: 'IANA timezone identifier',
          default: 'UTC',
          examples: ['America/New_York', 'Europe/London', 'Asia/Tokyo']
        },
        currency: {
          type: 'string',
          description: 'Default currency for financial operations',
          validValues: ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'CHF', 'CNY'],
          default: 'USD'
        },
        dateFormat: {
          type: 'string',
          description: 'Date display format',
          validValues: ['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD', 'MMM DD, YYYY'],
          default: 'MM/DD/YYYY'
        },
        timeFormat: {
          type: 'string',
          description: 'Time display format',
          validValues: ['12h', '24h'],
          default: '12h'
        },
        language: {
          type: 'string',
          description: 'Interface language',
          validValues: ['en', 'es', 'fr', 'de', 'it', 'pt', 'zh', 'ja'],
          default: 'en'
        },
        notifications: {
          type: 'object',
          description: 'Notification preferences',
          properties: {
            email: { type: 'boolean', description: 'Email notifications', default: true },
            sms: { type: 'boolean', description: 'SMS notifications', default: false },
            push: { type: 'boolean', description: 'Push notifications', default: true },
            projectUpdates: { type: 'boolean', description: 'Project update notifications', default: true },
            taskReminders: { type: 'boolean', description: 'Task reminder notifications', default: true },
            invoiceReminders: { type: 'boolean', description: 'Invoice reminder notifications', default: true }
          }
        },
        branding: {
          type: 'object',
          description: 'Branding customization options',
          properties: {
            showLogo: { type: 'boolean', description: 'Display organization logo', default: true },
            customColors: { type: 'boolean', description: 'Use custom brand colors', default: false },
            customFonts: { type: 'boolean', description: 'Use custom fonts', default: false }
          }
        },
        features: {
          type: 'object',
          description: 'Feature toggles',
          properties: {
            clientPortal: { type: 'boolean', description: 'Enable client portal', default: true },
            timeTracking: { type: 'boolean', description: 'Enable time tracking', default: true },
            advancedReporting: { type: 'boolean', description: 'Enable advanced reporting', default: false },
            integrations: { type: 'boolean', description: 'Enable third-party integrations', default: true }
          }
        },
        security: {
          type: 'object',
          description: 'Security settings',
          properties: {
            twoFactorAuth: { type: 'boolean', description: 'Require two-factor authentication', default: false },
            sessionTimeout: { 
              type: 'number', 
              description: 'Session timeout in minutes', 
              minimum: 5, 
              maximum: 1440, 
              default: 480 
            },
            passwordPolicy: { 
              type: 'string', 
              description: 'Password complexity policy',
              validValues: ['basic', 'standard', 'strict'], 
              default: 'standard' 
            }
          }
        }
      };
      
      res.json({
        success: true,
        data: {
          schema: settingsSchema,
          version: '1.0',
          totalCategories: Object.keys(settingsSchema).length
        },
        meta: {
          description: 'Organization settings schema and validation rules',
          usage: {
            get: 'GET /api/organizations/current/settings',
            update: 'PATCH /api/organizations/current/settings',
            reset: 'DELETE /api/organizations/current/settings'
          }
        }
      });
      
    } catch (error) {
      console.error('Error fetching settings schema:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch settings schema',
        code: 'SCHEMA_FETCH_FAILED'
      });
    }
  }
);

/**
 * PUT /api/organizations/current/settings/bulk
 * Bulk update organization settings with validation and rollback support
 */
router.put('/current/settings/bulk',
  createMultiTenantMiddleware(),
  requireRole(['ADMIN', 'OWNER']),
  async (req, res) => {
    try {
      const organizationId = req.multiTenant?.organizationId || req.organizationId;
      const { settings, merge = true, validate = true } = req.body;
      
      if (!settings || typeof settings !== 'object') {
        return res.status(400).json({
          success: false,
          error: 'Settings object is required',
          code: 'MISSING_SETTINGS',
          format: {
            settings: { theme: 'dark', currency: 'EUR' },
            merge: true, // optional: merge with existing (default) or replace
            validate: true // optional: validate settings (default)
          }
        });
      }
      
      const organization = await prisma.organization.findUnique({
        where: { id: organizationId },
        select: { settings: true, name: true }
      });
      
      if (!organization) {
        return res.status(404).json({
          success: false,
          error: 'Organization not found',
          code: 'ORG_NOT_FOUND'
        });
      }
      
      let finalSettings;
      let validationErrors = [];
      let processedFields = [];
      
      // Validation (if enabled)
      if (validate) {
        const settingCategories = ['theme', 'timezone', 'currency', 'dateFormat', 'timeFormat', 'language', 'notifications', 'branding', 'features', 'security'];
        
        for (const [key, value] of Object.entries(settings)) {
          if (!settingCategories.includes(key)) {
            validationErrors.push({
              field: key,
              error: 'Unknown setting category',
              availableCategories: settingCategories
            });
          } else {
            processedFields.push(key);
          }
        }
        
        if (validationErrors.length > 0) {
          return res.status(400).json({
            success: false,
            error: 'Bulk settings validation failed',
            code: 'BULK_VALIDATION_FAILED',
            validationErrors,
            processedFields
          });
        }
      }
      
      // Apply settings based on merge strategy
      if (merge) {
        // Merge with existing settings
        finalSettings = JSON.parse(JSON.stringify(organization.settings || {}));
        
        for (const [key, value] of Object.entries(settings)) {
          if (typeof value === 'object' && value !== null && typeof finalSettings[key] === 'object' && finalSettings[key] !== null) {
            finalSettings[key] = { ...finalSettings[key], ...value };
          } else {
            finalSettings[key] = value;
          }
        }
      } else {
        // Replace all settings
        finalSettings = { ...settings };
      }
      
      // Update organization
      const updatedOrganization = await prisma.organization.update({
        where: { id: organizationId },
        data: { 
          settings: finalSettings,
          updatedAt: new Date()
        },
        select: {
          id: true,
          name: true,
          settings: true,
          updatedAt: true
        }
      });
      
      res.json({
        success: true,
        data: {
          organizationId,
          organizationName: updatedOrganization.name,
          settings: updatedOrganization.settings,
          lastUpdated: updatedOrganization.updatedAt
        },
        meta: {
          processedFields,
          totalFields: Object.keys(settings).length,
          strategy: merge ? 'merge' : 'replace',
          validationEnabled: validate,
          backupAvailable: true // You could implement backup/rollback functionality
        },
        message: `Bulk update completed for ${processedFields.length} setting${processedFields.length === 1 ? '' : 's'}`
      });
      
    } catch (error) {
      console.error('Error in bulk settings update:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to perform bulk settings update',
        code: 'BULK_UPDATE_FAILED',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

/**
 * ========================================
 * SUPER ADMIN ORGANIZATION MANAGEMENT API
 * ========================================
 */

/**
 * GET /api/organizations/admin/all
 * Get all organizations with pagination, filtering, and sorting (Super Admin only)
 */
router.get('/admin/all', requireSuperAdmin, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      status,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      includeUsers = false,
      includeStats = false
    } = req.query;

    // Validate pagination parameters
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit))); // Max 100 per page
    const offset = (pageNum - 1) * limitNum;

    // Build where clause for filtering
    const where = {};
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    if (status) {
      if (status === 'active') {
        where.isActive = true;
      } else if (status === 'inactive') {
        where.isActive = false;
      }
    }

    // Validate sort field
    const allowedSortFields = ['name', 'code', 'createdAt', 'updatedAt', 'isActive'];
    const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
    const sortDirection = sortOrder.toLowerCase() === 'asc' ? 'asc' : 'desc';

    // Build select clause
    const select = {
      id: true,
      name: true,
      code: true,
      settings: true,
      primaryColor: true,
      logo: true,
      isActive: true,
      createdAt: true,
      updatedAt: true
    };

    if (includeUsers === 'true') {
      select.users = {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          organizationRole: true,
          isActive: true,
          createdAt: true
        }
      };
    }

    if (includeStats === 'true') {
      select._count = {
        select: {
          users: true
        }
      };
    }

    // Get organizations with pagination
    const [organizations, totalCount] = await Promise.all([
      prisma.organization.findMany({
        where,
        select,
        orderBy: { [sortField]: sortDirection },
        skip: offset,
        take: limitNum
      }),
      prisma.organization.count({ where })
    ]);

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limitNum);
    const hasNext = pageNum < totalPages;
    const hasPrev = pageNum > 1;

    // Create audit log entry
    console.log(`[SUPER_ADMIN_ACTION] User ${req.user.id} viewed organization list - Page: ${pageNum}, Total: ${totalCount}`);

    res.json({
      success: true,
      data: {
        organizations,
        pagination: {
          currentPage: pageNum,
          totalPages,
          totalCount,
          limit: limitNum,
          hasNext,
          hasPrev
        },
        filters: {
          search: search || null,
          status: status || 'all',
          sortBy: sortField,
          sortOrder: sortDirection
        }
      },
      meta: {
        timestamp: new Date(),
        adminUserId: req.user.id,
        includeUsers: includeUsers === 'true',
        includeStats: includeStats === 'true'
      }
    });

  } catch (error) {
    console.error('Error fetching organizations for super admin:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch organizations',
      code: 'ADMIN_FETCH_FAILED',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/organizations/admin/:organizationId
 * Get detailed organization information (Super Admin only)
 */
router.get('/admin/:organizationId', requireSuperAdmin, async (req, res) => {
  try {
    const { organizationId } = req.params;
    const { includeUsers = false, includeStats = false } = req.query;

    if (!organizationId) {
      return res.status(400).json({
        success: false,
        error: 'Organization ID is required',
        code: 'MISSING_ORG_ID'
      });
    }

    // Build select clause
    const select = {
      id: true,
      name: true,
      code: true,
      settings: true,
      primaryColor: true,
      logo: true,
      isActive: true,
      createdAt: true,
      updatedAt: true
    };

    if (includeUsers === 'true') {
      select.users = {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          role: true,
          organizationRole: true,
          isActive: true,
          createdAt: true,
          updatedAt: true
        },
        orderBy: { createdAt: 'asc' }
      };
    }

    if (includeStats === 'true') {
      select._count = {
        select: {
          users: true
        }
      };
    }

    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      select
    });

    if (!organization) {
      return res.status(404).json({
        success: false,
        error: 'Organization not found',
        code: 'ORG_NOT_FOUND'
      });
    }

    // Create audit log entry
    console.log(`[SUPER_ADMIN_ACTION] User ${req.user.id} viewed organization ${organizationId} details`);

    res.json({
      success: true,
      data: {
        organization
      },
      meta: {
        timestamp: new Date(),
        adminUserId: req.user.id,
        includeUsers: includeUsers === 'true',
        includeStats: includeStats === 'true'
      }
    });

  } catch (error) {
    console.error('Error fetching organization details for super admin:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch organization details',
      code: 'ADMIN_DETAIL_FETCH_FAILED',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * PATCH /api/organizations/admin/:organizationId
 * Update organization (Super Admin only)
 */
router.patch('/admin/:organizationId', requireSuperAdmin, async (req, res) => {
  try {
    const { organizationId } = req.params;
    const { name, settings, primaryColor, logo, isActive, reason } = req.body;

    if (!organizationId) {
      return res.status(400).json({
        success: false,
        error: 'Organization ID is required',
        code: 'MISSING_ORG_ID'
      });
    }

    // Check if organization exists
    const existingOrg = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { id: true, name: true, isActive: true }
    });

    if (!existingOrg) {
      return res.status(404).json({
        success: false,
        error: 'Organization not found',
        code: 'ORG_NOT_FOUND'
      });
    }

    // Build update data
    const updateData = { updatedAt: new Date() };
    const updatedFields = [];

    // Validate and process name
    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length < 2) {
        return res.status(400).json({
          success: false,
          error: 'Organization name must be at least 2 characters long',
          code: 'INVALID_NAME'
        });
      }

      if (name.trim().length > 100) {
        return res.status(400).json({
          success: false,
          error: 'Organization name cannot exceed 100 characters',
          code: 'NAME_TOO_LONG'
        });
      }

      // Check for duplicate name (excluding current organization)
      const duplicateName = await prisma.organization.findFirst({
        where: {
          name: name.trim(),
          id: { not: organizationId },
          isActive: true
        }
      });

      if (duplicateName) {
        return res.status(409).json({
          success: false,
          error: 'Organization name already exists',
          code: 'DUPLICATE_NAME'
        });
      }

      updateData.name = name.trim();
      updatedFields.push('name');
    }

    // Validate and process settings
    if (settings !== undefined) {
      if (settings !== null && typeof settings !== 'object') {
        return res.status(400).json({
          success: false,
          error: 'Settings must be an object or null',
          code: 'INVALID_SETTINGS_TYPE'
        });
      }

      updateData.settings = settings;
      updatedFields.push('settings');
    }

    // Validate and process primaryColor
    if (primaryColor !== undefined) {
      if (primaryColor !== null) {
        const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
        if (!hexColorRegex.test(primaryColor)) {
          return res.status(400).json({
            success: false,
            error: 'Primary color must be a valid hex color (e.g., #FF5733 or #F57)',
            code: 'INVALID_COLOR_FORMAT'
          });
        }
      }

      updateData.primaryColor = primaryColor;
      updatedFields.push('primaryColor');
    }

    // Validate and process logo
    if (logo !== undefined) {
      if (logo !== null) {
        try {
          new URL(logo);
        } catch {
          return res.status(400).json({
            success: false,
            error: 'Logo must be a valid URL or null',
            code: 'INVALID_LOGO_URL'
          });
        }
      }

      updateData.logo = logo;
      updatedFields.push('logo');
    }

    // Validate and process isActive
    if (isActive !== undefined) {
      if (typeof isActive !== 'boolean') {
        return res.status(400).json({
          success: false,
          error: 'isActive must be a boolean value',
          code: 'INVALID_ACTIVE_TYPE'
        });
      }

      updateData.isActive = isActive;
      updatedFields.push('isActive');
    }

    if (updatedFields.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No valid fields provided for update',
        code: 'NO_UPDATE_FIELDS',
        availableFields: ['name', 'settings', 'primaryColor', 'logo', 'isActive']
      });
    }

    // Update organization
    const updatedOrganization = await prisma.organization.update({
      where: { id: organizationId },
      data: updateData,
      select: {
        id: true,
        name: true,
        code: true,
        isActive: true,
        settings: true,
        updatedAt: true
      }
    });

    // Create comprehensive audit log entry
    const auditMessage = `[SUPER_ADMIN_ACTION] User ${req.user.id} updated organization ${organizationId} (${existingOrg.name}). Updated fields: ${updatedFields.join(', ')}. Reason: ${reason || 'Not provided'}`;
    console.log(auditMessage);

    res.json({
      success: true,
      data: {
        organization: updatedOrganization
      },
      meta: {
        updatedFields,
        timestamp: new Date(),
        adminUserId: req.user.id,
        reason: reason || null,
        previousStatus: existingOrg.isActive,
        newStatus: updatedOrganization.isActive
      },
      message: `Organization updated successfully. ${updatedFields.length} field${updatedFields.length === 1 ? '' : 's'} modified.`
    });

  } catch (error) {
    console.error('Error updating organization for super admin:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update organization',
      code: 'ADMIN_UPDATE_FAILED',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * DELETE /api/organizations/admin/:organizationId
 * Delete organization (Super Admin only)
 */
router.delete('/admin/:organizationId', requireSuperAdmin, async (req, res) => {
  try {
    const { organizationId } = req.params;
    const { force = false, reason } = req.body;

    if (!organizationId) {
      return res.status(400).json({
        success: false,
        error: 'Organization ID is required',
        code: 'MISSING_ORG_ID'
      });
    }

    // Check if organization exists
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { 
        id: true, 
        name: true, 
        isActive: true,
        _count: { select: { users: true } }
      }
    });

    if (!organization) {
      return res.status(404).json({
        success: false,
        error: 'Organization not found',
        code: 'ORG_NOT_FOUND'
      });
    }

    // Prevent deletion if organization has active users (unless forced)
    if (organization._count.users > 0 && !force) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete organization with active users. Use force=true to override.',
        code: 'ORG_HAS_USERS',
        data: {
          organizationName: organization.name,
          userCount: organization._count.users,
          suggestion: 'Consider deactivating the organization instead, or use force deletion with caution'
        }
      });
    }

    let deletionResult;
    
    if (force) {
      // Hard delete - remove organization and all related data
      deletionResult = await prisma.$transaction(async (tx) => {
        // Delete UserOrganization relationships
        await tx.userOrganization.deleteMany({
          where: { organizationId }
        });

        // Delete users belonging to this organization
        await tx.user.deleteMany({
          where: { organizationId }
        });

        // Delete the organization
        const deletedOrg = await tx.organization.delete({
          where: { id: organizationId }
        });

        return { type: 'hard_delete', organization: deletedOrg };
      });

      console.log(`[SUPER_ADMIN_ACTION] User ${req.user.id} FORCE DELETED organization ${organizationId} (${organization.name}) with ${organization._count.users} users. Reason: ${reason || 'Not provided'}`);
    } else {
      // Soft delete - just mark as inactive
      deletionResult = await prisma.organization.update({
        where: { id: organizationId },
        data: { 
          isActive: false,
          updatedAt: new Date()
        }
      });

      console.log(`[SUPER_ADMIN_ACTION] User ${req.user.id} DEACTIVATED organization ${organizationId} (${organization.name}). Reason: ${reason || 'Not provided'}`);
      deletionResult = { type: 'soft_delete', organization: deletionResult };
    }

    res.json({
      success: true,
      data: {
        deletionType: deletionResult.type,
        organization: {
          id: organization.id,
          name: organization.name,
          usersAffected: organization._count.users
        }
      },
      meta: {
        timestamp: new Date(),
        adminUserId: req.user.id,
        reason: reason || null,
        forced: force,
        usersDeleted: force ? organization._count.users : 0
      },
      message: force 
        ? `Organization permanently deleted along with ${organization._count.users} user(s)` 
        : 'Organization deactivated successfully'
    });

  } catch (error) {
    console.error('Error deleting organization for super admin:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete organization',
      code: 'ADMIN_DELETE_FAILED',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * PATCH /api/organizations/admin/:organizationId/status
 * Change organization status (active/suspended/inactive) (Super Admin only)
 */
router.patch('/admin/:organizationId/status', requireSuperAdmin, async (req, res) => {
  try {
    const { organizationId } = req.params;
    const { status, reason } = req.body;

    if (!organizationId) {
      return res.status(400).json({
        success: false,
        error: 'Organization ID is required',
        code: 'MISSING_ORG_ID'
      });
    }

    // Validate status
    const validStatuses = ['active', 'inactive', 'suspended'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Valid status is required',
        code: 'INVALID_STATUS',
        validStatuses
      });
    }

    // Check if organization exists
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { 
        id: true, 
        name: true, 
        isActive: true,
        settings: true
      }
    });

    if (!organization) {
      return res.status(404).json({
        success: false,
        error: 'Organization not found',
        code: 'ORG_NOT_FOUND'
      });
    }

    // Determine update data based on status
    let updateData = { updatedAt: new Date() };
    let statusDescription;
    
    switch (status) {
      case 'active':
        updateData.isActive = true;
        updateData.settings = {
          ...organization.settings,
          suspended: false,
          suspensionReason: null
        };
        statusDescription = 'activated';
        break;
        
      case 'inactive':
        updateData.isActive = false;
        updateData.settings = {
          ...organization.settings,
          suspended: false,
          suspensionReason: null
        };
        statusDescription = 'deactivated';
        break;
        
      case 'suspended':
        updateData.isActive = false;
        updateData.settings = {
          ...organization.settings,
          suspended: true,
          suspensionReason: reason || 'Suspended by admin',
          suspendedAt: new Date()
        };
        statusDescription = 'suspended';
        break;
    }

    // Update organization
    const updatedOrganization = await prisma.organization.update({
      where: { id: organizationId },
      data: updateData,
      select: {
        id: true,
        name: true,
        code: true,
        isActive: true,
        settings: true,
        updatedAt: true
      }
    });

    // Create comprehensive audit log entry
    const auditMessage = `[SUPER_ADMIN_ACTION] User ${req.user.id} ${statusDescription} organization ${organizationId} (${organization.name}). Previous status: ${organization.isActive ? 'active' : 'inactive'}. Reason: ${reason || 'Not provided'}`;
    console.log(auditMessage);

    res.json({
      success: true,
      data: {
        organization: updatedOrganization
      },
      meta: {
        previousStatus: organization.isActive ? 'active' : 'inactive',
        newStatus: status,
        timestamp: new Date(),
        adminUserId: req.user.id,
        reason: reason || null
      },
      message: `Organization ${statusDescription} successfully`
    });

  } catch (error) {
    console.error('Error changing organization status for super admin:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to change organization status',
      code: 'ADMIN_STATUS_CHANGE_FAILED',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/organizations/admin/:organizationId/audit
 * Get organization audit log (Super Admin only)
 */
router.get('/admin/:organizationId/audit', requireSuperAdmin, async (req, res) => {
  try {
    const { organizationId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    if (!organizationId) {
      return res.status(400).json({
        success: false,
        error: 'Organization ID is required',
        code: 'MISSING_ORG_ID'
      });
    }

    // Check if organization exists
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { id: true, name: true }
    });

    if (!organization) {
      return res.status(404).json({
        success: false,
        error: 'Organization not found',
        code: 'ORG_NOT_FOUND'
      });
    }

    // For now, return a placeholder audit trail
    // In a real application, you'd have a dedicated audit log table
    const auditEntries = [
      {
        id: '1',
        action: 'ORGANIZATION_CREATED',
        timestamp: new Date(),
        adminUserId: 'system',
        details: 'Organization created',
        changes: {}
      }
    ];

    res.json({
      success: true,
      data: {
        organizationId,
        organizationName: organization.name,
        auditEntries,
        pagination: {
          currentPage: parseInt(page),
          totalPages: 1,
          totalEntries: auditEntries.length,
          limit: parseInt(limit)
        }
      },
      meta: {
        timestamp: new Date(),
        adminUserId: req.user.id,
        note: 'Audit logging is currently implemented via console logs. Consider implementing a dedicated audit table for production use.'
      }
    });

  } catch (error) {
    console.error('Error fetching organization audit log for super admin:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch audit log',
      code: 'ADMIN_AUDIT_FETCH_FAILED',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * Helper function to generate organization code
 */
function generateOrgCode(name) {
  // Generate a code from the organization name
  const baseCode = name
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .substring(0, 8);
  
  // Add random suffix to ensure uniqueness
  const randomSuffix = Math.random().toString(36).substring(2, 5).toUpperCase();
  
  return `${baseCode}${randomSuffix}`;
}

export default router; 