import express from 'express';
import { getSystemMetrics, getOrganizationMetrics } from '../services/analyticsService.js';
import { isSuperAdmin } from '../middleware/superAdmin.js';
import { isAuthenticated } from '../middleware/auth.js';

const router = express.Router();

// Get system-wide metrics (super admin only)
router.get('/system', isSuperAdmin, async (req, res) => {
  try {
    const metrics = await getSystemMetrics();
    res.json({ data: metrics });
  } catch (error) {
    console.error('Error fetching system metrics:', error);
    res.status(500).json({ error: 'Failed to fetch system metrics' });
  }
});

// Get organization-specific metrics
router.get('/organization/:id', isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    const metrics = await getOrganizationMetrics(id);
    res.json({ data: metrics });
  } catch (error) {
    console.error('Error fetching organization metrics:', error);
    res.status(500).json({ error: 'Failed to fetch organization metrics' });
  }
});

export default router; 