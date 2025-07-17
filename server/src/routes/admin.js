import express from 'express';
import { PrismaClient } from '@prisma/client';
import { isAuthenticated, authorize } from '../middleware/auth.js';
import { logEvent, getAuditLogs } from '../services/auditLogService.js';
import { isSuperAdmin } from '../middleware/superAdmin.js';
import { requireRole } from '../middleware/permission.js';

const router = express.Router();
const prisma = new PrismaClient();

// Apply auth middleware to all routes
router.use(isAuthenticated);

// Apply authorization middleware for admin/owner access
const requireAdmin = authorize(['ORG_ADMIN', 'OWNER']);

// GET /api/admin/users - Get users in current organization
router.get('/users', requireAdmin, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      where: {
        organizationId: req.user.organizationId || null,
        isActive: true
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        createdAt: true,
        lastLoginAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch users'
    });
  }
});

// PUT /api/admin/users/:id/role - Update user role (admin only, cannot assign SUPER_ADMIN)
router.put('/users/:id/role', requireAdmin, requireRole('ORG_ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    if (role === 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'Cannot assign SUPER_ADMIN role' });
    }
    const user = await prisma.user.update({
      where: { id, organizationId: req.user.organizationId },
      data: { role },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        organizationId: true
      }
    });
    // Audit log
    await logEvent({
      userId: req.user?.id || null,
      organizationId: req.user.organizationId,
      action: 'UPDATE_USER_ROLE',
      targetType: 'User',
      targetId: user.id,
      details: { role },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });
    res.json({ data: user });
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({ error: 'Failed to update user role' });
  }
});

// GET /api/admin/projects - Get projects in current organization
router.get('/projects', requireAdmin, async (req, res) => {
  try {
    const projects = await prisma.project.findMany({
      where: {
        organizationId: req.user.organizationId || null
      },
      select: {
        id: true,
        name: true,
        status: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({
      success: true,
      data: projects
    });
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({
      success: false,
      data: [] // Return empty array on error
    });
  }
});

// GET /api/admin/clients - Get clients in current organization
router.get('/clients', requireAdmin, async (req, res) => {
  try {
    const clients = await prisma.client.findMany({
      where: {
        organizationId: req.user.organizationId || null
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({
      success: true,
      data: clients
    });
  } catch (error) {
    console.error('Get clients error:', error);
    res.status(500).json({
      success: false,
      data: [] // Return empty array on error
    });
  }
});

// GET /api/admin/overview - Get basic dashboard stats
router.get('/overview', requireAdmin, async (req, res) => {
  try {
    const organizationId = req.user.organizationId;
    
    const [userCount, projectCount, clientCount] = await Promise.all([
      prisma.user.count({
        where: {
          organizationId: organizationId,
          isActive: true
        }
      }),
      prisma.project.count({
        where: {
          organizationId: organizationId
        }
      }),
      prisma.client.count({
        where: {
          organizationId: organizationId
        }
      })
    ]);

    res.json({
      success: true,
      data: {
        totalUsers: userCount,
        totalProjects: projectCount,
        totalClients: clientCount
      }
    });
  } catch (error) {
    console.error('Get overview error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch overview data'
    });
  }
});

// GET /api/admin/audit-logs - Fetch audit logs (super admin only)
router.get('/audit-logs', isSuperAdmin, async (req, res) => {
  console.log('[audit-logs handler] Entered handler');
  console.log('[audit-logs handler] req.user:', req.user);
  console.log('[audit-logs handler] req.headers:', req.headers);
  try {
    const { userId, organizationId, action, targetType, startDate, endDate, skip = 0, take = 50 } = req.query;
    const filters = {};
    if (userId) filters.userId = userId;
    if (organizationId) filters.organizationId = organizationId;
    if (action) filters.action = action;
    if (targetType) filters.targetType = targetType;
    if (startDate || endDate) {
      filters.createdAt = {};
      if (startDate) filters.createdAt.gte = new Date(startDate);
      if (endDate) filters.createdAt.lte = new Date(endDate);
    }
    const logs = await getAuditLogs({ filters, skip: Number(skip), take: Number(take) });
    res.json({ success: true, data: logs });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch audit logs' });
  }
});

export default router; 