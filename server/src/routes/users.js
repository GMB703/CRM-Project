// This file uses ES module syntax. Do not use require/module.exports. See package.json "type": "module".
import express from 'express';
import { PrismaClient } from '@prisma/client';
import { isSuperAdmin } from '../middleware/superAdmin.js';
import { isAuthenticated } from '../middleware/auth.js';
import { requireRole } from '../middleware/permission.js';
import bcrypt from 'bcryptjs';
import { logEvent } from '../services/auditLogService.js';

const router = express.Router();
const prisma = new PrismaClient();

// Example: Get all users (add your actual routes here)
router.get('/', isSuperAdmin, async (req, res) => {
  try {
    console.log('GET /api/users called. req.user:', req.user);
    const users = await prisma.user.findMany();
    res.json({ data: users });
  } catch (err) {
    console.error('Error in /api/users:', err);
    res.status(500).json({ error: 'Failed to fetch users', details: err.message, stack: err.stack });
  }
});

// Get user by ID
router.get('/:id', isSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        organizationId: true,
        organization: {
          select: {
            name: true
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ data: user });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Create user (role assignment)
router.post('/', isAuthenticated, requireRole('SUPER_ADMIN', 'ORG_ADMIN'), async (req, res) => {
  try {
    const { email, firstName, lastName, organizationId, isActive } = req.body;
    const { role } = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // Check if organization exists
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId }
    });

    if (!organization) {
      return res.status(400).json({ error: 'Organization not found' });
    }

    // Generate temporary password
    const tempPassword = 'Admin123!'; // Default password as per memory
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    const user = await prisma.user.create({
      data: {
        email,
        firstName,
        lastName,
        password: hashedPassword,
        role,
        organizationId,
        isActive
      },
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

    // TODO: Send email to user with temporary password
    // Audit log
    await logEvent({
      userId: req.user?.id || null,
      organizationId,
      action: 'CREATE_USER',
      targetType: 'User',
      targetId: user.id,
      details: { email, firstName, lastName, role, isActive },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.status(201).json({ data: user });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// Update user (role assignment)
router.put('/:id', isAuthenticated, requireRole('SUPER_ADMIN', 'ORG_ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, organizationId, isActive } = req.body;
    const { role } = req.body;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id }
    });

    if (!existingUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if organization exists
    if (organizationId) {
      const organization = await prisma.organization.findUnique({
        where: { id: organizationId }
      });

      if (!organization) {
        return res.status(400).json({ error: 'Organization not found' });
      }
    }

    // Only SUPER_ADMIN can assign SUPER_ADMIN
    if (role === 'SUPER_ADMIN' && req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'Only SUPER_ADMIN can assign SUPER_ADMIN role' });
    }

    const user = await prisma.user.update({
      where: { id },
      data: {
        firstName,
        lastName,
        role,
        organizationId,
        isActive
      },
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
      organizationId: user.organizationId,
      action: 'UPDATE_USER',
      targetType: 'User',
      targetId: user.id,
      details: { firstName, lastName, role, isActive },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.json({ data: user });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Force logout user (super admin only)
router.post('/:id/force-logout', isSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return res.status(404).json({ error: 'User not found' });
    // Increment tokenVersion to invalidate all existing JWTs
    const updatedUser = await prisma.user.update({
      where: { id },
      data: { tokenVersion: (user.tokenVersion || 0) + 1 }
    });
    // Audit log
    await logEvent({
      userId: req.user?.id || null,
      organizationId: user.organizationId,
      action: 'FORCE_LOGOUT',
      targetType: 'User',
      targetId: user.id,
      details: { email: user.email },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });
    res.json({ message: 'User forcibly logged out' });
  } catch (error) {
    console.error('Error forcing logout:', error);
    res.status(500).json({ error: 'Failed to force logout' });
  }
});

// Helper to generate a secure random password
function generateRandomPassword(length = 12) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

// Admin-initiated password reset (super admin only)
router.post('/:id/reset-password', isSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return res.status(404).json({ error: 'User not found' });
    // Generate new random temp password
    const tempPassword = generateRandomPassword(12);
    const hashedPassword = await bcrypt.hash(tempPassword, 10);
    await prisma.user.update({
      where: { id },
      data: { password: hashedPassword }
    });
    // Audit log
    await logEvent({
      userId: req.user?.id || null,
      organizationId: user.organizationId,
      action: 'RESET_PASSWORD',
      targetType: 'User',
      targetId: user.id,
      details: { email: user.email },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });
    res.json({ message: 'Password reset', tempPassword });
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

// Add audit logging to toggle-status
router.put('/:id/toggle-status', isSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return res.status(404).json({ error: 'User not found' });
    const updatedUser = await prisma.user.update({
      where: { id },
      data: { isActive: !user.isActive },
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
      organizationId: user.organizationId,
      action: updatedUser.isActive ? 'ACTIVATE_USER' : 'DEACTIVATE_USER',
      targetType: 'User',
      targetId: user.id,
      details: { email: user.email },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });
    res.json({ data: updatedUser });
  } catch (error) {
    console.error('Error toggling user status:', error);
    res.status(500).json({ error: 'Failed to toggle user status' });
  }
});

// Delete user (super admin only)
router.delete('/:id', isSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Prevent deleting the last SUPER_ADMIN
    if (user.role === 'SUPER_ADMIN') {
      const superAdminCount = await prisma.user.count({
        where: { role: 'SUPER_ADMIN' }
      });

      if (superAdminCount <= 1) {
        return res.status(400).json({ error: 'Cannot delete the last super admin' });
      }
    }

    await prisma.user.delete({
      where: { id }
    });

    // Audit log
    await logEvent({
      userId: req.user?.id || null,
      organizationId: user.organizationId,
      action: 'DELETE_USER',
      targetType: 'User',
      targetId: user.id,
      details: { email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

export default router; 