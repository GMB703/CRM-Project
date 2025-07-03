import express from 'express';
import { auth as authMiddleware } from '../middleware/auth.js';
import { createMultiTenantMiddleware } from '../middleware/multiTenant.js';
import LeadService from '../services/leadService.js';
import LeadConfigService from '../services/leadConfigService.js';

const router = express.Router();
const multiTenantMiddleware = createMultiTenantMiddleware();

// Apply middleware to all routes
router.use(authMiddleware);
router.use(multiTenantMiddleware);

// Get all leads with filtering and pagination
router.get('/', async (req, res) => {
  try {
    const { organizationId } = req.multiTenant;
    const { 
      stage, 
      assignedUserId, 
      status, 
      searchTerm, 
      skip = 0, 
      take = 50, 
      orderBy = 'createdAt',
      orderDirection = 'desc' 
    } = req.query;

    const filters = {
      stage,
      assignedUserId,
      status,
      searchTerm
    };

    const pagination = {
      skip: parseInt(skip),
      take: parseInt(take),
      orderBy: { [orderBy]: orderDirection }
    };

    const result = await LeadService.getLeads(organizationId, filters, pagination);

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Error fetching leads:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch leads',
      details: error.message 
    });
  }
});

// Get lead by ID with full details
router.get('/:id', async (req, res) => {
  try {
    const { organizationId } = req.multiTenant;
    const { id } = req.params;

    const lead = await LeadService.getLeadById(id, organizationId);

    if (!lead) {
      return res.status(404).json({ 
        success: false,
        error: 'Lead not found' 
      });
    }

    res.json({
      success: true,
      data: lead
    });
  } catch (error) {
    console.error('Error fetching lead:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch lead',
      details: error.message 
    });
  }
});

// Create a new lead
router.post('/', async (req, res) => {
  try {
    const { organizationId } = req.multiTenant;
    const { userId } = req.user;
    const leadData = req.body;

    const lead = await LeadService.createLead(leadData, organizationId, userId);

    res.status(201).json({
      success: true,
      data: lead
    });
  } catch (error) {
    console.error('Error creating lead:', error);
    
    if (error.message.includes('Missing required fields') || 
        error.message.includes('already exists')) {
      return res.status(400).json({ 
        success: false,
        error: error.message 
      });
    }

    res.status(500).json({ 
      success: false,
      error: 'Failed to create lead',
      details: error.message 
    });
  }
});

// Update lead
router.put('/:id', async (req, res) => {
  try {
    const { organizationId } = req.multiTenant;
    const { userId } = req.user;
    const { id } = req.params;
    const updateData = req.body;

    const updatedLead = await LeadService.updateLead(id, updateData, organizationId, userId);

    res.json({
      success: true,
      data: updatedLead
    });
  } catch (error) {
    console.error('Error updating lead:', error);
    
    if (error.message === 'Lead not found') {
      return res.status(404).json({ 
        success: false,
        error: error.message 
      });
    }

    res.status(500).json({ 
      success: false,
      error: 'Failed to update lead',
      details: error.message 
    });
  }
});

// Convert lead to customer
router.post('/:id/convert', async (req, res) => {
  try {
    const { organizationId } = req.multiTenant;
    const { userId } = req.user;
    const { id } = req.params;
    const conversionData = req.body;

    const convertedLead = await LeadService.convertLead(id, organizationId, userId, conversionData);

    res.json({
      success: true,
      data: convertedLead,
      message: 'Lead converted to customer successfully'
    });
  } catch (error) {
    console.error('Error converting lead:', error);
    
    if (error.message === 'Lead not found') {
      return res.status(404).json({ 
        success: false,
        error: error.message 
      });
    }

    if (error.message === 'Lead is already converted') {
      return res.status(400).json({ 
        success: false,
        error: error.message 
      });
    }

    res.status(500).json({ 
      success: false,
      error: 'Failed to convert lead',
      details: error.message 
    });
  }
});

// Assign lead to user
router.post('/:id/assign', async (req, res) => {
  try {
    const { organizationId } = req.multiTenant;
    const { userId } = req.user;
    const { id } = req.params;
    const { assignedUserId } = req.body;

    if (!assignedUserId) {
      return res.status(400).json({ 
        success: false,
        error: 'assignedUserId is required' 
      });
    }

    const updatedLead = await LeadService.assignLead(id, assignedUserId, organizationId, userId);

    res.json({
      success: true,
      data: updatedLead,
      message: 'Lead assigned successfully'
    });
  } catch (error) {
    console.error('Error assigning lead:', error);
    
    if (error.message.includes('not found')) {
      return res.status(404).json({ 
        success: false,
        error: error.message 
      });
    }

    res.status(500).json({ 
      success: false,
      error: 'Failed to assign lead',
      details: error.message 
    });
  }
});

// Create lead activity
router.post('/:id/activities', async (req, res) => {
  try {
    const { organizationId } = req.multiTenant;
    const { userId } = req.user;
    const { id } = req.params;
    const activityData = req.body;

    const activity = await LeadService.createActivity({
      ...activityData,
      clientId: id,
      organizationId,
      userId
    });

    res.status(201).json({
      success: true,
      data: activity
    });
  } catch (error) {
    console.error('Error creating lead activity:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to create lead activity',
      details: error.message 
    });
  }
});

// Get pipeline statistics
router.get('/stats/pipeline', async (req, res) => {
  try {
    const { organizationId } = req.multiTenant;
    const { assignedUserId } = req.query;

    const stats = await LeadService.getPipelineStats(organizationId, assignedUserId);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching pipeline stats:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch pipeline statistics',
      details: error.message 
    });
  }
});

// Get user's assigned leads
router.get('/user/:userId', async (req, res) => {
  try {
    const { organizationId } = req.multiTenant;
    const { userId } = req.params;
    const { stage, status } = req.query;

    const filters = { stage, status };
    const result = await LeadService.getUserLeads(userId, organizationId, filters);

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Error fetching user leads:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch user leads',
      details: error.message 
    });
  }
});

// Lead Configuration Routes

// Get lead stages
router.get('/config/stages', async (req, res) => {
  try {
    const { organizationId } = req.multiTenant;

    const stages = await LeadConfigService.getLeadStages(organizationId);

    res.json({
      success: true,
      data: stages
    });
  } catch (error) {
    console.error('Error fetching lead stages:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch lead stages',
      details: error.message 
    });
  }
});

// Create lead stage
router.post('/config/stages', async (req, res) => {
  try {
    const { organizationId } = req.multiTenant;
    const stageData = req.body;

    const stage = await LeadConfigService.createLeadStage(stageData, organizationId);

    res.status(201).json({
      success: true,
      data: stage
    });
  } catch (error) {
    console.error('Error creating lead stage:', error);
    
    if (error.message.includes('required') || error.message.includes('already exists')) {
      return res.status(400).json({ 
        success: false,
        error: error.message 
      });
    }

    res.status(500).json({ 
      success: false,
      error: 'Failed to create lead stage',
      details: error.message 
    });
  }
});

// Update lead stage
router.put('/config/stages/:id', async (req, res) => {
  try {
    const { organizationId } = req.multiTenant;
    const { id } = req.params;
    const updateData = req.body;

    const updatedStage = await LeadConfigService.updateLeadStage(id, updateData, organizationId);

    res.json({
      success: true,
      data: updatedStage
    });
  } catch (error) {
    console.error('Error updating lead stage:', error);
    
    if (error.message === 'Lead stage not found') {
      return res.status(404).json({ 
        success: false,
        error: error.message 
      });
    }

    res.status(500).json({ 
      success: false,
      error: 'Failed to update lead stage',
      details: error.message 
    });
  }
});

// Delete lead stage
router.delete('/config/stages/:id', async (req, res) => {
  try {
    const { organizationId } = req.multiTenant;
    const { id } = req.params;

    await LeadConfigService.deleteLeadStage(id, organizationId);

    res.json({
      success: true,
      message: 'Lead stage deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting lead stage:', error);
    
    if (error.message === 'Lead stage not found') {
      return res.status(404).json({ 
        success: false,
        error: error.message 
      });
    }

    if (error.message.includes('Cannot delete stage')) {
      return res.status(400).json({ 
        success: false,
        error: error.message 
      });
    }

    res.status(500).json({ 
      success: false,
      error: 'Failed to delete lead stage',
      details: error.message 
    });
  }
});

// Get lead sources
router.get('/config/sources', async (req, res) => {
  try {
    const { organizationId } = req.multiTenant;

    const sources = await LeadConfigService.getLeadSources(organizationId);

    res.json({
      success: true,
      data: sources
    });
  } catch (error) {
    console.error('Error fetching lead sources:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch lead sources',
      details: error.message 
    });
  }
});

// Create lead source
router.post('/config/sources', async (req, res) => {
  try {
    const { organizationId } = req.multiTenant;
    const sourceData = req.body;

    const source = await LeadConfigService.createLeadSource(sourceData, organizationId);

    res.status(201).json({
      success: true,
      data: source
    });
  } catch (error) {
    console.error('Error creating lead source:', error);
    
    if (error.message.includes('required') || error.message.includes('already exists')) {
      return res.status(400).json({ 
        success: false,
        error: error.message 
      });
    }

    res.status(500).json({ 
      success: false,
      error: 'Failed to create lead source',
      details: error.message 
    });
  }
});

export default router;
