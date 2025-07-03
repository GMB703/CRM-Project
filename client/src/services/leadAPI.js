import api from './api';

const leadAPI = {
  // Get all leads
  getLeads: () => api.get('/leads'),

  // Get a single lead by ID
  getLead: (id) => api.get(`/leads/${id}`),

  // Create a new lead
  createLead: (leadData) => api.post('/leads', leadData),

  // Update an existing lead
  updateLead: (id, leadData) => api.put(`/leads/${id}`, leadData),

  // Delete a lead
  deleteLead: (id) => api.delete(`/leads/${id}`),

  // Update lead status (for pipeline drag-and-drop)
  updateLeadStatus: (id, status) => api.patch(`/leads/${id}/status`, { status }),

  // Bulk update leads (for future use)
  bulkUpdateLeads: (leadUpdates) => api.patch('/leads/bulk', { leads: leadUpdates }),

  /**
   * Update inactivity threshold for a lead
   */
  updateInactivityThreshold: async (leadId, threshold) => {
    try {
      const response = await api.patch(`/api/leads/${leadId}/inactivity-threshold`, {
        threshold
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Update reminder settings for a lead
   * @param {string} leadId - Lead ID
   * @param {Object} settings - Reminder settings
   * @param {number} settings.inactivityThreshold - Days before considered inactive
   * @param {number} settings.reminderFrequency - Days between reminders
   * @returns {Promise} API response
   */
  updateReminderSettings: async (leadId, settings) => {
    try {
      const response = await api.put(`/api/leads/${leadId}/reminder-settings`, settings);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to update reminder settings');
    }
  }
};

export default leadAPI; 