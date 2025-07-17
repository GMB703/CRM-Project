const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { auth } = require('../middleware/auth');

// Apply auth middleware to all routes
router.use(auth);

// Dashboard metrics routes
router.get('/metrics', dashboardController.getMetrics);
router.get('/projects/metrics', dashboardController.getProjectMetrics);
router.get('/tasks/metrics', dashboardController.getTaskMetrics);
router.get('/financial/metrics', dashboardController.getFinancialMetrics);
router.get('/clients/metrics', dashboardController.getClientMetrics);
router.get('/trends', dashboardController.getTrendData);

module.exports = router; 