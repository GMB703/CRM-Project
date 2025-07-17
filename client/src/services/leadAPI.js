import { api } from "./api";

// Get all leads
export const getLeads = () => api.get("/leads");

// Get a single lead by ID
export const getLead = (id) => api.get(`/leads/${id}`);

// Create a new lead
export const createLead = (leadData) => api.post("/leads", leadData);

// Update an existing lead
export const updateLead = (id, leadData) => api.put(`/leads/${id}`, leadData);

// Delete a lead
export const deleteLead = (id) => api.delete(`/leads/${id}`);

// Update lead status (for pipeline drag-and-drop)
export const updateLeadStatus = (id, status) =>
  api.patch(`/leads/${id}/status`, { status });

// Bulk update leads (for future use)
export const bulkUpdateLeads = (leadUpdates) =>
  api.patch("/leads/bulk", { leads: leadUpdates });

/**
 * Update inactivity threshold for a lead
 */
export const updateInactivityThreshold = async (leadId, threshold) => {
  try {
    const response = await api.patch(
      `/api/leads/${leadId}/inactivity-threshold`,
      {
        threshold,
      },
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

/**
 * Update reminder settings for a lead
 * @param {string} leadId - Lead ID
 * @param {Object} settings - Reminder settings
 * @param {number} settings.inactivityThreshold - Days before considered inactive
 * @param {number} settings.reminderFrequency - Days between reminders
 * @returns {Promise} API response
 */
export const updateReminderSettings = async (leadId, settings) => {
  try {
    const response = await api.put(
      `/api/leads/${leadId}/reminder-settings`,
      settings,
    );
    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.error || "Failed to update reminder settings",
    );
  }
};

// Get pipeline data
export const getPipelineData = async () => {
  try {
    const response = await api.get("/leads/pipeline");
    return response.data;
  } catch (error) {
    console.error("Error fetching pipeline data:", error);
    throw error;
  }
};

// Update lead stage
export const updateLeadStage = async (leadId, newStatus) => {
  try {
    const response = await api.patch(`/leads/${leadId}/status`, {
      status: newStatus,
    });
    return response.data;
  } catch (error) {
    console.error("Error updating lead stage:", error);
    throw error;
  }
};
