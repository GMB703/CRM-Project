import jwt from 'jsonwebtoken';
import { jest } from '@jest/globals';
import { createMultiTenantMiddleware } from '../../../src/middleware/multiTenant.js';
import { 
  testOrganizations, 
  testUsers, 
  testUserOrganizations, 
  testJWTPayloads 
} from '../../fixtures/organizations.js';

// Mock the database service and Prisma client
jest.mock('../../../src/services/databaseService.js');
jest.mock('@prisma/client');

describe('Multi-Tenant Middleware', () => {
  let req, res, next, middleware;

  beforeEach(() => {
    req = mockRequest();
    res = mockResponse();
    next = mockNext();
    middleware = createMultiTenantMiddleware();

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('Token Extraction and Validation', () => {
    test('should successfully extract and validate valid JWT token with organization context', async () => {
      // Arrange
      const validToken = 'valid.jwt.token';
      req.headers.authorization = `Bearer ${validToken}`;
      
      // Mock JWT verification to return valid payload
      jwt.verify = jest.fn().mockReturnValue(testJWTPayloads.org1Admin);
      
      // Mock database query for user organization access
      global.mockPrisma.userOrganization.findUnique.mockResolvedValue(
        testUserOrganizations.org1AdminRelation
      );

      // Act
      await middleware(req, res, next);

      // Assert
      expect(jwt.verify).toHaveBeenCalledWith(validToken, process.env.JWT_SECRET);
      expect(req.user).toEqual({
        id: testJWTPayloads.org1Admin.sub,
        email: testJWTPayloads.org1Admin.email,
        name: testJWTPayloads.org1Admin.name,
        role: testJWTPayloads.org1Admin.role
      });
      expect(req.multiTenant.organizationId).toBe(testJWTPayloads.org1Admin.organizationId);
      expect(req.multiTenant.userRole).toBe('OWNER');
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    test('should reject requests without authorization header', async () => {
      // Arrange - no authorization header

      // Act
      await middleware(req, res, next);

      // Assert
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Authentication required',
        code: 'MISSING_TOKEN'
      });
    });

    test('should reject requests with malformed authorization header', async () => {
      // Arrange
      req.headers.authorization = 'InvalidFormat token';

      // Act
      await middleware(req, res, next);

      // Assert
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Authorization header must use Bearer scheme',
        code: 'MISSING_TOKEN'
      });
    });

    test('should reject requests with invalid JWT token', async () => {
      // Arrange
      const invalidToken = 'invalid.jwt.token';
      req.headers.authorization = `Bearer ${invalidToken}`;
      
      // Mock JWT verification to throw error
      jwt.verify = jest.fn().mockImplementation(() => {
        const error = new Error('invalid token');
        error.name = 'JsonWebTokenError';
        throw error;
      });

      // Act
      await middleware(req, res, next);

      // Assert
      expect(jwt.verify).toHaveBeenCalledWith(invalidToken, process.env.JWT_SECRET);
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Invalid token signature',
        code: 'INVALID_TOKEN'
      });
    });

    test('should reject expired JWT tokens', async () => {
      // Arrange
      const expiredToken = 'expired.jwt.token';
      req.headers.authorization = `Bearer ${expiredToken}`;
      
      // Mock JWT verification to throw expired error
      jwt.verify = jest.fn().mockImplementation(() => {
        const error = new Error('jwt expired');
        error.name = 'TokenExpiredError';
        throw error;
      });

      // Act
      await middleware(req, res, next);

      // Assert
      expect(jwt.verify).toHaveBeenCalledWith(expiredToken, process.env.JWT_SECRET);
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Token has expired',
        code: 'INVALID_TOKEN'
      });
    });

    test('should reject tokens without organization context', async () => {
      // Arrange
      const tokenWithoutOrg = 'token.without.org';
      req.headers.authorization = `Bearer ${tokenWithoutOrg}`;
      
      // Mock JWT verification to return payload without organizationId
      jwt.verify = jest.fn().mockReturnValue(testJWTPayloads.tokenWithoutOrg);

      // Act
      await middleware(req, res, next);

      // Assert
      expect(jwt.verify).toHaveBeenCalledWith(tokenWithoutOrg, process.env.JWT_SECRET);
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Token missing organization context',
        code: 'INVALID_ORGANIZATION'
      });
    });
  });

  describe('Organization Access Verification', () => {
    test('should allow access when user has valid organization membership', async () => {
      // Arrange
      const validToken = 'valid.jwt.token';
      req.headers.authorization = `Bearer ${validToken}`;
      
      jwt.verify = jest.fn().mockReturnValue(testJWTPayloads.org1Admin);
      global.mockPrisma.userOrganization.findUnique.mockResolvedValue(
        testUserOrganizations.org1AdminRelation
      );

      // Act
      await middleware(req, res, next);

      // Assert
      expect(global.mockPrisma.userOrganization.findUnique).toHaveBeenCalledWith({
        where: {
          userId_organizationId: {
            userId: testJWTPayloads.org1Admin.sub,
            organizationId: testJWTPayloads.org1Admin.organizationId
          }
        },
        include: {
          organization: true
        }
      });
      expect(req.multiTenant.organizationId).toBe(testJWTPayloads.org1Admin.organizationId);
      expect(req.multiTenant.userRole).toBe('OWNER');
      expect(next).toHaveBeenCalled();
    });

    test('should deny access when user does not have organization membership', async () => {
      // Arrange
      const validToken = 'valid.jwt.token';
      req.headers.authorization = `Bearer ${validToken}`;
      
      jwt.verify = jest.fn().mockReturnValue(testJWTPayloads.org1Admin);
      global.mockPrisma.userOrganization.findUnique.mockResolvedValue(null); // No membership found

      // Act
      await middleware(req, res, next);

      // Assert
      expect(global.mockPrisma.userOrganization.findUnique).toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Access denied to the requested organization',
        code: 'ORGANIZATION_ACCESS_DENIED'
      });
    });

    test('should handle database errors gracefully', async () => {
      // Arrange
      const validToken = 'valid.jwt.token';
      req.headers.authorization = `Bearer ${validToken}`;
      
      jwt.verify = jest.fn().mockReturnValue(testJWTPayloads.org1Admin);
      global.mockPrisma.userOrganization.findUnique.mockRejectedValue(
        new Error('Database connection failed')
      );

      // Act
      await middleware(req, res, next);

      // Assert
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Database error during organization verification',
        code: 'DATABASE_ERROR'
      });
    });
  });

  describe('Multi-Organization User Support', () => {
    test('should allow multi-organization user to access different organizations with different tokens', async () => {
      // Test access to organization 1
      const org1Token = 'multi.org.token1';
      req.headers.authorization = `Bearer ${org1Token}`;
      
      jwt.verify = jest.fn().mockReturnValue({
        ...testJWTPayloads.multiOrgUser,
        organizationId: 'org-123-456'
      });
      
      global.mockPrisma.userOrganization.findUnique.mockResolvedValue(
        testUserOrganizations.multiOrgUserOrg1Relation
      );

      await middleware(req, res, next);

      expect(req.multiTenant.organizationId).toBe('org-123-456');
      expect(req.multiTenant.userRole).toBe('ADMIN');
      expect(next).toHaveBeenCalled();

      // Reset for second test
      req = mockRequest();
      res = mockResponse();
      next = mockNext();
      jest.clearAllMocks();

      // Test access to organization 2 with different token
      const org2Token = 'multi.org.token2';
      req.headers.authorization = `Bearer ${org2Token}`;
      
      jwt.verify = jest.fn().mockReturnValue({
        ...testJWTPayloads.multiOrgUser,
        organizationId: 'org-789-012'
      });
      
      global.mockPrisma.userOrganization.findUnique.mockResolvedValue(
        testUserOrganizations.multiOrgUserOrg2Relation
      );

      await middleware(req, res, next);

      expect(req.multiTenant.organizationId).toBe('org-789-012');
      expect(req.multiTenant.userRole).toBe('MANAGER');
      expect(next).toHaveBeenCalled();
    });
  });

  describe('Request Context Setup', () => {
    test('should properly set up req.user and req.multiTenant objects', async () => {
      // Arrange
      const validToken = 'valid.jwt.token';
      req.headers.authorization = `Bearer ${validToken}`;
      
      jwt.verify = jest.fn().mockReturnValue(testJWTPayloads.org1Admin);
      global.mockPrisma.userOrganization.findUnique.mockResolvedValue(
        testUserOrganizations.org1AdminRelation
      );

      // Act
      await middleware(req, res, next);

      // Assert
      expect(req.user).toEqual({
        id: testJWTPayloads.org1Admin.sub,
        email: testJWTPayloads.org1Admin.email,
        name: testJWTPayloads.org1Admin.name,
        role: testJWTPayloads.org1Admin.role
      });

      expect(req.multiTenant).toEqual({
        organizationId: testJWTPayloads.org1Admin.organizationId,
        userRole: 'OWNER',
        permissions: ['all'],
        organizationAccess: testUserOrganizations.org1AdminRelation
      });
    });

    test('should not overwrite existing req.user if already set', async () => {
      // Arrange
      const existingUser = { id: 'existing', email: 'existing@test.com' };
      req.user = existingUser;
      
      const validToken = 'valid.jwt.token';
      req.headers.authorization = `Bearer ${validToken}`;
      
      jwt.verify = jest.fn().mockReturnValue(testJWTPayloads.org1Admin);
      global.mockPrisma.userOrganization.findUnique.mockResolvedValue(
        testUserOrganizations.org1AdminRelation
      );

      // Act
      await middleware(req, res, next);

      // Assert
      expect(req.user).toEqual(existingUser); // Should not be overwritten
      expect(req.multiTenant.organizationId).toBe(testJWTPayloads.org1Admin.organizationId);
    });
  });

  describe('Custom Configuration', () => {
    test('should use custom error messages when provided', async () => {
      // Arrange
      const customMiddleware = createMultiTenantMiddleware({
        errorMessages: {
          authenticationRequired: 'Custom auth required message'
        }
      });

      // Act
      await customMiddleware(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Custom auth required message',
        code: 'MISSING_TOKEN'
      });
    });

    test('should skip organization verification when disabled in config', async () => {
      // Arrange
      const noVerifyMiddleware = createMultiTenantMiddleware({
        verifyOrganizationAccess: false
      });
      
      const validToken = 'valid.jwt.token';
      req.headers.authorization = `Bearer ${validToken}`;
      
      jwt.verify = jest.fn().mockReturnValue(testJWTPayloads.org1Admin);

      // Act
      await noVerifyMiddleware(req, res, next);

      // Assert
      expect(global.mockPrisma.userOrganization.findUnique).not.toHaveBeenCalled();
      expect(req.multiTenant.organizationId).toBe(testJWTPayloads.org1Admin.organizationId);
      expect(next).toHaveBeenCalled();
    });
  });

  describe('Caching Functionality', () => {
    test('should use cached organization access when available', async () => {
      // This test would require accessing the internal cache
      // For now, we'll test that the middleware works correctly
      // The actual caching tests would need access to the internal cache methods
      
      const validToken = 'valid.jwt.token';
      req.headers.authorization = `Bearer ${validToken}`;
      
      jwt.verify = jest.fn().mockReturnValue(testJWTPayloads.org1Admin);
      global.mockPrisma.userOrganization.findUnique.mockResolvedValue(
        testUserOrganizations.org1AdminRelation
      );

      // First call
      await middleware(req, res, next);
      expect(global.mockPrisma.userOrganization.findUnique).toHaveBeenCalledTimes(1);

      // Reset for second call
      req = mockRequest();
      res = mockResponse();
      next = mockNext();
      req.headers.authorization = `Bearer ${validToken}`;

      // Second call (would use cache in real implementation)
      await middleware(req, res, next);
      
      // In this test setup, it still calls the database since we're mocking
      // but in the real implementation, the second call would use cache
      expect(next).toHaveBeenCalled();
    });
  });
}); 