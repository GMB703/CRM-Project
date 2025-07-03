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

// Get all clients for the current organization
router.get('/', async (req, res) => {
  try {
    const { organizationId } = req.multiTenant;

    const clients = await prisma.client.findMany({
      where: {
        organizationId: organizationId
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({
      success: true,
      data: clients
    });
  } catch (error) {
    console.error('Error fetching clients:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch clients',
      details: error.message 
    });
  }
});

// Get a specific client by ID
router.get('/:id', async (req, res) => {
  try {
    const { organizationId } = req.multiTenant;
    const { id } = req.params;

    const client = await prisma.client.findFirst({
      where: {
        id: id,
        organizationId: organizationId
      }
    });

    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }

    res.json(client);
  } catch (error) {
    console.error('Error fetching client:', error);
    res.status(500).json({ 
      error: 'Failed to fetch client',
      details: error.message 
    });
  }
});

// Create a new client
router.post('/', async (req, res) => {
  try {
    const { organizationId } = req.multiTenant;
    const { firstName, lastName, email, phone, address } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !email) {
      return res.status(400).json({ 
        error: 'Missing required fields: firstName, lastName, email' 
      });
    }

    // Check if client with same email already exists in organization
    const existingClient = await prisma.client.findFirst({
      where: {
        email: email,
        organizationId: organizationId
      }
    });

    if (existingClient) {
      return res.status(409).json({ 
        error: 'Client with this email already exists' 
      });
    }

    const client = await prisma.client.create({
      data: {
        firstName,
        lastName,
        email,
        phone: phone || null,
        address: address || null,
        organizationId: organizationId
      }
    });

    res.status(201).json({
      success: true,
      data: client
    });
  } catch (error) {
    console.error('Error creating client:', error);
    res.status(500).json({ 
      error: 'Failed to create client',
      details: error.message 
    });
  }
});

// Update a client
router.put('/:id', async (req, res) => {
  try {
    const { organizationId } = req.multiTenant;
    const { id } = req.params;
    const { firstName, lastName, email, phone, address } = req.body;

    // Check if client exists and belongs to organization
    const existingClient = await prisma.client.findFirst({
      where: {
        id: id,
        organizationId: organizationId
      }
    });

    if (!existingClient) {
      return res.status(404).json({ error: 'Client not found' });
    }

    // Check if email is being changed and if it conflicts with another client
    if (email && email !== existingClient.email) {
      const emailConflict = await prisma.client.findFirst({
        where: {
          email: email,
          organizationId: organizationId,
          NOT: {
            id: id
          }
        }
      });

      if (emailConflict) {
        return res.status(409).json({ 
          error: 'Another client with this email already exists' 
        });
      }
    }

    const updatedClient = await prisma.client.update({
      where: { id: id },
      data: {
        firstName: firstName || existingClient.firstName,
        lastName: lastName || existingClient.lastName,
        email: email || existingClient.email,
        phone: phone !== undefined ? phone : existingClient.phone,
        address: address !== undefined ? address : existingClient.address
      }
    });

    res.json(updatedClient);
  } catch (error) {
    console.error('Error updating client:', error);
    res.status(500).json({ 
      error: 'Failed to update client',
      details: error.message 
    });
  }
});

// Delete a client
router.delete('/:id', async (req, res) => {
  try {
    const { organizationId } = req.multiTenant;
    const { id } = req.params;

    // Check if client exists and belongs to organization
    const existingClient = await prisma.client.findFirst({
      where: {
        id: id,
        organizationId: organizationId
      }
    });

    if (!existingClient) {
      return res.status(404).json({ error: 'Client not found' });
    }

    // Check if client has any projects
    const projectCount = await prisma.project.count({
      where: {
        clientId: id,
        organizationId: organizationId
      }
    });

    if (projectCount > 0) {
      return res.status(409).json({ 
        error: 'Cannot delete client with existing projects',
        projectCount: projectCount
      });
    }

    await prisma.client.delete({
      where: { id: id }
    });

    res.json({ message: 'Client deleted successfully' });
  } catch (error) {
    console.error('Error deleting client:', error);
    res.status(500).json({ 
      error: 'Failed to delete client',
      details: error.message 
    });
  }
});

export default router; 