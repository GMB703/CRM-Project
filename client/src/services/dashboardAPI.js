import { api } from "./api";

// Get overall metrics
export const getMetrics = async () => {
  const response = await api.get("/dashboard/metrics");
  return response.data;
};

// Get project metrics
export const getProjectMetrics = async () => {
  const response = await api.get("/dashboard/projects/metrics");
  return response.data;
};

// Get task metrics
export const getTaskMetrics = async () => {
  const response = await api.get("/dashboard/tasks/metrics");
  return response.data;
};

// Get financial metrics
export const getFinancialMetrics = async () => {
  const response = await api.get("/dashboard/financial/metrics");
  return response.data;
};

// Get client metrics
export const getClientMetrics = async () => {
  const response = await api.get("/dashboard/clients/metrics");
  return response.data;
};

// Get trend data
export const getTrendData = async (metric, timeframe = 6) => {
  const response = await api.get(
    `/dashboard/trends?metric=${metric}&timeframe=${timeframe}`,
  );
  return response.data;
};

// Get all dashboard data combined
export const getDashboardData = async () => {
  try {
    const [metrics, projects, tasks, financial, clients] = await Promise.all([
      getMetrics(),
      getProjectMetrics(),
      getTaskMetrics(),
      getFinancialMetrics(),
      getClientMetrics(),
    ]);

    return {
      overview: {
        ...metrics,
        totalClients: clients.total,
        activeProjects: projects.active,
        overdueTasks: tasks.overdue,
        outstandingInvoices: financial.outstanding,
      },
      recentActivities: {
        projects: projects.recent,
        communications: clients.recentCommunications,
        invoices: financial.recentInvoices,
      },
    };
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    throw error;
  }
};
