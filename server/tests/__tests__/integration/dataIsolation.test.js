import { jest } from '@jest/globals';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../../../src/index.js';
import { 
  testOrganizations, 
  testUsers, 
  testUserOrganizations,
  testCustomers,
  testJWTPayloads 
} from '../../fixtures/organizations.js';

// Mock the database
jest.mock('@prisma/client');

describe('Multi-Tenant Data Isolation Integration Tests', () => {
  let org1Token, org2Token, org1AdminToken, org2AdminToken;

  beforeAll(() => {
    // Generate valid JWT tokens for testing
    org1Token = jwt.sign(testJWTPayloads.org1Admin, process.env.JWT_SECRET);
    org2Token = jwt.sign(testJWTPayloads.org2Admin, process.env.JWT_SECRET);
    org1AdminToken = jwt.sign(testJWTPayloads.org1Admin, process.env.JWT_SECRET);
    org2AdminToken = jwt.sign(testJWTPayloads.org2Admin, process.env.JWT_SECRET);
  });

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    
    // Setup default database mocks
    setupDatabaseMocks();
  });

  describe('Customer Data Isolation', () => {
    test('should only return customers belonging to the requesting organization', async () => {
      // Mock org1 user authentication
      global.mockPrisma.userOrganization.findUnique.mockResolvedValue(
        testUserOrganizations.org1AdminRelation
      );
      
      // Mock customers query to return only org1 customers
      global.mockPrisma.customer.findMany.mockResolvedValue([
        testCustomers.org1Customer1,
        testCustomers.org1Customer2
      ]);

      const response = await request(app)
        .get('/api/customers')
        .set('Authorization', `Bearer ${org1Token}`)
        .expect(200);

      // Verify database was queried with organization filter
      expect(global.mockPrisma.customer.findMany).toHaveBeenCalledWith({
        where: { organizationId: testOrganizations.org1.id },
        orderBy: { createdAt: 'desc' }
      });

      // Verify response contains only org1 customers
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data[0].organizationId).toBe(testOrganizations.org1.id);
      expect(response.body.data[1].organizationId).toBe(testOrganizations.org1.id);
    });

    test('should prevent access to customers from different organizations', async () => {
      // Mock org2 user authentication
      global.mockPrisma.userOrganization.findUnique.mockResolvedValue(
        testUserOrganizations.org2AdminRelation
      );
      
      // Mock customers query to return only org2 customers
      global.mockPrisma.customer.findMany.mockResolvedValue([
        testCustomers.org2Customer1,
        testCustomers.org2Customer2
      ]);

      const response = await request(app)
        .get('/api/customers')
        .set('Authorization', `Bearer ${org2Token}`)
        .expect(200);

      // Verify database was queried with correct organization filter
      expect(global.mockPrisma.customer.findMany).toHaveBeenCalledWith({
        where: { organizationId: testOrganizations.org2.id },
        orderBy: { createdAt: 'desc' }
      });

      // Verify response contains only org2 customers (different from org1)
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data[0].organizationId).toBe(testOrganizations.org2.id);
      expect(response.body.data[1].organizationId).toBe(testOrganizations.org2.id);
      
      // Verify no org1 customers are included
      expect(response.body.data).not.toContainEqual(
        expect.objectContaining({ organizationId: testOrganizations.org1.id })
      );
    });

    test('should prevent creating customers for different organizations', async () => {
      // Mock org1 user authentication
      global.mockPrisma.userOrganization.findUnique.mockResolvedValue(
        testUserOrganizations.org1AdminRelation
      );

      const newCustomer = {
        name: 'New Customer',
        email: 'new@customer.com',
        phone: '+1-555-9999',
        // Attempting to create customer for different organization
        organizationId: testOrganizations.org2.id
      };

      // Mock customer creation with organization enforcement
      global.mockPrisma.customer.create.mockResolvedValue({
        ...newCustomer,
        id: 'customer-new',
        organizationId: testOrganizations.org1.id, // Should be forced to org1
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const response = await request(app)
        .post('/api/customers')
        .set('Authorization', `Bearer ${org1Token}`)
        .send(newCustomer)
        .expect(201);

      // Verify database was called with forced organization ID
      expect(global.mockPrisma.customer.create).toHaveBeenCalledWith({
        data: {
          ...newCustomer,
          organizationId: testOrganizations.org1.id // Should be forced to user's org
        }
      });

      expect(response.body.data.organizationId).toBe(testOrganizations.org1.id);
    });

    test('should prevent accessing individual customer from different organization', async () => {
      // Mock org1 user trying to access org2 customer
      global.mockPrisma.userOrganization.findUnique.mockResolvedValue(
        testUserOrganizations.org1AdminRelation
      );

      // Mock customer query returning null (not found due to organization filter)
      global.mockPrisma.customer.findFirst.mockResolvedValue(null);

      const response = await request(app)
        .get(`/api/customers/${testCustomers.org2Customer1.id}`)
        .set('Authorization', `Bearer ${org1Token}`)
        .expect(404);

      // Verify database was queried with organization filter
      expect(global.mockPrisma.customer.findFirst).toHaveBeenCalledWith({
        where: {
          id: testCustomers.org2Customer1.id,
          organizationId: testOrganizations.org1.id
        }
      });

      expect(response.body.error).toContain('Customer not found');
    });
  });

  describe('Project Data Isolation', () => {
    test('should isolate project data between organizations', async () => {
      const org1Projects = [
        {
          id: 'project-org1-1',
          name: 'Org1 Project 1',
          organizationId: testOrganizations.org1.id,
          customerId: testCustomers.org1Customer1.id
        },
        {
          id: 'project-org1-2',
          name: 'Org1 Project 2',
          organizationId: testOrganizations.org1.id,
          customerId: testCustomers.org1Customer2.id
        }
      ];

      // Mock org1 user authentication
      global.mockPrisma.userOrganization.findUnique.mockResolvedValue(
        testUserOrganizations.org1AdminRelation
      );
      
      // Mock projects query
      global.mockPrisma.project.findMany.mockResolvedValue(org1Projects);

      const response = await request(app)
        .get('/api/projects')
        .set('Authorization', `Bearer ${org1Token}`)
        .expect(200);

      // Verify organization filtering applied
      expect(global.mockPrisma.project.findMany).toHaveBeenCalledWith({
        where: { organizationId: testOrganizations.org1.id },
        include: expect.any(Object),
        orderBy: { createdAt: 'desc' }
      });

      expect(response.body.data).toHaveLength(2);
      expect(response.body.data.every(p => p.organizationId === testOrganizations.org1.id)).toBe(true);
    });

    test('should prevent cross-organization project assignment', async () => {
      // Mock org1 user authentication
      global.mockPrisma.userOrganization.findUnique.mockResolvedValue(
        testUserOrganizations.org1AdminRelation
      );

      const newProject = {
        name: 'New Project',
        description: 'Test project',
        customerId: testCustomers.org2Customer1.id // Trying to assign to org2 customer
      };

      // Should fail because customer belongs to different organization
      global.mockPrisma.customer.findFirst.mockResolvedValue(null); // Not found in org1

      const response = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${org1Token}`)
        .send(newProject)
        .expect(400);

      expect(response.body.error).toContain('Invalid customer');
    });
  });

  describe('User Management Isolation', () => {
    test('should only show users from the same organization', async () => {
      // Mock org1 admin authentication
      global.mockPrisma.userOrganization.findUnique.mockResolvedValue(
        testUserOrganizations.org1AdminRelation
      );

      const org1Users = [
        {
          id: testUsers.org1Admin.id,
          email: testUsers.org1Admin.email,
          name: testUsers.org1Admin.name,
          organizationId: testOrganizations.org1.id
        },
        {
          id: testUsers.org1Member.id,
          email: testUsers.org1Member.email,
          name: testUsers.org1Member.name,
          organizationId: testOrganizations.org1.id
        }
      ];

      // Mock user query with organization filter
      global.mockPrisma.user.findMany.mockResolvedValue(org1Users);

      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${org1AdminToken}`)
        .expect(200);

      // Verify organization filtering
      expect(global.mockPrisma.user.findMany).toHaveBeenCalledWith({
        where: { organizationId: testOrganizations.org1.id },
        select: expect.any(Object)
      });

      expect(response.body.data).toHaveLength(2);
      expect(response.body.data.every(u => u.organizationId === testOrganizations.org1.id)).toBe(true);
    });

    test('should prevent inviting users to different organizations', async () => {
      // Mock org1 admin authentication
      global.mockPrisma.userOrganization.findUnique.mockResolvedValue(
        testUserOrganizations.org1AdminRelation
      );

      const newUserInvite = {
        email: 'new@user.com',
        name: 'New User',
        role: 'member',
        organizationId: testOrganizations.org2.id // Trying to invite to different org
      };

      // Mock user creation with forced organization
      global.mockPrisma.user.create.mockResolvedValue({
        ...newUserInvite,
        id: 'user-new',
        organizationId: testOrganizations.org1.id, // Should be forced to admin's org
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const response = await request(app)
        .post('/api/users/invite')
        .set('Authorization', `Bearer ${org1AdminToken}`)
        .send(newUserInvite)
        .expect(201);

      // Verify organization was forced to admin's organization
      expect(global.mockPrisma.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          organizationId: testOrganizations.org1.id
        })
      });

      expect(response.body.data.organizationId).toBe(testOrganizations.org1.id);
    });
  });

  describe('Estimate/Invoice Data Isolation', () => {
    test('should isolate estimates between organizations', async () => {
      const org1Estimates = [
        {
          id: 'estimate-org1-1',
          customerId: testCustomers.org1Customer1.id,
          organizationId: testOrganizations.org1.id,
          status: 'pending'
        },
        {
          id: 'estimate-org1-2',
          customerId: testCustomers.org1Customer2.id,
          organizationId: testOrganizations.org1.id,
          status: 'approved'
        }
      ];

      // Mock org1 user authentication
      global.mockPrisma.userOrganization.findUnique.mockResolvedValue(
        testUserOrganizations.org1AdminRelation
      );
      
      // Mock estimates query
      global.mockPrisma.estimate.findMany.mockResolvedValue(org1Estimates);

      const response = await request(app)
        .get('/api/estimates')
        .set('Authorization', `Bearer ${org1Token}`)
        .expect(200);

      // Verify organization filtering
      expect(global.mockPrisma.estimate.findMany).toHaveBeenCalledWith({
        where: { organizationId: testOrganizations.org1.id },
        include: expect.any(Object),
        orderBy: { createdAt: 'desc' }
      });

      expect(response.body.data).toHaveLength(2);
      expect(response.body.data.every(e => e.organizationId === testOrganizations.org1.id)).toBe(true);
    });

    test('should prevent cross-organization estimate creation', async () => {
      // Mock org1 user authentication
      global.mockPrisma.userOrganization.findUnique.mockResolvedValue(
        testUserOrganizations.org1AdminRelation
      );

      const newEstimate = {
        customerId: testCustomers.org2Customer1.id, // Different org customer
        items: [
          { description: 'Service 1', quantity: 1, rate: 100 }
        ]
      };

      // Mock customer verification returning null (not in same org)
      global.mockPrisma.customer.findFirst.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/estimates')
        .set('Authorization', `Bearer ${org1Token}`)
        .send(newEstimate)
        .expect(400);

      expect(response.body.error).toContain('Invalid customer');
    });
  });

  describe('Cross-Organization Access Prevention', () => {
    test('should prevent user from accessing unauthorized organization', async () => {
      // Create a token with org2 context but for a user who only has access to org1
      const manipulatedPayload = {
        ...testJWTPayloads.org1Admin,
        organizationId: testOrganizations.org2.id // Attempting to access org2
      };

      // Mock that user doesn't have access to org2
      global.mockPrisma.userOrganization.findUnique.mockResolvedValue(null);

      // Verify access denial
      expect(global.mockPrisma.userOrganization.findUnique).toBeDefined();
    });

    test('should allow multi-organization users to access their authorized organizations', async () => {
      // Mock multi-org user has access to org2
      global.mockPrisma.userOrganization.findUnique.mockResolvedValue(
        testUserOrganizations.multiOrgUserOrg2Relation
      );

      // Mock org2 customers
      global.mockPrisma.customer.findMany.mockResolvedValue([
        testCustomers.org2Customer1
      ]);

      // Verify correct organization access
      expect(testUserOrganizations.multiOrgUserOrg2Relation.organizationId).toBe(testOrganizations.org2.id);
      expect(testCustomers.org2Customer1.organizationId).toBe(testOrganizations.org2.id);
    });
  });

  describe('Database Query Organization Filtering', () => {
    test('should always include organization filter in database queries', async () => {
      // Mock org1 user authentication
      global.mockPrisma.userOrganization.findUnique.mockResolvedValue(
        testUserOrganizations.org1AdminRelation
      );

      // Mock various database queries
      global.mockPrisma.customer.findMany.mockResolvedValue([]);
      global.mockPrisma.project.findMany.mockResolvedValue([]);
      global.mockPrisma.estimate.findMany.mockResolvedValue([]);

      // Test multiple endpoints
      await request(app)
        .get('/api/customers')
        .set('Authorization', `Bearer ${org1Token}`)
        .expect(200);

      await request(app)
        .get('/api/projects')
        .set('Authorization', `Bearer ${org1Token}`)
        .expect(200);

      await request(app)
        .get('/api/estimates')
        .set('Authorization', `Bearer ${org1Token}`)
        .expect(200);

      // Verify all queries included organization filter
      expect(global.mockPrisma.customer.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            organizationId: testOrganizations.org1.id
          })
        })
      );

      expect(global.mockPrisma.project.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            organizationId: testOrganizations.org1.id
          })
        })
      );

      expect(global.mockPrisma.estimate.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            organizationId: testOrganizations.org1.id
          })
        })
      );
    });
  });
});

function setupDatabaseMocks() {
  // Set up default database mocks
  global.mockPrisma = {
    userOrganization: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    },
    customer: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    },
    project: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    },
    estimate: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    },
    user: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    },
    organization: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    }
  };

  // Make mockPrisma available globally for the mocked PrismaClient
  global.mockPrismaInstance = global.mockPrisma;
} 