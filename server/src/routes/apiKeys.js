import express from 'express';
import { PrismaClient } from '@prisma/client';
import { isAuthenticated } from '../middleware/auth.js';
import { isSuperAdmin } from '../middleware/superAdmin.js';
import { logEvent } from '../services/auditLogService.js';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

const router = express.Router();
const prisma = new PrismaClient();

// Generate a secure API key
const generateApiKey = () => {
  return `crm_${crypto.randomBytes(32).toString('hex')}`;
};

// Hash API key for storage
const hashApiKey = async (apiKey) => {
  return await bcrypt.hash(apiKey, 12);
};

// Verify API key
const verifyApiKey = async (apiKey, hashedKey) => {
  return await bcrypt.compare(apiKey, hashedKey);
};

// @desc    Get all API keys for user/organization
// @route   GET /api/api-keys
// @access  Private (Super Admin & Manager)
router.get('/', isAuthenticated, async (req, res) => {
  try {
    const userId = req.user.id;
    const isSuperAdminUser = req.user.role === 'SUPER_ADMIN';
    
    let whereClause = { userId };
    
    // Super admins can see all API keys, managers see organization keys
    if (!isSuperAdminUser) {
      whereClause.organizationId = req.user.organizationId;
    }

    const apiKeys = await prisma.apiKey.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true
          }
        },
        organization: {
          select: {
            id: true,
            name: true,
            code: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Remove the actual key hash from response for security
    const safeApiKeys = apiKeys.map(key => ({
      id: key.id,
      name: key.name,
      key: `${key.key.substring(0, 8)}...${key.key.substring(key.key.length - 4)}`,
      userId: key.userId,
      organizationId: key.organizationId,
      permissions: key.permissions,
      isActive: key.isActive,
      lastUsedAt: key.lastUsedAt,
      expiresAt: key.expiresAt,
      createdAt: key.createdAt,
      updatedAt: key.updatedAt,
      user: key.user,
      organization: key.organization
    }));

    res.json({
      success: true,
      data: safeApiKeys
    });
  } catch (error) {
    console.error('Error fetching API keys:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch API keys'
    });
  }
});

// @desc    Create new API key
// @route   POST /api/api-keys
// @access  Private (Super Admin & Manager)
router.post('/', isAuthenticated, async (req, res) => {
  try {
    const { name, permissions = [], expiresAt } = req.body;
    const userId = req.user.id;
    const isSuperAdminUser = req.user.role === 'SUPER_ADMIN';

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'API key name is required'
      });
    }

    // Generate API key
    const apiKey = generateApiKey();
    const hashedKey = await hashApiKey(apiKey);

    // Create API key record
    const newApiKey = await prisma.apiKey.create({
      data: {
        name,
        key: hashedKey,
        userId,
        organizationId: isSuperAdminUser ? null : req.user.organizationId,
        permissions,
        expiresAt: expiresAt ? new Date(expiresAt) : null
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true
          }
        },
        organization: {
          select: {
            id: true,
            name: true,
            code: true
          }
        }
      }
    });

    // Log the action
    await logEvent({
      userId: req.user.id,
      organizationId: req.user.organizationId,
      action: 'API_KEY_CREATED',
      targetType: 'ApiKey',
      targetId: newApiKey.id,
      details: { name, permissions },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    // Return the full API key only once for the user to copy
    res.json({
      success: true,
      message: 'API key created successfully',
      data: {
        id: newApiKey.id,
        name: newApiKey.name,
        key: apiKey, // Full key for one-time display
        userId: newApiKey.userId,
        organizationId: newApiKey.organizationId,
        permissions: newApiKey.permissions,
        isActive: newApiKey.isActive,
        expiresAt: newApiKey.expiresAt,
        createdAt: newApiKey.createdAt,
        user: newApiKey.user,
        organization: newApiKey.organization
      }
    });
  } catch (error) {
    console.error('Error creating API key:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create API key'
    });
  }
});

// @desc    Update API key
// @route   PUT /api/api-keys/:id
// @access  Private (Super Admin & Manager)
router.put('/:id', isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, permissions, isActive, expiresAt } = req.body;
    const userId = req.user.id;
    const isSuperAdminUser = req.user.role === 'SUPER_ADMIN';

    // Find the API key
    const apiKey = await prisma.apiKey.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true
          }
        }
      }
    });

    if (!apiKey) {
      return res.status(404).json({
        success: false,
        message: 'API key not found'
      });
    }

    // Check permissions
    if (!isSuperAdminUser && apiKey.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Update API key
    const updatedApiKey = await prisma.apiKey.update({
      where: { id },
      data: {
        name: name || apiKey.name,
        permissions: permissions || apiKey.permissions,
        isActive: isActive !== undefined ? isActive : apiKey.isActive,
        expiresAt: expiresAt ? new Date(expiresAt) : apiKey.expiresAt
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true
          }
        },
        organization: {
          select: {
            id: true,
            name: true,
            code: true
          }
        }
      }
    });

    // Log the action
    await logEvent({
      userId: req.user.id,
      organizationId: req.user.organizationId,
      action: 'API_KEY_UPDATED',
      targetType: 'ApiKey',
      targetId: id,
      details: { name, permissions, isActive },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.json({
      success: true,
      message: 'API key updated successfully',
      data: {
        id: updatedApiKey.id,
        name: updatedApiKey.name,
        key: `${updatedApiKey.key.substring(0, 8)}...${updatedApiKey.key.substring(updatedApiKey.key.length - 4)}`,
        userId: updatedApiKey.userId,
        organizationId: updatedApiKey.organizationId,
        permissions: updatedApiKey.permissions,
        isActive: updatedApiKey.isActive,
        expiresAt: updatedApiKey.expiresAt,
        createdAt: updatedApiKey.createdAt,
        updatedAt: updatedApiKey.updatedAt,
        user: updatedApiKey.user,
        organization: updatedApiKey.organization
      }
    });
  } catch (error) {
    console.error('Error updating API key:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update API key'
    });
  }
});

// @desc    Delete API key
// @route   DELETE /api/api-keys/:id
// @access  Private (Super Admin & Manager)
router.delete('/:id', isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const isSuperAdminUser = req.user.role === 'SUPER_ADMIN';

    // Find the API key
    const apiKey = await prisma.apiKey.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true
          }
        }
      }
    });

    if (!apiKey) {
      return res.status(404).json({
        success: false,
        message: 'API key not found'
      });
    }

    // Check permissions
    if (!isSuperAdminUser && apiKey.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Delete API key
    await prisma.apiKey.delete({
      where: { id }
    });

    // Log the action
    await logEvent({
      userId: req.user.id,
      organizationId: req.user.organizationId,
      action: 'API_KEY_DELETED',
      targetType: 'ApiKey',
      targetId: id,
      details: { name: apiKey.name },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.json({
      success: true,
      message: 'API key deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting API key:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete API key'
    });
  }
});

// @desc    Regenerate API key
// @route   POST /api/api-keys/:id/regenerate
// @access  Private (Super Admin & Manager)
router.post('/:id/regenerate', isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const isSuperAdminUser = req.user.role === 'SUPER_ADMIN';

    // Find the API key
    const apiKey = await prisma.apiKey.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true
          }
        }
      }
    });

    if (!apiKey) {
      return res.status(404).json({
        success: false,
        message: 'API key not found'
      });
    }

    // Check permissions
    if (!isSuperAdminUser && apiKey.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Generate new API key
    const newApiKey = generateApiKey();
    const hashedKey = await hashApiKey(newApiKey);

    // Update API key
    const updatedApiKey = await prisma.apiKey.update({
      where: { id },
      data: {
        key: hashedKey,
        lastUsedAt: null // Reset last used since it's a new key
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true
          }
        },
        organization: {
          select: {
            id: true,
            name: true,
            code: true
          }
        }
      }
    });

    // Log the action
    await logEvent({
      userId: req.user.id,
      organizationId: req.user.organizationId,
      action: 'API_KEY_REGENERATED',
      targetType: 'ApiKey',
      targetId: id,
      details: { name: apiKey.name },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.json({
      success: true,
      message: 'API key regenerated successfully',
      data: {
        id: updatedApiKey.id,
        name: updatedApiKey.name,
        key: newApiKey, // Full new key for one-time display
        userId: updatedApiKey.userId,
        organizationId: updatedApiKey.organizationId,
        permissions: updatedApiKey.permissions,
        isActive: updatedApiKey.isActive,
        expiresAt: updatedApiKey.expiresAt,
        createdAt: updatedApiKey.createdAt,
        updatedAt: updatedApiKey.updatedAt,
        user: updatedApiKey.user,
        organization: updatedApiKey.organization
      }
    });
  } catch (error) {
    console.error('Error regenerating API key:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to regenerate API key'
    });
  }
});

// @desc    Get API key usage statistics
// @route   GET /api/api-keys/:id/stats
// @access  Private (Super Admin & Manager)
router.get('/:id/stats', isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const isSuperAdminUser = req.user.role === 'SUPER_ADMIN';

    // Find the API key
    const apiKey = await prisma.apiKey.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true
          }
        }
      }
    });

    if (!apiKey) {
      return res.status(404).json({
        success: false,
        message: 'API key not found'
      });
    }

    // Check permissions
    if (!isSuperAdminUser && apiKey.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Get usage statistics from audit logs
    const usageStats = await prisma.auditLog.groupBy({
      by: ['action'],
      where: {
        details: {
          path: ['apiKeyId'],
          equals: id
        }
      },
      _count: {
        action: true
      }
    });

    res.json({
      success: true,
      data: {
        apiKey: {
          id: apiKey.id,
          name: apiKey.name,
          isActive: apiKey.isActive,
          lastUsedAt: apiKey.lastUsedAt,
          expiresAt: apiKey.expiresAt,
          createdAt: apiKey.createdAt
        },
        usageStats: usageStats.map(stat => ({
          action: stat.action,
          count: stat._count.action
        }))
      }
    });
  } catch (error) {
    console.error('Error fetching API key stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch API key statistics'
    });
  }
});

export default router; 