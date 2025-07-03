import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

class EstimateService {
  // Generate unique reference number
  static async generateReferenceNumber(organizationId) {
    const year = new Date().getFullYear();
    const prefix = `ES-${year}-`;
    
    // Get the latest estimate for this organization
    const latestEstimate = await prisma.estimate.findFirst({
      where: {
        organizationId,
        referenceNumber: {
          startsWith: prefix
        }
      },
      orderBy: {
        referenceNumber: 'desc'
      }
    });

    let nextNumber = 1;
    if (latestEstimate) {
      const currentNumber = parseInt(latestEstimate.referenceNumber.split('-').pop());
      nextNumber = currentNumber + 1;
    }

    return `${prefix}${nextNumber.toString().padStart(4, '0')}`;
  }

  // Get estimates with filters and pagination
  static async getEstimates(filters, options = {}) {
    const { page = 1, limit = 20 } = options;
    const skip = (page - 1) * limit;

    const where = { ...filters };

    const [estimates, total] = await Promise.all([
      prisma.estimate.findMany({
        where,
        include: {
          client: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true
            }
          },
          project: {
            select: {
              id: true,
              name: true,
              status: true
            }
          },
          creator: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          },
          approver: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          },
          lineItems: {
            select: {
              id: true,
              description: true,
              quantity: true,
              unitPrice: true,
              total: true
            }
          },
          _count: {
            select: {
              lineItems: true,
              payments: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: limit
      }),
      prisma.estimate.count({ where })
    ]);

    // Calculate totals for each estimate
    const estimatesWithTotals = estimates.map(estimate => {
      const subtotal = estimate.lineItems.reduce((sum, item) => sum + (item.total || 0), 0);
      const taxAmount = subtotal * (estimate.taxRate / 100);
      const discountAmount = estimate.discountType === 'PERCENTAGE' 
        ? subtotal * (estimate.discountValue / 100)
        : estimate.discountValue || 0;
      const total = subtotal + taxAmount - discountAmount;

      return {
        ...estimate,
        subtotal,
        taxAmount,
        discountAmount,
        total
      };
    });

    return {
      estimates: estimatesWithTotals,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  // Get single estimate by ID
  static async getEstimateById(id, organizationId) {
    const estimate = await prisma.estimate.findFirst({
      where: {
        id,
        organizationId
      },
      include: {
        client: true,
        project: true,
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        approver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        lineItems: {
          orderBy: {
            sortOrder: 'asc'
          }
        },
        payments: {
          orderBy: {
            createdAt: 'desc'
          }
        },
        approvals: {
          include: {
            approver: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        },
        emailLogs: {
          orderBy: {
            sentAt: 'desc'
          }
        },
        template: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    if (!estimate) return null;

    // Calculate totals
    const subtotal = estimate.lineItems.reduce((sum, item) => sum + (item.total || 0), 0);
    const taxAmount = subtotal * (estimate.taxRate / 100);
    const discountAmount = estimate.discountType === 'PERCENTAGE' 
      ? subtotal * (estimate.discountValue / 100)
      : estimate.discountValue || 0;
    const total = subtotal + taxAmount - discountAmount;

    const totalPaid = estimate.payments
      .filter(payment => payment.status === 'COMPLETED')
      .reduce((sum, payment) => sum + payment.amount, 0);

    return {
      ...estimate,
      subtotal,
      taxAmount,
      discountAmount,
      total,
      totalPaid,
      remainingBalance: total - totalPaid
    };
  }

  // Create new estimate
  static async createEstimate(data) {
    const referenceNumber = await this.generateReferenceNumber(data.organizationId);

    const estimate = await prisma.estimate.create({
      data: {
        ...data,
        referenceNumber,
        lineItems: {
          create: data.lineItems?.map((item, index) => ({
            ...item,
            sortOrder: index,
            total: item.quantity * item.unitPrice
          })) || []
        }
      },
      include: {
        client: true,
        project: true,
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        lineItems: {
          orderBy: {
            sortOrder: 'asc'
          }
        }
      }
    });

    return estimate;
  }

  // Update estimate
  static async updateEstimate(id, data, organizationId) {
    // Check if estimate exists and belongs to organization
    const existingEstimate = await prisma.estimate.findFirst({
      where: { id, organizationId }
    });

    if (!existingEstimate) return null;

    const updateData = { ...data };
    delete updateData.lineItems; // Handle line items separately

    const estimate = await prisma.estimate.update({
      where: { id },
      data: updateData,
      include: {
        client: true,
        project: true,
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        lineItems: {
          orderBy: {
            sortOrder: 'asc'
          }
        }
      }
    });

    return estimate;
  }

  // Delete estimate
  static async deleteEstimate(id, organizationId) {
    // Check if estimate exists and belongs to organization
    const existingEstimate = await prisma.estimate.findFirst({
      where: { id, organizationId }
    });

    if (!existingEstimate) return false;

    await prisma.estimate.delete({
      where: { id }
    });

    return true;
  }

  // Duplicate estimate
  static async duplicateEstimate(id, organizationId, creatorId) {
    const originalEstimate = await this.getEstimateById(id, organizationId);
    
    if (!originalEstimate) return null;

    const duplicateData = {
      title: `Copy of ${originalEstimate.title}`,
      description: originalEstimate.description,
      clientId: originalEstimate.clientId,
      projectId: originalEstimate.projectId,
      organizationId,
      creatorId,
      status: 'DRAFT',
      taxRate: originalEstimate.taxRate,
      discountType: originalEstimate.discountType,
      discountValue: originalEstimate.discountValue,
      terms: originalEstimate.terms,
      notes: originalEstimate.notes,
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      lineItems: originalEstimate.lineItems.map(item => ({
        description: item.description,
        category: item.category,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        unit: item.unit,
        notes: item.notes,
        total: item.total
      }))
    };

    return await this.createEstimate(duplicateData);
  }

  // Submit for approval
  static async submitForApproval(id, organizationId, userId, comments) {
    const estimate = await prisma.estimate.findFirst({
      where: { id, organizationId }
    });

    if (!estimate) return null;

    // Update estimate status
    const updatedEstimate = await prisma.estimate.update({
      where: { id },
      data: {
        status: 'PENDING_APPROVAL',
        submittedAt: new Date()
      }
    });

    // Create approval record
    const approval = await prisma.estimateApproval.create({
      data: {
        estimateId: id,
        submitterId: userId,
        status: 'PENDING',
        comments
      }
    });

    return { estimate: updatedEstimate, approval };
  }

  // Approve/Reject estimate
  static async approveEstimate(id, organizationId, approverId, status, comments) {
    const estimate = await prisma.estimate.findFirst({
      where: { id, organizationId }
    });

    if (!estimate) return null;

    // Update estimate
    const updatedEstimate = await prisma.estimate.update({
      where: { id },
      data: {
        status: status === 'APPROVED' ? 'APPROVED' : 'REJECTED',
        approverId: approverId,
        approvedAt: status === 'APPROVED' ? new Date() : null,
        rejectedAt: status === 'REJECTED' ? new Date() : null
      }
    });

    // Update approval record
    const approval = await prisma.estimateApproval.updateMany({
      where: {
        estimateId: id,
        status: 'PENDING'
      },
      data: {
        status: status === 'APPROVED' ? 'APPROVED' : 'REJECTED',
        approverId,
        approvedAt: new Date(),
        comments
      }
    });

    return { estimate: updatedEstimate, approval };
  }

  // Convert to project
  static async convertToProject(id, organizationId, creatorId) {
    const estimate = await this.getEstimateById(id, organizationId);
    
    if (!estimate || estimate.status !== 'APPROVED') return null;

    const project = await prisma.project.create({
      data: {
        name: estimate.title,
        description: estimate.description,
        clientId: estimate.clientId,
        organizationId,
        creatorId,
        status: 'PLANNING',
        budget: estimate.total,
        startDate: new Date(),
        estimateId: id
      }
    });

    // Update estimate to link to project
    await prisma.estimate.update({
      where: { id },
      data: {
        projectId: project.id,
        convertedToProjectAt: new Date()
      }
    });

    return project;
  }

  // Line Items Management
  static async getLineItems(estimateId, organizationId) {
    // Verify estimate belongs to organization
    const estimate = await prisma.estimate.findFirst({
      where: { id: estimateId, organizationId }
    });

    if (!estimate) return [];

    return await prisma.estimateLineItem.findMany({
      where: { estimateId },
      orderBy: { sortOrder: 'asc' }
    });
  }

  static async addLineItem(estimateId, data, organizationId) {
    // Verify estimate belongs to organization
    const estimate = await prisma.estimate.findFirst({
      where: { id: estimateId, organizationId }
    });

    if (!estimate) throw new Error('Estimate not found');

    // Get next sort order
    const lastItem = await prisma.estimateLineItem.findFirst({
      where: { estimateId },
      orderBy: { sortOrder: 'desc' }
    });

    const sortOrder = (lastItem?.sortOrder || 0) + 1;

    const lineItem = await prisma.estimateLineItem.create({
      data: {
        ...data,
        estimateId,
        sortOrder,
        total: data.quantity * data.unitPrice
      }
    });

    // Update estimate totals
    await this.recalculateEstimateTotals(estimateId);

    return lineItem;
  }

  static async updateLineItem(lineItemId, data, organizationId) {
    // Verify line item belongs to organization
    const lineItem = await prisma.estimateLineItem.findFirst({
      where: {
        id: lineItemId,
        estimate: {
          organizationId
        }
      }
    });

    if (!lineItem) return null;

    const updatedLineItem = await prisma.estimateLineItem.update({
      where: { id: lineItemId },
      data: {
        ...data,
        total: data.quantity * data.unitPrice
      }
    });

    // Update estimate totals
    await this.recalculateEstimateTotals(lineItem.estimateId);

    return updatedLineItem;
  }

  static async deleteLineItem(lineItemId, organizationId) {
    // Verify line item belongs to organization
    const lineItem = await prisma.estimateLineItem.findFirst({
      where: {
        id: lineItemId,
        estimate: {
          organizationId
        }
      }
    });

    if (!lineItem) return false;

    await prisma.estimateLineItem.delete({
      where: { id: lineItemId }
    });

    // Update estimate totals
    await this.recalculateEstimateTotals(lineItem.estimateId);

    return true;
  }

  // Recalculate estimate totals
  static async recalculateEstimateTotals(estimateId) {
    const lineItems = await prisma.estimateLineItem.findMany({
      where: { estimateId }
    });

    const subtotal = lineItems.reduce((sum, item) => sum + (item.total || 0), 0);

    await prisma.estimate.update({
      where: { id: estimateId },
      data: {
        subtotal,
        updatedAt: new Date()
      }
    });

    return subtotal;
  }

  // Catalog Items Management
  static async getCatalogItems(filters, options = {}) {
    const { page = 1, limit = 50 } = options;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      prisma.catalogItem.findMany({
        where: filters,
        include: {
          createdBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true
            }
          }
        },
        orderBy: {
          name: 'asc'
        },
        skip,
        take: limit
      }),
      prisma.catalogItem.count({ where: filters })
    ]);

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  static async createCatalogItem(data) {
    return await prisma.catalogItem.create({
      data,
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });
  }

  static async updateCatalogItem(id, data, organizationId) {
    const existingItem = await prisma.catalogItem.findFirst({
      where: { id, organizationId }
    });

    if (!existingItem) return null;

    return await prisma.catalogItem.update({
      where: { id },
      data,
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });
  }

  static async deleteCatalogItem(id, organizationId) {
    const existingItem = await prisma.catalogItem.findFirst({
      where: { id, organizationId }
    });

    if (!existingItem) return false;

    await prisma.catalogItem.update({
      where: { id },
      data: { isActive: false }
    });

    return true;
  }

  // Dashboard Statistics
  static async getDashboardStats(organizationId, period = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - period);

    const [
      totalEstimates,
      pendingEstimates,
      approvedEstimates,
      sentEstimates,
      recentEstimates,
      totalValue,
      approvedValue,
      conversionRate
    ] = await Promise.all([
      // Total estimates
      prisma.estimate.count({
        where: { organizationId }
      }),
      
      // Pending estimates
      prisma.estimate.count({
        where: {
          organizationId,
          status: 'PENDING_APPROVAL'
        }
      }),
      
      // Approved estimates
      prisma.estimate.count({
        where: {
          organizationId,
          status: 'APPROVED'
        }
      }),
      
      // Sent estimates
      prisma.estimate.count({
        where: {
          organizationId,
          status: 'SENT'
        }
      }),
      
      // Recent estimates (last 30 days)
      prisma.estimate.count({
        where: {
          organizationId,
          createdAt: {
            gte: startDate
          }
        }
      }),
      
      // Total value of all estimates
      prisma.estimate.aggregate({
        where: { organizationId },
        _sum: {
          subtotal: true
        }
      }),
      
      // Total value of approved estimates
      prisma.estimate.aggregate({
        where: {
          organizationId,
          status: 'APPROVED'
        },
        _sum: {
          subtotal: true
        }
      }),
      
      // Conversion rate calculation
      Promise.all([
        prisma.estimate.count({
          where: {
            organizationId,
            status: 'SENT'
          }
        }),
        prisma.estimate.count({
          where: {
            organizationId,
            status: 'APPROVED'
          }
        })
      ])
    ]);

    const [sentCount, approvedCount] = conversionRate;
    const conversionPercentage = sentCount > 0 ? (approvedCount / sentCount) * 100 : 0;

    return {
      totalEstimates,
      pendingEstimates,
      approvedEstimates,
      sentEstimates,
      recentEstimates,
      totalValue: totalValue._sum.subtotal || 0,
      approvedValue: approvedValue._sum.subtotal || 0,
      conversionRate: Math.round(conversionPercentage * 100) / 100
    };
  }
}

export default EstimateService; 