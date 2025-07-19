import express from 'express';
import { PrismaClient } from '@prisma/client';
import { isAuthenticated } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// Get all leads
router.get('/', isAuthenticated, async (req, res) => {
  try {
    const leads = await prisma.lead.findMany({
      where: { organizationId: req.user.organizationId },
    });
    res.json({ success: true, data: leads });
  } catch (error) {
    console.error('Get leads error:', error);
    res.status(500).json({ success: false, error: 'Failed to get leads' });
  }
});

// Get a single lead
router.get('/:id', isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    const lead = await prisma.lead.findUnique({
      where: { id },
    });
    if (!lead || lead.organizationId !== req.user.organizationId) {
      return res.status(404).json({ success: false, error: 'Lead not found' });
    }
    res.json({ success: true, data: lead });
  } catch (error) {
    console.error('Get lead error:', error);
    res.status(500).json({ success: false, error: 'Failed to get lead' });
  }
});

// Create a new lead
router.post('/', isAuthenticated, async (req, res) => {
  try {
    const { ...leadData } = req.body;
    const lead = await prisma.lead.create({
      data: {
        ...leadData,
        organizationId: req.user.organizationId,
      },
    });
    res.json({ success: true, data: lead });
  } catch (error) {
    console.error('Create lead error:', error);
    res.status(500).json({ success: false, error: 'Failed to create lead' });
  }
});

// Update a lead
router.put('/:id', isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    const { ...leadData } = req.body;
    const lead = await prisma.lead.update({
      where: { id },
      data: {
        ...leadData,
      },
    });
    res.json({ success: true, data: lead });
  } catch (error) {
    console.error('Update lead error:', error);
    res.status(500).json({ success: false, error: 'Failed to update lead' });
  }
});

// Delete a lead
router.delete('/:id', isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.lead.delete({
      where: { id },
    });
    res.json({ success: true, message: 'Lead deleted successfully' });
  } catch (error) {
    console.error('Delete lead error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete lead' });
  }
});

export { router as default };
