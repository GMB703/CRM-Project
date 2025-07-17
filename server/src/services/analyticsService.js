import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export const getSystemMetrics = async () => {
  try {
    let totalOrganizations = 0, totalUsers = 0, totalLeads = 0, totalProjects = 0;
    try {
      totalOrganizations = await prisma.organization.count();
    } catch (err) {
      console.error('Error counting organizations:', err);
    }
    try {
      totalUsers = await prisma.user.count();
    } catch (err) {
      console.error('Error counting users:', err);
    }
    try {
      totalLeads = await prisma.lead.count();
    } catch (err) {
      console.error('Error counting leads:', err);
    }
    try {
      totalProjects = await prisma.project.count();
    } catch (err) {
      console.error('Error counting projects:', err);
    }

    // Placeholder: count active organizations and users (replace with real queries if needed)
    const activeOrganizations = totalOrganizations; // TODO: Replace with real active org count
    const activeUsers = totalUsers; // TODO: Replace with real active user count

    // Placeholder: organization size distribution
    const orgBySize = { small: 2, medium: 1, large: 0 };
    // Placeholder: user role distribution
    const usersByRole = { ADMIN: 2, USER: 3, MANAGER: 1, SUPER_ADMIN: 1 };
    // Placeholder: recent activity
    const recentActivity = [];

    return {
      organizations: {
        total: totalOrganizations,
        active: activeOrganizations,
        bySize: orgBySize
      },
      users: {
        total: totalUsers,
        active: activeUsers,
        byRole: usersByRole
      },
      recentActivity,
      lastUpdated: new Date()
    };
  } catch (error) {
    console.error('Error getting system metrics:', error);
    throw error;
  }
};

export const getOrganizationMetrics = async (organizationId) => {
  try {
    const [
      users,
      leads,
      projects,
      estimates
    ] = await Promise.all([
      prisma.user.count({ where: { organizationId } }),
      prisma.lead.count({ where: { organizationId } }),
      prisma.project.count({ where: { organizationId } }),
      prisma.estimate.count({ where: { organizationId } })
    ]);

    return {
      users,
      leads,
      projects,
      estimates,
      lastUpdated: new Date()
    };
  } catch (error) {
    console.error('Error getting organization metrics:', error);
    throw error;
  }
}; 