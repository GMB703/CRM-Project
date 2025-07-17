const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const dashboardService = {
  // Get overall metrics
  getMetrics: async (organizationId) => {
    const [
      totalClients,
      totalProjects,
      totalEstimates,
      totalInvoices,
      totalTasks
    ] = await Promise.all([
      prisma.client.count({ where: { organizationId } }),
      prisma.project.count({ where: { organizationId } }),
      prisma.estimate.count({ where: { organizationId } }),
      prisma.invoice.count({ where: { organizationId } }),
      prisma.task.count({ 
        where: { 
          project: { organizationId }
        }
      })
    ]);

    return {
      totalClients,
      totalProjects,
      totalEstimates,
      totalInvoices,
      totalTasks
    };
  },

  // Get project metrics
  getProjectMetrics: async (organizationId) => {
    const projectsByStatus = await prisma.project.groupBy({
      by: ['status'],
      where: { organizationId },
      _count: true
    });

    const projectsByStage = await prisma.project.groupBy({
      by: ['stage'],
      where: { organizationId },
      _count: true
    });

    const projectRevenue = await prisma.project.aggregate({
      where: { 
        organizationId,
        budget: { not: null }
      },
      _sum: { budget: true, actualCost: true }
    });

    return {
      byStatus: projectsByStatus,
      byStage: projectsByStage,
      revenue: {
        totalBudget: projectRevenue._sum.budget || 0,
        totalCost: projectRevenue._sum.actualCost || 0
      }
    };
  },

  // Get task performance metrics
  getTaskMetrics: async (organizationId) => {
    const tasksByStatus = await prisma.task.groupBy({
      by: ['status'],
      where: { 
        project: { organizationId }
      },
      _count: true
    });

    const tasksByPriority = await prisma.task.groupBy({
      by: ['priority'],
      where: { 
        project: { organizationId }
      },
      _count: true
    });

    const taskEfficiency = await prisma.task.aggregate({
      where: { 
        project: { organizationId },
        estimatedHours: { not: null },
        actualHours: { not: null }
      },
      _avg: { 
        estimatedHours: true,
        actualHours: true
      }
    });

    return {
      byStatus: tasksByStatus,
      byPriority: tasksByPriority,
      efficiency: {
        avgEstimatedHours: taskEfficiency._avg.estimatedHours || 0,
        avgActualHours: taskEfficiency._avg.actualHours || 0
      }
    };
  },

  // Get financial metrics
  getFinancialMetrics: async (organizationId) => {
    const invoiceStats = await prisma.invoice.aggregate({
      where: { organizationId },
      _sum: {
        totalAmount: true,
        amountPaid: true
      }
    });

    const paymentsByMethod = await prisma.payment.groupBy({
      by: ['method'],
      where: { 
        invoice: { organizationId }
      },
      _sum: {
        amount: true
      }
    });

    const estimateConversion = await prisma.estimate.groupBy({
      by: ['status'],
      where: { organizationId },
      _count: true
    });

    return {
      invoices: {
        totalAmount: invoiceStats._sum.totalAmount || 0,
        amountPaid: invoiceStats._sum.amountPaid || 0,
        outstanding: (invoiceStats._sum.totalAmount || 0) - (invoiceStats._sum.amountPaid || 0)
      },
      paymentsByMethod,
      estimateConversion
    };
  },

  // Get client engagement metrics
  getClientMetrics: async (organizationId) => {
    const clientsByStatus = await prisma.client.groupBy({
      by: ['status'],
      where: { organizationId },
      _count: true
    });

    const clientsBySource = await prisma.client.groupBy({
      by: ['source'],
      where: { organizationId },
      _count: true
    });

    const communicationStats = await prisma.communication.groupBy({
      by: ['type'],
      where: { 
        client: { organizationId }
      },
      _count: true
    });

    return {
      byStatus: clientsByStatus,
      bySource: clientsBySource,
      communications: communicationStats
    };
  },

  // Get trend data for a specific metric over time
  getTrendData: async (organizationId, metric, timeframe) => {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - timeframe);

    let trendData;
    switch (metric) {
      case 'projects':
        trendData = await prisma.project.groupBy({
          by: [
            { year: { datepart: 'year', date: 'createdAt' } },
            { month: { datepart: 'month', date: 'createdAt' } }
          ],
          where: {
            organizationId,
            createdAt: { gte: startDate }
          },
          _count: true
        });
        break;
      case 'revenue':
        trendData = await prisma.invoice.groupBy({
          by: [
            { year: { datepart: 'year', date: 'createdAt' } },
            { month: { datepart: 'month', date: 'createdAt' } }
          ],
          where: {
            organizationId,
            createdAt: { gte: startDate }
          },
          _sum: { totalAmount: true }
        });
        break;
      // Add more metric types as needed
    }

    return trendData;
  }
};

module.exports = dashboardService; 