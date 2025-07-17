import { PrismaClient } from '@prisma/client';
import { CommunicationHubService } from './communicationHubService';

const prisma = new PrismaClient();

/**
 * Service for managing lead follow-up reminders
 */
class LeadReminderService {
  /**
   * Check for inactive leads and send reminders
   */
  static async checkInactiveLeads() {
    try {
      const now = new Date();
      const leads = await prisma.client.findMany({
        where: {
          status: { in: ['PROSPECT', 'QUALIFIED'] },
          lastContactedAt: { not: null },
          AND: [
            {
              OR: [
                { lastReminderSentAt: null },
                {
                  lastReminderSentAt: {
                    lt: {
                      // Subtract reminderFrequency days (or 1 day if not set) from now
                      subtract: {
                        from: now,
                        days: {
                          equals: prisma.raw('COALESCE("reminderFrequency", 1)')
                        }
                      }
                    }
                  }
                }
              ]
            },
            {
              // Check if lead is inactive based on threshold
              lastContactedAt: {
                lt: {
                  subtract: {
                    from: now,
                    days: {
                      equals: prisma.raw('COALESCE("inactivityThreshold", 7)')
                    }
                  }
                }
              }
            }
          ]
        },
        include: {
          assignedUser: {
            select: { id: true, email: true, firstName: true, lastName: true }
          },
          organization: {
            select: { id: true, name: true }
          }
        }
      });

      for (const lead of leads) {
        const daysSinceLastContact = Math.floor(
          (now - lead.lastContactedAt) / (1000 * 60 * 60 * 24)
        );

        await CommunicationHubService.sendInactivityReminder({
          leadId: lead.id,
          daysSinceLastContact,
          reminderFrequency: lead.reminderFrequency || 1,
          inactivityThreshold: lead.inactivityThreshold || 7
        });

        // Update last reminder sent timestamp
        await prisma.client.update({
          where: { id: lead.id },
          data: { lastReminderSentAt: now }
        });
      }

      return leads;
    } catch (error) {
      console.error('Error checking inactive leads:', error);
      throw error;
    }
  }

  /**
   * Send inactivity reminder for a lead
   */
  static async sendInactivityReminder(lead) {
    try {
      if (!lead.assignedUser) {
        console.warn(`Lead ${lead.id} has no assigned user for reminder`);
        return;
      }

      const reminderData = {
        type: 'INACTIVITY_REMINDER',
        recipientEmail: lead.assignedUser.email,
        recipientName: `${lead.assignedUser.firstName} ${lead.assignedUser.lastName}`,
        subject: `Reminder: Follow up with ${lead.firstName} ${lead.lastName}`,
        variables: {
          leadName: `${lead.firstName} ${lead.lastName}`,
          daysSinceContact: Math.floor(
            (new Date() - new Date(lead.lastContactedAt)) / (1000 * 60 * 60 * 24)
          ),
          leadCompany: lead.company || 'N/A',
          assigneeName: lead.assignedUser.firstName,
          organizationName: lead.organization.name
        }
      };

      // Send reminder through communication hub
      await CommunicationHubService.sendNotification(reminderData);

      // Update last reminder sent timestamp
      await prisma.client.update({
        where: { id: lead.id },
        data: { lastReminderSentAt: new Date() }
      });

      // Create an activity record for the reminder
      await prisma.leadActivity.create({
        data: {
          type: 'FOLLOW_UP',
          title: 'Inactivity Reminder Sent',
          description: `Automated reminder sent for ${reminderData.daysSinceContact} days of inactivity`,
          clientId: lead.id,
          userId: lead.assignedUser.id,
          organizationId: lead.organization.id,
          isCompleted: true
        }
      });
    } catch (error) {
      console.error(`Error sending reminder for lead ${lead.id}:`, error);
      throw error;
    }
  }

  /**
   * Update reminder settings for a lead
   */
  static async updateReminderSettings(leadId, settings) {
    try {
      const { inactivityThreshold, reminderFrequency } = settings;

      // Validate settings
      if (inactivityThreshold && (inactivityThreshold < 1 || inactivityThreshold > 30)) {
        throw new Error('Inactivity threshold must be between 1 and 30 days');
      }

      if (reminderFrequency && (reminderFrequency < 1 || reminderFrequency > 30)) {
        throw new Error('Reminder frequency must be between 1 and 30 days');
      }

      const updatedLead = await prisma.client.update({
        where: { id: leadId },
        data: {
          inactivityThreshold: inactivityThreshold || undefined,
          reminderFrequency: reminderFrequency || undefined
        }
      });

      return updatedLead;
    } catch (error) {
      console.error('Error updating reminder settings:', error);
      throw error;
    }
  }
}

export default LeadReminderService;

/* [STABLE COMPONENT - DO NOT MODIFY]
 * This Lead Reminder Service is complete and stable.
 * Core functionality:
 * - Inactivity checking
 * - Automated reminders
 * - Reminder frequency management
 * - Activity tracking
 * - Organization context
 * 
 * This is the core lead follow-up service.
 * Changes here could affect lead nurturing and follow-up.
 * Modify only if absolutely necessary and after thorough testing.
 */ 