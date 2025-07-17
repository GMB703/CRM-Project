const express = require('express');
const router = express.Router();
const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const organizationRoutes = require('./organizationRoutes');
const leadRoutes = require('./leadRoutes');
const dashboardRoutes = require('./dashboardRoutes');
const permissionsRouter = require('./permissions.js');

// Mount routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/organizations', organizationRoutes);
router.use('/leads', leadRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/permissions', permissionsRouter);

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

module.exports = router; 