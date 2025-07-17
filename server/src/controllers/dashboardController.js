const dashboardService = require('../services/dashboardService');

const dashboardController = {
  // Get overall metrics
  getMetrics: async (req, res) => {
    try {
      const metrics = await dashboardService.getMetrics(req.organizationId);
      res.json({ success: true, data: metrics });
    } catch (error) {
      console.error('Error fetching metrics:', error);
      res.status(500).json({
        success: false,
        error: 'Error fetching metrics'
      });
    }
  },

  // Get project metrics
  getProjectMetrics: async (req, res) => {
    try {
      const metrics = await dashboardService.getProjectMetrics(req.organizationId);
      res.json({ success: true, data: metrics });
    } catch (error) {
      console.error('Error fetching project metrics:', error);
      res.status(500).json({
        success: false,
        error: 'Error fetching project metrics'
      });
    }
  },

  // Get task metrics
  getTaskMetrics: async (req, res) => {
    try {
      const metrics = await dashboardService.getTaskMetrics(req.organizationId);
      res.json({ success: true, data: metrics });
    } catch (error) {
      console.error('Error fetching task metrics:', error);
      res.status(500).json({
        success: false,
        error: 'Error fetching task metrics'
      });
    }
  },

  // Get financial metrics
  getFinancialMetrics: async (req, res) => {
    try {
      const metrics = await dashboardService.getFinancialMetrics(req.organizationId);
      res.json({ success: true, data: metrics });
    } catch (error) {
      console.error('Error fetching financial metrics:', error);
      res.status(500).json({
        success: false,
        error: 'Error fetching financial metrics'
      });
    }
  },

  // Get client metrics
  getClientMetrics: async (req, res) => {
    try {
      const metrics = await dashboardService.getClientMetrics(req.organizationId);
      res.json({ success: true, data: metrics });
    } catch (error) {
      console.error('Error fetching client metrics:', error);
      res.status(500).json({
        success: false,
        error: 'Error fetching client metrics'
      });
    }
  },

  // Get trend data
  getTrendData: async (req, res) => {
    try {
      const { metric, timeframe = 6 } = req.query;
      const data = await dashboardService.getTrendData(
        req.organizationId,
        metric,
        parseInt(timeframe)
      );
      res.json({ success: true, data });
    } catch (error) {
      console.error('Error fetching trend data:', error);
      res.status(500).json({
        success: false,
        error: 'Error fetching trend data'
      });
    }
  }
};

module.exports = dashboardController; 