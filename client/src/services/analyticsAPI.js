import { api } from "./api";

/**
 * Get system-wide analytics metrics
 * @returns {Promise<Object>} System metrics data
 */
export const getSystemMetrics = async () => {
  try {
    const response = await api.get("/analytics/system");
    return response.data;
  } catch (error) {
    console.error("Error fetching system metrics:", error);
    throw error;
  }
};

/**
 * Get organization-specific analytics metrics
 * @param {string} organizationId - Organization ID
 * @returns {Promise<Object>} Organization metrics data
 */
export const getOrganizationMetrics = async (organizationId) => {
  try {
    const response = await api.get(`/analytics/organization/${organizationId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching organization metrics:", error);
    throw error;
  }
};

/**
 * Get user-specific analytics metrics
 * @param {string} userId - User ID
 * @returns {Promise<Object>} User metrics data
 */
export const getUserMetrics = async (userId) => {
  try {
    const response = await api.get(`/analytics/user/${userId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching user metrics:", error);
    throw error;
  }
};

/**
 * Get pipeline analytics data
 * @param {Object} filters - Pipeline filters
 * @returns {Promise<Object>} Pipeline analytics data
 */
export const getPipelineAnalytics = async (filters = {}) => {
  try {
    const response = await api.get("/analytics/pipeline", {
      params: filters,
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching pipeline analytics:", error);
    throw error;
  }
};

/**
 * Get revenue analytics data
 * @param {Object} params - Revenue parameters
 * @param {string} params.startDate - Start date for revenue analysis
 * @param {string} params.endDate - End date for revenue analysis
 * @returns {Promise<Object>} Revenue analytics data
 */
export const getRevenueAnalytics = async ({ startDate, endDate }) => {
  try {
    const response = await api.get("/analytics/revenue", {
      params: { startDate, endDate },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching revenue analytics:", error);
    throw error;
  }
};

/**
 * Get task completion analytics
 * @param {Object} filters - Task filters
 * @returns {Promise<Object>} Task analytics data
 */
export const getTaskAnalytics = async (filters = {}) => {
  try {
    const response = await api.get("/analytics/tasks", { params: filters });
    return response.data;
  } catch (error) {
    console.error("Error fetching task analytics:", error);
    throw error;
  }
};

/**
 * Get notification analytics
 * @returns {Promise<Object>} Notification analytics data
 */
export const getNotificationAnalytics = async () => {
  try {
    const response = await api.get("/analytics/notifications");
    return response.data;
  } catch (error) {
    console.error("Error fetching notification analytics:", error);
    throw error;
  }
};

/**
 * Mark notification as read
 * @param {string} notificationId - Notification ID
 * @returns {Promise<Object>} Updated notification data
 */
export const markNotificationRead = async (notificationId) => {
  try {
    const response = await api.put(
      `/analytics/notifications/${notificationId}/read`,
    );
    return response.data;
  } catch (error) {
    console.error("Error marking notification as read:", error);
    throw error;
  }
};

/**
 * Get overview analytics data
 * @returns {Promise<Object>} Overview analytics data
 */
export const getOverviewAnalytics = async () => {
  try {
    const response = await api.get("/analytics/overview");
    return response.data;
  } catch (error) {
    console.error("Error fetching overview analytics:", error);
    throw error;
  }
};
