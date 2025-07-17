import LeadReminderService from '../services/leadReminderService.js';
import { prisma } from '../lib/prisma.js';

/**
 * Update inactivity threshold for a lead
 */
exports.updateInactivityThreshold = async (req, res) => {
  try {
    const { leadId } = req.params;
    const { threshold } = req.body;
    const organizationId = req.user.organizationId;

    if (!threshold || threshold < 1 || threshold > 30) {
      return res.status(400).json({
        success: false,
        message: 'Threshold must be between 1 and 30 days'
      });
    }

    const updatedLead = await LeadReminderService.updateInactivityThreshold(
      leadId,
      organizationId,
      threshold
    );

    res.json({
      success: true,
      data: updatedLead
    });
  } catch (error) {
    console.error('Error updating inactivity threshold:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update inactivity threshold'
    });
  }
};

/**
 * Update reminder settings for a lead
 */
const updateReminderSettings = async (req, res) => {
  try {
    const { id } = req.params;
    const { inactivityThreshold, reminderFrequency } = req.body;
    const { organizationId } = req.multiTenant;

    // Validate input
    if (!inactivityThreshold || !reminderFrequency) {
      return res.status(400).json({
        success: false,
        error: 'Both inactivityThreshold and reminderFrequency are required'
      });
    }

    // Validate ranges
    if (inactivityThreshold < 1 || inactivityThreshold > 30) {
      return res.status(400).json({
        success: false,
        error: 'Inactivity threshold must be between 1 and 30 days'
      });
    }

    if (reminderFrequency < 1 || reminderFrequency > 30) {
      return res.status(400).json({
        success: false,
        error: 'Reminder frequency must be between 1 and 30 days'
      });
    }

    // Update the lead
    const updatedLead = await prisma.client.update({
      where: {
        id,
        organizationId
      },
      data: {
        inactivityThreshold: parseInt(inactivityThreshold),
        reminderFrequency: parseInt(reminderFrequency)
      }
    });

    res.json({
      success: true,
      data: updatedLead
    });
  } catch (error) {
    console.error('Error updating reminder settings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update reminder settings',
      details: error.message
    });
  }
};

module.exports = {
  updateInactivityThreshold,
  updateReminderSettings
}; 