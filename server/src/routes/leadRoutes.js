const express = require('express');
const router = express.Router();
const leadController = require('../controllers/leadController');

// Update inactivity threshold
router.patch('/:leadId/inactivity-threshold', 
  authMiddleware.protect,
  authMiddleware.restrictTo('admin', 'manager', 'user'),
  leadController.updateInactivityThreshold
); 

// Update reminder settings
router.put('/:id/reminder-settings', leadController.updateReminderSettings); 

module.exports = router; 