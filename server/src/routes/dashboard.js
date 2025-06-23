const express = require('express');
const { PrismaClient } = require('@prisma/client');
const asyncHandler = require('express-async-handler');

const router = express.Router();
const prisma = new PrismaClient();

// @desc    Get dashboard overview
// @route   GET /api/dashboard/overview
// @access  Private
router.get('/overview', asyncHandler(async (req, res) => {
  const userId = req.user.id;

  // Get current date and date ranges
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  try {
    // Get project statistics
    const projectStats = await prisma.$transaction([
      // Total projects
      prisma.project.count({
        where: { isActive: true }
      }),
      // Active projects
      prisma.project.count({
        where: { 
          isActive: true,
          status: { in: ['PLANNING', 'IN_PROGRESS'] }
        }
      }),
      // Completed projects this month
      prisma.project.count({
        where: {
          isActive: true,
          status: 'COMPLETED',
          updatedAt: { gte: startOfMonth }
        }
      }),
      // Projects by stage
      prisma.project.groupBy({
        by: ['stage'],
        where: { isActive: true },
        _count: { stage: true }
      })
    ]);

    // Get financial statistics
    const financialStats = await prisma.$transaction([
      // Total revenue this month
      prisma.invoice.aggregate({
        where: {
          status: 'PAID',
          paidAt: { gte: startOfMonth }
        },
        _sum: { totalAmount: true }
      }),
      // Total revenue this year
      prisma.invoice.aggregate({
        where: {
          status: 'PAID',
          paidAt: { gte: startOfYear }
        },
        _sum: { totalAmount: true }
      }),
      // Outstanding invoices
      prisma.invoice.aggregate({
        where: {
          status: { in: ['SENT', 'OVERDUE'] }
        },
        _sum: { totalAmount: true }
      }),
      // Recent payments
      prisma.payment.findMany({
        where: {
          createdAt: { gte: thirtyDaysAgo }
        },
        include: {
          invoice: {
            include: {
              client: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 5
      })
    ]);

    // Get task statistics
    const taskStats = await prisma.$transaction([
      // Total tasks
      prisma.task.count(),
      // Completed tasks this month
      prisma.task.count({
        where: {
          status: 'COMPLETED',
          completedAt: { gte: startOfMonth }
        }
      }),
      // Overdue tasks
      prisma.task.count({
        where: {
          status: { in: ['PENDING', 'IN_PROGRESS'] },
          dueDate: { lt: now }
        }
      }),
      // My assigned tasks
      prisma.task.count({
        where: {
          assigneeId: userId,
          status: { in: ['PENDING', 'IN_PROGRESS'] }
        }
      })
    ]);

    // Get client statistics
    const clientStats = await prisma.$transaction([
      // Total clients
      prisma.client.count(),
      // New clients this month
      prisma.client.count({
        where: {
          createdAt: { gte: startOfMonth }
        }
      }),
      // Active clients (have projects)
      prisma.client.count({
        where: {
          projects: {
            some: {
              isActive: true
            }
          }
        }
      })
    ]);

    // Get recent activities
    const recentActivities = await prisma.$transaction([
      // Recent projects
      prisma.project.findMany({
        where: { isActive: true },
        include: {
          client: true,
          creator: true
        },
        orderBy: { updatedAt: 'desc' },
        take: 5
      }),
      // Recent communications
      prisma.communication.findMany({
        include: {
          client: true,
          user: true
        },
        orderBy: { sentAt: 'desc' },
        take: 5
      }),
      // Recent invoices
      prisma.invoice.findMany({
        include: {
          client: true
        },
        orderBy: { createdAt: 'desc' },
        take: 5
      })
    ]);

    // Get upcoming deadlines
    const upcomingDeadlines = await prisma.task.findMany({
      where: {
        status: { in: ['PENDING', 'IN_PROGRESS'] },
        dueDate: {
          gte: now,
          lte: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) // Next 7 days
        }
      },
      include: {
        project: {
          include: {
            client: true
          }
        },
        assignee: true
      },
      orderBy: { dueDate: 'asc' },
      take: 10
    });

    // Calculate KPIs
    const kpis = {
      projectCompletionRate: projectStats[0] > 0 ? 
        ((projectStats[2] / projectStats[0]) * 100).toFixed(1) : 0,
      revenueGrowth: 0, // TODO: Calculate month-over-month growth
      taskCompletionRate: taskStats[0] > 0 ? 
        ((taskStats[1] / taskStats[0]) * 100).toFixed(1) : 0,
      clientRetentionRate: 0 // TODO: Calculate retention rate
    };

    res.json({
      success: true,
      data: {
        overview: {
          totalProjects: projectStats[0],
          activeProjects: projectStats[1],
          completedThisMonth: projectStats[2],
          totalRevenue: financialStats[0]._sum.totalAmount || 0,
          yearRevenue: financialStats[1]._sum.totalAmount || 0,
          outstandingInvoices: financialStats[2]._sum.totalAmount || 0,
          totalTasks: taskStats[0],
          completedTasks: taskStats[1],
          overdueTasks: taskStats[2],
          myTasks: taskStats[3],
          totalClients: clientStats[0],
          newClients: clientStats[1],
          activeClients: clientStats[2]
        },
        projectsByStage: projectStats[3],
        recentPayments: financialStats[3],
        recentActivities: {
          projects: recentActivities[0],
          communications: recentActivities[1],
          invoices: recentActivities[2]
        },
        upcomingDeadlines,
        kpis
      }
    });
  } catch (error) {
    console.error('Dashboard overview error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard data'
    });
  }
}));

// @desc    Get project pipeline
// @route   GET /api/dashboard/pipeline
// @access  Private
router.get('/pipeline', asyncHandler(async (req, res) => {
  try {
    const pipeline = await prisma.project.groupBy({
      by: ['stage'],
      where: { isActive: true },
      _count: { stage: true },
      _sum: { budget: true }
    });

    // Get projects in each stage
    const projectsByStage = await Promise.all(
      pipeline.map(async (stage) => {
        const projects = await prisma.project.findMany({
          where: { 
            isActive: true,
            stage: stage.stage
          },
          include: {
            client: true,
            creator: true
          },
          orderBy: { updatedAt: 'desc' }
        });

        return {
          stage: stage.stage,
          count: stage._count.stage,
          totalBudget: stage._sum.budget || 0,
          projects
        };
      })
    );

    res.json({
      success: true,
      data: projectsByStage
    });
  } catch (error) {
    console.error('Pipeline error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching pipeline data'
    });
  }
}));

// @desc    Get revenue analytics
// @route   GET /api/dashboard/revenue
// @access  Private
router.get('/revenue', asyncHandler(async (req, res) => {
  const { period = 'month' } = req.query;
  
  try {
    let dateRange;
    const now = new Date();
    
    switch (period) {
      case 'week':
        dateRange = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        dateRange = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'quarter':
        const quarter = Math.floor(now.getMonth() / 3);
        dateRange = new Date(now.getFullYear(), quarter * 3, 1);
        break;
      case 'year':
        dateRange = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        dateRange = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    // Get revenue data
    const revenueData = await prisma.invoice.groupBy({
      by: ['status'],
      where: {
        createdAt: { gte: dateRange }
      },
      _sum: { totalAmount: true },
      _count: { status: true }
    });

    // Get monthly revenue for chart
    const monthlyRevenue = await prisma.$queryRaw`
      SELECT 
        DATE_TRUNC('month', "createdAt") as month,
        SUM("totalAmount") as revenue
      FROM "invoices"
      WHERE "status" = 'PAID' 
        AND "createdAt" >= ${dateRange}
      GROUP BY DATE_TRUNC('month', "createdAt")
      ORDER BY month ASC
    `;

    // Get top clients by revenue
    const topClients = await prisma.invoice.groupBy({
      by: ['clientId'],
      where: {
        status: 'PAID',
        createdAt: { gte: dateRange }
      },
      _sum: { totalAmount: true },
      orderBy: {
        _sum: {
          totalAmount: 'desc'
        }
      },
      take: 5
    });

    // Get client details for top clients
    const topClientsWithDetails = await Promise.all(
      topClients.map(async (client) => {
        const clientDetails = await prisma.client.findUnique({
          where: { id: client.clientId },
          select: { firstName: true, lastName: true, company: true }
        });
        
        return {
          ...client,
          client: clientDetails
        };
      })
    );

    res.json({
      success: true,
      data: {
        revenueByStatus: revenueData,
        monthlyRevenue,
        topClients: topClientsWithDetails
      }
    });
  } catch (error) {
    console.error('Revenue analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching revenue data'
    });
  }
}));

// @desc    Get task analytics
// @route   GET /api/dashboard/tasks
// @access  Private
router.get('/tasks', asyncHandler(async (req, res) => {
  const userId = req.user.id;
  
  try {
    // Get task statistics
    const taskStats = await prisma.task.groupBy({
      by: ['status'],
      _count: { status: true }
    });

    // Get my tasks
    const myTasks = await prisma.task.findMany({
      where: {
        assigneeId: userId,
        status: { in: ['PENDING', 'IN_PROGRESS'] }
      },
      include: {
        project: {
          include: {
            client: true
          }
        }
      },
      orderBy: { dueDate: 'asc' }
    });

    // Get overdue tasks
    const overdueTasks = await prisma.task.findMany({
      where: {
        status: { in: ['PENDING', 'IN_PROGRESS'] },
        dueDate: { lt: new Date() }
      },
      include: {
        project: {
          include: {
            client: true
          }
        },
        assignee: true
      },
      orderBy: { dueDate: 'asc' }
    });

    // Get task completion trend
    const taskCompletionTrend = await prisma.$queryRaw`
      SELECT 
        DATE_TRUNC('week', "completedAt") as week,
        COUNT(*) as completed_tasks
      FROM "tasks"
      WHERE "status" = 'COMPLETED' 
        AND "completedAt" >= NOW() - INTERVAL '12 weeks'
      GROUP BY DATE_TRUNC('week', "completedAt")
      ORDER BY week ASC
    `;

    res.json({
      success: true,
      data: {
        taskStats,
        myTasks,
        overdueTasks,
        taskCompletionTrend
      }
    });
  } catch (error) {
    console.error('Task analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching task data'
    });
  }
}));

// @desc    Get notifications
// @route   GET /api/dashboard/notifications
// @access  Private
router.get('/notifications', asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { limit = 20, unreadOnly = false } = req.query;

  try {
    const whereClause = { userId };
    if (unreadOnly === 'true') {
      whereClause.isRead = false;
    }

    const notifications = await prisma.notification.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit)
    });

    // Get unread count
    const unreadCount = await prisma.notification.count({
      where: {
        userId,
        isRead: false
      }
    });

    res.json({
      success: true,
      data: {
        notifications,
        unreadCount
      }
    });
  } catch (error) {
    console.error('Notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching notifications'
    });
  }
}));

// @desc    Mark notification as read
// @route   PUT /api/dashboard/notifications/:id/read
// @access  Private
router.put('/notifications/:id/read', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const notification = await prisma.notification.update({
      where: {
        id,
        userId
      },
      data: {
        isRead: true,
        readAt: new Date()
      }
    });

    res.json({
      success: true,
      data: notification
    });
  } catch (error) {
    console.error('Mark notification read error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating notification'
    });
  }
}));

module.exports = router; 