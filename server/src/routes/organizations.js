import express from 'express';
import { PrismaClient } from '@prisma/client';
import { isAuthenticated } from '../middleware/auth.js';
import { logEvent } from '../services/auditLogService.js';

const router = express.Router();
const prisma = new PrismaClient();

// Get all organizations (super admin only)
router.get('/', isAuthenticated, async (req, res) => {
  try {
    const organizations = await prisma.organization.findMany({
      include: {
        _count: {
          select: {
            users: true
          }
        }
      }
    });
    res.json({ data: organizations });
  } catch (error) {
    console.error('Error fetching organizations:', error);
    res.status(500).json({ error: 'Failed to fetch organizations' });
  }
});

// Create a new organization
router.post('/', isAuthenticated, async (req, res) => {
  try {
    const { name, code, isActive } = req.body;
    const organization = await prisma.organization.create({
      data: {
        name,
        code,
        isActive: isActive ?? true
      }
    });
    // Audit log
    await logEvent({
      userId: req.user?.id || null,
      organizationId: organization.id,
      action: 'CREATE_ORGANIZATION',
      targetType: 'Organization',
      targetId: organization.id,
      details: { name, code, isActive: isActive ?? true },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });
    res.status(201).json({ data: organization });
  } catch (error) {
    console.error('Error creating organization:', error);
    res.status(500).json({ error: 'Failed to create organization' });
  }
});

// Update an organization
router.put('/:id', isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    const organization = await prisma.organization.update({
      where: { id },
      data: req.body
    });
    // Audit log
    await logEvent({
      userId: req.user?.id || null,
      organizationId: organization.id,
      action: 'UPDATE_ORGANIZATION',
      targetType: 'Organization',
      targetId: organization.id,
      details: req.body,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });
    res.json({ data: organization });
  } catch (error) {
    console.error('Error updating organization:', error);
    res.status(500).json({ error: 'Failed to update organization' });
  }
});

// Delete an organization
router.delete('/:id', isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    const org = await prisma.organization.findUnique({ where: { id } });
    await prisma.organization.delete({
      where: { id }
    });
    // Audit log
    await logEvent({
      userId: req.user?.id || null,
      organizationId: id,
      action: 'DELETE_ORGANIZATION',
      targetType: 'Organization',
      targetId: id,
      details: { name: org?.name, code: org?.code },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });
    res.json({ message: 'Organization deleted successfully' });
  } catch (error) {
    console.error('Error deleting organization:', error);
    res.status(500).json({ error: 'Failed to delete organization' });
  }
});

// Set current organization for user
router.post('/set-current', isAuthenticated, async (req, res) => {
  try {
    const { organizationId } = req.body;
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        organization: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.isSuperAdmin && user.organizationId !== organizationId) {
      return res.status(403).json({ error: 'Access denied to this organization' });
    }

    res.json({ data: user.organization });
  } catch (error) {
    console.error('Error setting current organization:', error);
    res.status(500).json({ error: 'Failed to set current organization' });
  }
});

export default router; 