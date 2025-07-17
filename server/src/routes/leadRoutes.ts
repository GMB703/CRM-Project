import { Router } from 'express';
import { validateRequest } from '../middleware/validateRequest';
import { isAuthenticated } from '../middleware/isAuthenticated';
import leadService from '../services/leadService';

const router = Router();

// Get all leads with filtering, sorting, and pagination
router.get('/', isAuthenticated, async (req, res, next) => {
  try {
    const { 
      search, stage, assignedUserId, minLeadScore, maxLeadScore,
      minEstimatedValue, maxEstimatedValue, source, status,
      startDate, endDate, page = 1, limit = 10, sortField = 'createdAt',
      sortDirection = 'desc'
    } = req.query;

    const filter = {
      organizationId: req.user.organizationId,
      search: search as string,
      stage: stage as string,
      assignedUserId: assignedUserId as string,
      minLeadScore: minLeadScore ? Number(minLeadScore) : undefined,
      maxLeadScore: maxLeadScore ? Number(maxLeadScore) : undefined,
      minEstimatedValue: minEstimatedValue ? Number(minEstimatedValue) : undefined,
      maxEstimatedValue: maxEstimatedValue ? Number(maxEstimatedValue) : undefined,
      source: source as string,
      status: status as string,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
    };

    const sort = {
      field: sortField as string,
      direction: sortDirection as 'asc' | 'desc',
    };

    const pagination = {
      page: Number(page),
      limit: Number(limit),
    };

    const result = await leadService.getLeads(filter, sort, pagination);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Get lead by ID
router.get('/:id', isAuthenticated, async (req, res, next) => {
  try {
    const lead = await leadService.getLeadById(req.params.id, req.user.organizationId);
    res.json(lead);
  } catch (error) {
    next(error);
  }
});

// Create new lead
router.post('/', isAuthenticated, validateRequest({
  body: {
    firstName: { type: 'string', required: true },
    lastName: { type: 'string', required: true },
    email: { type: 'string', required: true },
    phone: { type: 'string', optional: true },
    company: { type: 'string', optional: true },
    source: { type: 'string', required: true },
    estimatedValue: { type: 'number', optional: true },
    assignedUserId: { type: 'string', optional: true },
  }
}), async (req, res, next) => {
  try {
    const leadData = {
      ...req.body,
      organizationId: req.user.organizationId,
      createdById: req.user.id,
    };
    const lead = await leadService.createLead(leadData);
    res.status(201).json(lead);
  } catch (error) {
    next(error);
  }
});

// Update lead
router.put('/:id', isAuthenticated, validateRequest({
  body: {
    firstName: { type: 'string', optional: true },
    lastName: { type: 'string', optional: true },
    email: { type: 'string', optional: true },
    phone: { type: 'string', optional: true },
    company: { type: 'string', optional: true },
    source: { type: 'string', optional: true },
    estimatedValue: { type: 'number', optional: true },
    assignedUserId: { type: 'string', optional: true },
    leadScore: { type: 'number', optional: true },
  }
}), async (req, res, next) => {
  try {
    const lead = await leadService.updateLead(req.params.id, req.user.organizationId, req.body);
    res.json(lead);
  } catch (error) {
    next(error);
  }
});

// Delete lead
router.delete('/:id', isAuthenticated, async (req, res, next) => {
  try {
    await leadService.deleteLead(req.params.id, req.user.organizationId);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

// Update lead stage
router.put('/:id/stage', isAuthenticated, validateRequest({
  body: {
    stage: { type: 'string', required: true },
  }
}), async (req, res, next) => {
  try {
    const lead = await leadService.updateLeadStage(
      req.params.id,
      req.user.organizationId,
      req.body.stage,
      req.user.id
    );
    res.json(lead);
  } catch (error) {
    next(error);
  }
});

// Create lead activity
router.post('/:id/activities', isAuthenticated, validateRequest({
  body: {
    type: { type: 'string', required: true },
    title: { type: 'string', required: true },
    description: { type: 'string', optional: true },
    outcome: { type: 'string', optional: true },
    nextAction: { type: 'string', optional: true },
    duration: { type: 'number', optional: true },
    scheduledAt: { type: 'string', optional: true },
    completedAt: { type: 'string', optional: true },
  }
}), async (req, res, next) => {
  try {
    const activityData = {
      ...req.body,
      clientId: req.params.id,
      userId: req.user.id,
      organizationId: req.user.organizationId,
      scheduledAt: req.body.scheduledAt ? new Date(req.body.scheduledAt) : undefined,
      completedAt: req.body.completedAt ? new Date(req.body.completedAt) : undefined,
    };
    const activity = await leadService.createLeadActivity(activityData);
    res.status(201).json(activity);
  } catch (error) {
    next(error);
  }
});

// Get lead activities
router.get('/:id/activities', isAuthenticated, async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const activities = await leadService.getLeadActivities(
      req.params.id,
      req.user.organizationId,
      Number(page),
      Number(limit)
    );
    res.json(activities);
  } catch (error) {
    next(error);
  }
});

// Get lead stages
router.get('/stages/list', isAuthenticated, async (req, res, next) => {
  try {
    const stages = await leadService.getLeadStages(req.user.organizationId);
    res.json(stages);
  } catch (error) {
    next(error);
  }
});

// Get lead sources
router.get('/sources/list', isAuthenticated, async (req, res, next) => {
  try {
    const sources = await leadService.getLeadSources(req.user.organizationId);
    res.json(sources);
  } catch (error) {
    next(error);
  }
});

// Get lead statistics
router.get('/statistics/overview', isAuthenticated, async (req, res, next) => {
  try {
    const statistics = await leadService.getLeadStatistics(req.user.organizationId);
    res.json(statistics);
  } catch (error) {
    next(error);
  }
});

export default router; 