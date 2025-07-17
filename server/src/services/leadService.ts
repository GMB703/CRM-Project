import { PrismaClient, Client, LeadActivity, LeadActivityType } from '@prisma/client';
import { BadRequestError, NotFoundError } from '../utils/errors';

const prisma = new PrismaClient();

interface LeadFilter {
  search?: string;
  stage?: string;
  assignedUserId?: string;
  minLeadScore?: number;
  maxLeadScore?: number;
  minEstimatedValue?: number;
  maxEstimatedValue?: number;
  source?: string;
  status?: string;
  startDate?: Date;
  endDate?: Date;
  organizationId: string;
}

interface LeadSort {
  field: string;
  direction: 'asc' | 'desc';
}

interface LeadPagination {
  page: number;
  limit: number;
}

interface CreateLeadActivityInput {
  type: LeadActivityType;
  title: string;
  description?: string;
  outcome?: string;
  nextAction?: string;
  duration?: number;
  scheduledAt?: Date;
  completedAt?: Date;
  clientId: string;
  userId: string;
  organizationId: string;
}

class LeadService {
  // Create a new lead
  async createLead(data: any): Promise<Client> {
    try {
      return await prisma.client.create({
        data: {
          ...data,
          status: 'PROSPECT',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        include: {
          assignedUser: true,
          leadActivities: true,
        },
      });
    } catch (error) {
      throw new BadRequestError('Failed to create lead: ' + error.message);
    }
  }

  // Get a lead by ID
  async getLeadById(id: string, organizationId: string): Promise<Client> {
    const lead = await prisma.client.findFirst({
      where: {
        id,
        organizationId,
      },
      include: {
        assignedUser: true,
        leadActivities: {
          include: {
            user: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!lead) {
      throw new NotFoundError('Lead not found');
    }

    return lead;
  }

  // Update a lead
  async updateLead(id: string, organizationId: string, data: any): Promise<Client> {
    const lead = await this.getLeadById(id, organizationId);

    try {
      return await prisma.client.update({
        where: { id },
        data: {
          ...data,
          updatedAt: new Date(),
        },
        include: {
          assignedUser: true,
          leadActivities: true,
        },
      });
    } catch (error) {
      throw new BadRequestError('Failed to update lead: ' + error.message);
    }
  }

  // Delete a lead
  async deleteLead(id: string, organizationId: string): Promise<void> {
    const lead = await this.getLeadById(id, organizationId);

    try {
      await prisma.client.delete({
        where: { id },
      });
    } catch (error) {
      throw new BadRequestError('Failed to delete lead: ' + error.message);
    }
  }

  // Get leads with filtering, sorting, and pagination
  async getLeads(
    filter: LeadFilter,
    sort: LeadSort = { field: 'createdAt', direction: 'desc' },
    pagination: LeadPagination = { page: 1, limit: 10 }
  ): Promise<{ leads: Client[]; total: number }> {
    const where: any = {
      organizationId: filter.organizationId,
    };

    // Apply filters
    if (filter.search) {
      where.OR = [
        { firstName: { contains: filter.search, mode: 'insensitive' } },
        { lastName: { contains: filter.search, mode: 'insensitive' } },
        { email: { contains: filter.search, mode: 'insensitive' } },
        { company: { contains: filter.search, mode: 'insensitive' } },
      ];
    }

    if (filter.stage) {
      where.leadStage = filter.stage;
    }

    if (filter.assignedUserId) {
      where.assignedUserId = filter.assignedUserId;
    }

    if (filter.minLeadScore !== undefined) {
      where.leadScore = { gte: filter.minLeadScore };
    }

    if (filter.maxLeadScore !== undefined) {
      where.leadScore = { ...where.leadScore, lte: filter.maxLeadScore };
    }

    if (filter.minEstimatedValue !== undefined) {
      where.estimatedValue = { gte: filter.minEstimatedValue };
    }

    if (filter.maxEstimatedValue !== undefined) {
      where.estimatedValue = { ...where.estimatedValue, lte: filter.maxEstimatedValue };
    }

    if (filter.source) {
      where.source = filter.source;
    }

    if (filter.status) {
      where.status = filter.status;
    }

    if (filter.startDate) {
      where.createdAt = { gte: filter.startDate };
    }

    if (filter.endDate) {
      where.createdAt = { ...where.createdAt, lte: filter.endDate };
    }

    // Get total count
    const total = await prisma.client.count({ where });

    // Get paginated results
    const leads = await prisma.client.findMany({
      where,
      include: {
        assignedUser: true,
        leadActivities: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 5, // Get only the 5 most recent activities
        },
      },
      orderBy: {
        [sort.field]: sort.direction,
      },
      skip: (pagination.page - 1) * pagination.limit,
      take: pagination.limit,
    });

    return { leads, total };
  }

  // Create a lead activity
  async createLeadActivity(data: CreateLeadActivityInput): Promise<any> {
    try {
      const activity = await prisma.leadActivity.create({
        data,
        include: {
          user: true,
        },
      });

      // Update the lead's last contacted date if this is a completed activity
      if (data.completedAt) {
        await prisma.client.update({
          where: { id: data.clientId },
          data: {
            lastContactedAt: data.completedAt,
            updatedAt: new Date(),
          },
        });
      }

      return activity;
    } catch (error) {
      throw new BadRequestError('Failed to create lead activity: ' + error.message);
    }
  }

  // Get lead activities for a specific lead
  async getLeadActivities(
    clientId: string,
    organizationId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<{ activities: any[]; total: number }> {
    const where = {
      clientId,
      organizationId,
    };

    const total = await prisma.leadActivity.count({ where });

    const activities = await prisma.leadActivity.findMany({
      where,
      include: {
        user: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { activities, total };
  }

  // Update lead stage
  async updateLeadStage(
    id: string,
    organizationId: string,
    stage: string,
    userId: string
  ): Promise<Client> {
    const lead = await this.getLeadById(id, organizationId);

    try {
      // Create a stage change activity
      await this.createLeadActivity({
        type: 'STAGE_CHANGE',
        title: `Stage updated to ${stage}`,
        description: `Lead stage changed from ${lead.leadStage || 'None'} to ${stage}`,
        clientId: id,
        userId,
        organizationId,
        completedAt: new Date(),
      });

      // Update the lead
      return await prisma.client.update({
        where: { id },
        data: {
          leadStage: stage,
          updatedAt: new Date(),
        },
        include: {
          assignedUser: true,
          leadActivities: {
            orderBy: {
              createdAt: 'desc',
            },
            take: 5,
          },
        },
      });
    } catch (error) {
      throw new BadRequestError('Failed to update lead stage: ' + error.message);
    }
  }

  // Get lead stages for an organization
  async getLeadStages(organizationId: string): Promise<any[]> {
    return await prisma.leadStage.findMany({
      where: {
        organizationId,
        isActive: true,
      },
      orderBy: {
        order: 'asc',
      },
    });
  }

  // Get lead sources for an organization
  async getLeadSources(organizationId: string): Promise<any[]> {
    return await prisma.leadSourceConfig.findMany({
      where: {
        organizationId,
        isActive: true,
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  // Get lead statistics
  async getLeadStatistics(organizationId: string): Promise<any> {
    const [totalLeads, stageStats, sourceStats, conversionRate] = await Promise.all([
      // Total leads count
      prisma.client.count({
        where: {
          organizationId,
          status: 'PROSPECT',
        },
      }),

      // Leads by stage
      prisma.client.groupBy({
        by: ['leadStage'],
        where: {
          organizationId,
          status: 'PROSPECT',
        },
        _count: true,
      }),

      // Leads by source
      prisma.client.groupBy({
        by: ['source'],
        where: {
          organizationId,
          status: 'PROSPECT',
        },
        _count: true,
      }),

      // Conversion rate calculation
      prisma.client.findMany({
        where: {
          organizationId,
          status: {
            in: ['PROSPECT', 'CONVERTED'],
          },
        },
        select: {
          status: true,
        },
      }),
    ]);

    const converted = conversionRate.filter(c => c.status === 'CONVERTED').length;
    const total = conversionRate.length;

    return {
      totalLeads,
      stageDistribution: stageStats,
      sourceDistribution: sourceStats,
      conversionRate: total > 0 ? (converted / total) * 100 : 0,
    };
  }
}

export default new LeadService(); 