import express from 'express';
import { isAuthenticated, authorize } from '../middleware/auth.js';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// Get all leads for the organization
router.get('/', isAuthenticated, async (req, res) => {
  try {
    const leads = await prisma.lead.findMany({
      where: { organizationId: req.user.organizationId },
      include: {
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });
    res.json({ data: leads });
  } catch (error) {
    console.error('Error fetching leads:', error);
    res.status(500).json({ error: 'Failed to fetch leads' });
  }
});

// Create a new lead
router.post('/', isAuthenticated, async (req, res) => {
  try {
    const { name, email, phone, status, source, notes } = req.body;
    const lead = await prisma.lead.create({
      data: {
        name,
        email,
        phone,
        status,
        source,
        notes,
        organizationId: req.user.organizationId,
        assignedToId: req.user.id
      }
    });
    res.status(201).json({ data: lead });
  } catch (error) {
    console.error('Error creating lead:', error);
    res.status(500).json({ error: 'Failed to create lead' });
  }
});

// Update a lead
router.put('/:id', isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    const lead = await prisma.lead.update({
      where: { 
        id,
        organizationId: req.user.organizationId
      },
      data: req.body
    });
    res.json({ data: lead });
  } catch (error) {
    console.error('Error updating lead:', error);
    res.status(500).json({ error: 'Failed to update lead' });
  }
});

// Delete a lead
router.delete('/:id', isAuthenticated, authorize('ADMIN', 'SUPER_ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.lead.delete({
      where: { 
        id,
        organizationId: req.user.organizationId
      }
    });
    res.json({ message: 'Lead deleted successfully' });
  } catch (error) {
    console.error('Error deleting lead:', error);
    res.status(500).json({ error: 'Failed to delete lead' });
  }
});

export default router;
