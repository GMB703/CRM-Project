import express from 'express';
import { isAuthenticated } from '../middleware/auth.js';
import { getLeadAnalytics, getRevenueAnalytics } from '../services/analyticsService.js';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// Get lead analytics
router.get('/leads', isAuthenticated, async (req, res) => {
  try {
    const data = await getLeadAnalytics(req.user.organizationId);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get lead analytics' });
  }
});

// Get revenue analytics
router.get('/revenue', isAuthenticated, async (req, res) => {
  try {
    const data = await getRevenueAnalytics(req.user.organizationId);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get revenue analytics' });
  }
});

// System-wide metrics for super admin dashboard
router.get('/system', isAuthenticated, async (req, res) => {
  try {
    // Only super admins can view system metrics
    if (req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ success: false, error: 'Forbidden' });
    }

    const [totalOrganizations, totalUsers, totalProjects, totalClients] = await Promise.all([
      prisma.organization.count(),
      prisma.user.count(),
      prisma.project.count(),
      prisma.client.count(),
    ]);

    // Quick buckets by organization size (#users)
    const orgSizes = await prisma.organization.findMany({
      select: {
        id: true,
        _count: {
          select: { users: true },
        },
      },
    });

    const sizeBuckets = { small: 0, medium: 0, large: 0 };
    orgSizes.forEach((o) => {
      const c = o._count.users;
      if (c <= 10) sizeBuckets.small += 1;
      else if (c <= 50) sizeBuckets.medium += 1;
      else sizeBuckets.large += 1;
    });

    // Users by role
    const roleGroups = await prisma.user.groupBy({ by: ['role'], _count: { _all: true } });
    const byRole = {};
    roleGroups.forEach((g) => {
      byRole[g.role] = g._count._all;
    });

    // recent user signups (last 5)
    const recentActivity = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { id: true, email: true, createdAt: true },
    });

    res.json({
      success: true,
      data: {
        organizations: {
          total: totalOrganizations,
          active: totalOrganizations, // no inactive concept yet
          bySize: sizeBuckets,
        },
        users: {
          total: totalUsers,
          active: totalUsers, // TODO: derive active vs inactive loginAt
          byRole,
        },
        projects: totalProjects,
        clients: totalClients,
        recentActivity,
      },
    });
  } catch (error) {
    console.error('Get system analytics error:', error);
    res.status(500).json({ success: false, error: 'Failed to get system metrics' });
  }
});

export { router as default }; 