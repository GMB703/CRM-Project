import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Lead Service for CRM Lead Management Operations
 * Handles all lead-related operations with organization context
 */
class LeadService {
  
  /**
   * Get all leads for an organization with filtering and pagination
   */
  static async getLeads(organizationId, filters = {}, pagination = {}) {
    try {
      const { stage, assignedUserId, status, searchTerm } = filters;
      const { skip = 0, take = 50, orderBy = { createdAt: 'desc' } } = pagination;

      const whereClause = {
        organizationId,
        status: { in: ['PROSPECT', 'QUALIFIED', 'CONVERTED', 'UNQUALIFIED'] }
      };

      if (stage) whereClause.leadStage = stage;
      if (assignedUserId) whereClause.assignedUserId = assignedUserId;
      if (status) whereClause.status = status;
      if (searchTerm) {
        whereClause.OR = [
          { firstName: { contains: searchTerm, mode: 'insensitive' } },
          { lastName: { contains: searchTerm, mode: 'insensitive' } },
          { email: { contains: searchTerm, mode: 'insensitive' } },
          { company: { contains: searchTerm, mode: 'insensitive' } }
        ];
      }

      const [leads, totalCount] = await Promise.all([
        prisma.client.findMany({
          where: whereClause,
          include: {
            assignedUser: {
              select: { id: true, firstName: true, lastName: true, email: true }
            },
            leadActivities: {
              orderBy: { createdAt: 'desc' },
              take: 3,
              include: {
                user: { select: { firstName: true, lastName: true } }
              }
            }
          },
          skip,
          take,
          orderBy
        }),
        prisma.client.count({ where: whereClause })
      ]);

      return {
        leads,
        pagination: {
          total: totalCount,
          skip,
          take,
          hasMore: skip + take < totalCount
        }
      };
    } catch (error) {
      console.error('Error getting leads:', error);
      throw new Error('Failed to retrieve leads');
    }
  }

  /**
   * Get lead by ID with full details
   */
  static async getLeadById(leadId, organizationId) {
    try {
      const lead = await prisma.client.findFirst({
        where: {
          id: leadId,
          organizationId,
          status: { in: ['PROSPECT', 'QUALIFIED', 'CONVERTED', 'UNQUALIFIED'] }
        },
        include: {
          assignedUser: {
            select: { id: true, firstName: true, lastName: true, email: true, phone: true }
          },
          leadActivities: {
            orderBy: { createdAt: 'desc' },
            include: {
              user: { select: { firstName: true, lastName: true } }
            }
          },
          projects: {
            select: { id: true, name: true, status: true, createdAt: true }
          },
          estimates: {
            select: { id: true, projectName: true, totalAmount: true, status: true, createdAt: true }
          }
        }
      });

      return lead;
    } catch (error) {
      console.error('Error getting lead by ID:', error);
      throw new Error('Failed to retrieve lead');
    }
  }

  /**
   * Create a new lead
   */
  static async createLead(leadData, organizationId, createdByUserId) {
    try {
      const {
        firstName,
        lastName,
        email,
        phone,
        company,
        address,
        leadStage,
        assignedUserId,
        leadScore = 0,
        estimatedValue,
        leadSource,
        notes
      } = leadData;

      if (!firstName || !lastName || !email) {
        throw new Error('Missing required fields: firstName, lastName, email');
      }

      const existingLead = await prisma.client.findFirst({
        where: { email, organizationId }
      });

      if (existingLead) {
        throw new Error('Lead with this email already exists');
      }

      let finalLeadStage = leadStage;
      if (!finalLeadStage) {
        const defaultStage = await prisma.leadStage.findFirst({
          where: { organizationId, order: 1 }
        });
        finalLeadStage = defaultStage?.name || 'New Lead';
      }

      const lead = await prisma.client.create({
        data: {
          firstName,
          lastName,
          email,
          phone,
          company,
          address,
          status: 'PROSPECT',
          leadStage: finalLeadStage,
          assignedUserId,
          leadScore: Math.max(0, Math.min(100, leadScore)),
          estimatedValue,
          organizationId,
          lastContactedAt: new Date()
        },
        include: {
          assignedUser: {
            select: { firstName: true, lastName: true, email: true }
          }
        }
      });

      await this.createActivity({
        clientId: lead.id,
        type: 'NOTE',
        description: `Lead created${leadSource ? ` from ${leadSource}` : ''}${notes ? `\n\nNotes: ${notes}` : ''}`,
        organizationId,
        userId: createdByUserId
      });

      return lead;
    } catch (error) {
      console.error('Error creating lead:', error);
      throw error;
    }
  }

  /**
   * Create lead activity
   */
  static async createActivity(activityData) {
    try {
      const {
        clientId,
        type,
        description,
        outcome,
        nextAction,
        nextActionDate,
        duration,
        organizationId,
        userId
      } = activityData;

      const activity = await prisma.leadActivity.create({
        data: {
          clientId,
          type,
          description,
          outcome,
          nextAction,
          nextActionDate,
          duration,
          organizationId,
          userId
        },
        include: {
          user: {
            select: { firstName: true, lastName: true }
          }
        }
      });

      await prisma.client.update({
        where: { id: clientId },
        data: { lastContactedAt: new Date() }
      });

      return activity;
    } catch (error) {
      console.error('Error creating lead activity:', error);
      throw error;
    }
  }

  /**
   * Update lead information
   */
  static async updateLead(leadId, updateData, organizationId, updatedByUserId) {
    try {
      const existingLead = await prisma.client.findFirst({
        where: {
          id: leadId,
          organizationId,
          status: { in: ['PROSPECT', 'QUALIFIED', 'CONVERTED', 'UNQUALIFIED'] }
        }
      });

      if (!existingLead) {
        throw new Error('Lead not found');
      }

      const stageChange = updateData.leadStage && updateData.leadStage !== existingLead.leadStage;
      const assignmentChange = updateData.assignedUserId && updateData.assignedUserId !== existingLead.assignedUserId;

      const updatedLead = await prisma.client.update({
        where: { id: leadId },
        data: {
          ...updateData,
          leadScore: updateData.leadScore ? Math.max(0, Math.min(100, updateData.leadScore)) : undefined
        },
        include: {
          assignedUser: {
            select: { firstName: true, lastName: true, email: true }
          }
        }
      });

      if (stageChange) {
        await this.createActivity({
          clientId: leadId,
          type: 'STAGE_CHANGE',
          description: `Stage changed from "${existingLead.leadStage}" to "${updateData.leadStage}"`,
          organizationId,
          userId: updatedByUserId
        });
      }

      if (assignmentChange) {
        const newAssignee = updateData.assignedUserId ? 
          await prisma.user.findUnique({
            where: { id: updateData.assignedUserId },
            select: { firstName: true, lastName: true }
          }) : null;

        await this.createActivity({
          clientId: leadId,
          type: 'NOTE',
          description: `Lead ${newAssignee ? `assigned to ${newAssignee.firstName} ${newAssignee.lastName}` : 'unassigned'}`,
          organizationId,
          userId: updatedByUserId
        });
      }

      return updatedLead;
    } catch (error) {
      console.error('Error updating lead:', error);
      throw error;
    }
  }

  /**
   * Convert lead to customer
   */
  static async convertLead(leadId, organizationId, userId, conversionData = {}) {
    try {
      const lead = await this.getLeadById(leadId, organizationId);
      if (!lead) throw new Error('Lead not found');

      if (lead.status === 'CONVERTED') {
        throw new Error('Lead is already converted');
      }

      const convertedLead = await prisma.client.update({
        where: { id: leadId },
        data: {
          status: 'CONVERTED',
          convertedAt: new Date(),
          actualValue: conversionData.actualValue || lead.estimatedValue
        },
        include: {
          assignedUser: {
            select: { firstName: true, lastName: true, email: true }
          }
        }
      });

      await this.createActivity({
        clientId: leadId,
        type: 'CONVERSION',
        description: `Lead converted to customer${conversionData.notes ? `\n\nNotes: ${conversionData.notes}` : ''}`,
        organizationId,
        userId
      });

      return convertedLead;
    } catch (error) {
      console.error('Error converting lead:', error);
      throw error;
    }
  }

  /**
   * Get lead pipeline statistics
   */
  static async getPipelineStats(organizationId, assignedUserId = null) {
    try {
      const whereClause = {
        organizationId,
        status: { in: ['PROSPECT', 'QUALIFIED'] }
      };

      if (assignedUserId) {
        whereClause.assignedUserId = assignedUserId;
      }

      const stageStats = await prisma.client.groupBy({
        by: ['leadStage'],
        where: whereClause,
        _count: { id: true },
        _sum: { estimatedValue: true },
        _avg: { leadScore: true }
      });

      const totalLeads = await prisma.client.count({
        where: { organizationId, status: { in: ['PROSPECT', 'QUALIFIED', 'CONVERTED', 'UNQUALIFIED'] } }
      });

      const convertedLeads = await prisma.client.count({
        where: { organizationId, status: 'CONVERTED' }
      });

      const conversionRate = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0;

      const recentActivities = await prisma.leadActivity.findMany({
        where: { organizationId },
        include: {
          user: { select: { firstName: true, lastName: true } },
          client: { select: { firstName: true, lastName: true, company: true } }
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      });

      return {
        stageDistribution: stageStats,
        conversionRate,
        totalLeads,
        convertedLeads,
        recentActivities
      };
    } catch (error) {
      console.error('Error getting pipeline stats:', error);
      throw error;
    }
  }

  /**
   * Assign lead to user
   */
  static async assignLead(leadId, assignedUserId, organizationId, assignedByUserId) {
    try {
      const assignedUser = await prisma.user.findFirst({
        where: { id: assignedUserId, organizationId }
      });

      if (!assignedUser) {
        throw new Error('Assigned user not found in organization');
      }

      const updatedLead = await this.updateLead(leadId, {
        assignedUserId
      }, organizationId, assignedByUserId);

      return updatedLead;
    } catch (error) {
      console.error('Error assigning lead:', error);
      throw error;
    }
  }

}

export default LeadService; 

/* [STABLE COMPONENT - DO NOT MODIFY]
 * This Lead Service is complete and stable.
 * Core functionality:
 * - Lead CRUD operations
 * - Lead filtering and search
 * - Lead stage management
 * - Lead activity tracking
 * - Lead assignment
 * - Lead conversion
 * 
 * This is the core lead management service.
 * Changes here could affect the entire lead management system.
 * Modify only if absolutely necessary and after thorough testing.
 */ 