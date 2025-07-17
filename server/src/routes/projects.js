import express from 'express';
import { PrismaClient } from '@prisma/client';
import { auth as authMiddleware } from '../middleware/auth.js';
import { createMultiTenantMiddleware } from '../middleware/multiTenant.js';

const router = express.Router();
const prisma = new PrismaClient();
const multiTenantMiddleware = createMultiTenantMiddleware();

// Apply middleware to all routes
router.use(authMiddleware);
router.use(multiTenantMiddleware);

// Get all projects for the current organization
router.get('/', async (req, res) => {
  try {
    const { organizationId } = req.multiTenant;

    const projects = await prisma.project.findMany({
      where: {
        organizationId: organizationId
      },
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({
      success: true,
      data: projects
    });
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch projects',
      details: error.message 
    });
  }
});

// Get a specific project by ID
router.get('/:id', async (req, res) => {
  try {
    const { organizationId } = req.multiTenant;
    const { id } = req.params;

    const project = await prisma.project.findFirst({
      where: {
        id: id,
        organizationId: organizationId
      },
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true
          }
        },
        tasks: {
          select: {
            id: true,
            title: true,
            status: true,
            dueDate: true
          }
        }
      }
    });

    if (!project) {
      return res.status(404).json({ 
        success: false,
        error: 'Project not found' 
      });
    }

    res.json({
      success: true,
      data: project
    });
  } catch (error) {
    console.error('Error fetching project:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch project',
      details: error.message 
    });
  }
});

// Create a new project
router.post('/', async (req, res) => {
  try {
    const { organizationId } = req.multiTenant;
    const { 
      name, 
      description, 
      clientId, 
      status = 'PLANNING', 
      startDate, 
      endDate, 
      budget,
      notes 
    } = req.body;

    // Validate required fields
    if (!name) {
      return res.status(400).json({ 
        success: false,
        error: 'Missing required field: name' 
      });
    }

    if (!clientId) {
      return res.status(400).json({ 
        success: false,
        error: 'Missing required field: clientId (Customer must be selected)' 
      });
    }

    // Validate client exists
    const client = await prisma.client.findFirst({
      where: {
        id: clientId,
        organizationId: organizationId
      }
    });

    if (!client) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid client ID' 
      });
    }

    // Validate dates
    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      return res.status(400).json({ 
        success: false,
        error: 'Start date cannot be after end date' 
      });
    }

    // Get the current user as creator
    const creatorId = req.user.id;

    const project = await prisma.project.create({
      data: {
        name,
        description: description || null,
        creatorId: creatorId,
        status,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        budget: budget ? parseFloat(budget) : null,
        notes: notes || null,
        organization: {
          connect: {
            id: organizationId
          }
        },
        client: {
          connect: {
            id: clientId
          }
        }
      },
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      data: project
    });
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to create project',
      details: error.message 
    });
  }
});

// Update a project
router.put('/:id', async (req, res) => {
  try {
    const { organizationId } = req.multiTenant;
    const { id } = req.params;
    const { 
      name, 
      description, 
      clientId, 
      status, 
      startDate, 
      endDate, 
      budget,
      notes 
    } = req.body;

    // Check if project exists and belongs to organization
    const existingProject = await prisma.project.findFirst({
      where: {
        id: id,
        organizationId: organizationId
      }
    });

    if (!existingProject) {
      return res.status(404).json({ 
        success: false,
        error: 'Project not found' 
      });
    }

    // Validate client exists if provided
    if (clientId) {
      const client = await prisma.client.findFirst({
        where: {
          id: clientId,
          organizationId: organizationId
        }
      });

      if (!client) {
        return res.status(400).json({ 
          success: false,
          error: 'Invalid client ID' 
        });
      }
    }

    // Validate dates
    const newStartDate = startDate !== undefined ? (startDate ? new Date(startDate) : null) : existingProject.startDate;
    const newEndDate = endDate !== undefined ? (endDate ? new Date(endDate) : null) : existingProject.endDate;
    
    if (newStartDate && newEndDate && newStartDate > newEndDate) {
      return res.status(400).json({ 
        success: false,
        error: 'Start date cannot be after end date' 
      });
    }

    const updatedProject = await prisma.project.update({
      where: { id: id },
      data: {
        name: name !== undefined ? name : existingProject.name,
        description: description !== undefined ? description : existingProject.description,
        clientId: clientId !== undefined ? clientId : existingProject.clientId,
        status: status !== undefined ? status : existingProject.status,
        startDate: startDate !== undefined ? (startDate ? new Date(startDate) : null) : existingProject.startDate,
        endDate: endDate !== undefined ? (endDate ? new Date(endDate) : null) : existingProject.endDate,
        budget: budget !== undefined ? (budget ? parseFloat(budget) : null) : existingProject.budget,
        notes: notes !== undefined ? notes : existingProject.notes
      },
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    res.json({
      success: true,
      data: updatedProject
    });
  } catch (error) {
    console.error('Error updating project:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to update project',
      details: error.message 
    });
  }
});

// Delete a project
router.delete('/:id', async (req, res) => {
  try {
    const { organizationId } = req.multiTenant;
    const { id } = req.params;

    // Check if project exists and belongs to organization
    const existingProject = await prisma.project.findFirst({
      where: {
        id: id,
        organizationId: organizationId
      }
    });

    if (!existingProject) {
      return res.status(404).json({ 
        success: false,
        error: 'Project not found' 
      });
    }

    // Check if project has any tasks
    const taskCount = await prisma.task.count({
      where: {
        projectId: id,
        organizationId: organizationId
      }
    });

    if (taskCount > 0) {
      return res.status(409).json({ 
        success: false,
        error: 'Cannot delete project with existing tasks',
        details: `This project has ${taskCount} task(s). Please delete or reassign all tasks before deleting the project.`
      });
    }

    await prisma.project.delete({
      where: { id: id }
    });

    res.json({
      success: true,
      message: 'Project deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to delete project',
      details: error.message 
    });
  }
});

// Get project statistics
router.get('/:id/stats', async (req, res) => {
  try {
    const { organizationId } = req.multiTenant;
    const { id } = req.params;

    // Check if project exists and belongs to organization
    const project = await prisma.project.findFirst({
      where: {
        id: id,
        organizationId: organizationId
      }
    });

    if (!project) {
      return res.status(404).json({ 
        success: false,
        error: 'Project not found' 
      });
    }

    // Get task statistics
    const taskStats = await prisma.task.groupBy({
      by: ['status'],
      where: {
        projectId: id,
        organizationId: organizationId
      },
      _count: {
        status: true
      }
    });

    // Calculate project progress
    const totalTasks = taskStats.reduce((sum, stat) => sum + stat._count.status, 0);
    const completedTasks = taskStats.find(stat => stat.status === 'completed')?._count.status || 0;
    const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    res.json({
      success: true,
      data: {
        taskStats,
        totalTasks,
        completedTasks,
        progress
      }
    });
  } catch (error) {
    console.error('Error fetching project stats:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch project statistics',
      details: error.message 
    });
  }
});

export default router; 