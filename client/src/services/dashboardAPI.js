import api from './api';

const dashboardAPI = {
  // Get overall metrics
  getMetrics: async () => {
    const response = await api.get('/dashboard/metrics');
    return response.data;
  },

  // Get project metrics
  getProjectMetrics: async () => {
    const response = await api.get('/dashboard/projects/metrics');
    return response.data;
  },

  // Get task metrics
  getTaskMetrics: async () => {
    const response = await api.get('/dashboard/tasks/metrics');
    return response.data;
  },

  // Get financial metrics
  getFinancialMetrics: async () => {
    const response = await api.get('/dashboard/financial/metrics');
    return response.data;
  },

  // Get client metrics
  getClientMetrics: async () => {
    const response = await api.get('/dashboard/clients/metrics');
    return response.data;
  },

  // Get trend data
  getTrendData: async (metric, timeframe = 6) => {
    const response = await api.get(`/dashboard/trends?metric=${metric}&timeframe=${timeframe}`);
    return response.data;
  }
};

export default dashboardAPI; 