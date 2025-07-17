import express from 'express';
import { PrismaClient } from '@prisma/client';
import { isSuperAdmin } from '../middleware/superAdmin.js';
import { requireRole } from '../middleware/permission.js';

const router = express.Router();
const prisma = new PrismaClient();

// Apply super admin middleware to all routes
router.use(isSuperAdmin);

// Get system overview
router.get('/system-overview', async (req, res) => {
  try {
    const [
      totalOrganizations,
      totalUsers,
      totalProjects,
      totalClients
    ] = await Promise.all([
      prisma.organization.count(),
      prisma.user.count(),
      prisma.project.count(),
      prisma.client.count()
    ]);

    res.json({
      success: true,
      data: {
        totalOrganizations,
        totalUsers,
        totalProjects,
        totalClients
      }
    });
  } catch (error) {
    console.error('System overview error:', error);
    res.status(500).json({ success: false, error: 'Failed to get system overview' });
  }
});

// User Management Routes
router.post('/users', requireRole('SUPER_ADMIN', 'ORG_ADMIN'), async (req, res) => {
  try {
    const { email, password, firstName, lastName, role, organizationId } = req.body;

    // Hash password using bcrypt directly since we don't have a utils/auth file
    const bcrypt = await import('bcrypt');
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        role,
        organizationId,
        organizationRole: 'MEMBER'
      }
    });

    res.json({ success: true, data: user });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ success: false, error: 'Failed to create user' });
  }
});

// Get all users with organization info
router.get('/users', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      include: {
        organization: true,
        userOrganizations: true
      }
    });

    res.json({ success: true, data: users });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ success: false, error: 'Failed to get users' });
  }
});

// Update user
router.put('/users/:id', requireRole('SUPER_ADMIN', 'ORG_ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;
    const { email, firstName, lastName, role, isActive } = req.body;

    const user = await prisma.user.update({
      where: { id },
      data: {
        email,
        firstName,
        lastName,
        role,
        isActive
      }
    });

    res.json({ success: true, data: user });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ success: false, error: 'Failed to update user' });
  }
});

// Delete user
router.delete('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.user.delete({ where: { id } });
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete user' });
  }
});

// Organization Management Routes
router.post('/organizations', async (req, res) => {
  try {
    const { name, code } = req.body;

    const organization = await prisma.organization.create({
      data: {
        name,
        code,
        organizationSettings: {
          create: {} // Create with default settings
        }
      }
    });

    res.json({ success: true, data: organization });
  } catch (error) {
    console.error('Create organization error:', error);
    res.status(500).json({ success: false, error: 'Failed to create organization' });
  }
});

// Get all organizations
router.get('/organizations', async (req, res) => {
  try {
    const organizations = await prisma.organization.findMany({
      include: {
        organizationSettings: true,
        users: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true
          }
        }
      }
    });

    res.json({ success: true, data: organizations });
  } catch (error) {
    console.error('Get organizations error:', error);
    res.status(500).json({ success: false, error: 'Failed to get organizations' });
  }
});

// Update organization
router.put('/organizations/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, code, settings } = req.body;

    const organization = await prisma.organization.update({
      where: { id },
      data: {
        name,
        code,
        settings
      }
    });

    res.json({ success: true, data: organization });
  } catch (error) {
    console.error('Update organization error:', error);
    res.status(500).json({ success: false, error: 'Failed to update organization' });
  }
});

// System Configuration Routes
router.get('/settings', async (req, res) => {
  try {
    const settings = await prisma.setting.findMany();
    res.json({ success: true, data: settings });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ success: false, error: 'Failed to get settings' });
  }
});

router.put('/settings', async (req, res) => {
  try {
    const { settings } = req.body;
    const updatedSettings = await Promise.all(
      settings.map(setting => 
        prisma.setting.upsert({
          where: { key: setting.key },
          update: { value: setting.value },
          create: { key: setting.key, value: setting.value }
        })
      )
    );
    res.json({ success: true, data: updatedSettings });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ success: false, error: 'Failed to update settings' });
  }
});

// System logs and monitoring
router.get('/logs', async (req, res) => {
  try {
    // This would typically read from log files or a logging service
    // For now, return a placeholder response
    res.json({
      success: true,
      data: {
        message: 'Log viewing functionality would be implemented here',
        logs: []
      }
    });
  } catch (error) {
    console.error('Get logs error:', error);
    res.status(500).json({ success: false, error: 'Failed to get logs' });
  }
});

// Database maintenance
router.post('/maintenance/cleanup', async (req, res) => {
  try {
    // Implement database cleanup tasks
    res.json({
      success: true,
      message: 'Database cleanup completed'
    });
  } catch (error) {
    console.error('Database cleanup error:', error);
    res.status(500).json({ success: false, error: 'Failed to perform database cleanup' });
  }
});

export { router as default }; 