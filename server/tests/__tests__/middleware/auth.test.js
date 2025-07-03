import jwt from 'jsonwebtoken';
import { jest } from '@jest/globals';
import { authenticateToken } from '../../../src/middleware/auth.js';
import { testJWTPayloads } from '../../fixtures/organizations.js';

// Mock jsonwebtoken
jest.mock('jsonwebtoken');

describe('Authentication Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = mockRequest();
    res = mockResponse();
    next = mockNext();

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('Token Validation', () => {
    test('should successfully authenticate valid JWT token', async () => {
      // Arrange
      const validToken = 'valid.jwt.token';
      req.headers.authorization = `Bearer ${validToken}`;
      
      // Mock JWT verification to return valid payload
      jwt.verify.mockReturnValue(testJWTPayloads.org1Admin);

      // Act
      await authenticateToken(req, res, next);

      // Assert
      expect(jwt.verify).toHaveBeenCalledWith(validToken, process.env.JWT_SECRET);
      expect(req.user).toEqual({
        id: testJWTPayloads.org1Admin.sub,
        email: testJWTPayloads.org1Admin.email,
        name: testJWTPayloads.org1Admin.name,
        role: testJWTPayloads.org1Admin.role,
        organizationId: testJWTPayloads.org1Admin.organizationId
      });
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    test('should reject requests without authorization header', async () => {
      // Arrange - no authorization header

      // Act
      await authenticateToken(req, res, next);

      // Assert
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Access denied. No token provided.'
      });
    });

    test('should reject requests with malformed authorization header', async () => {
      // Arrange
      req.headers.authorization = 'InvalidFormat token';

      // Act
      await authenticateToken(req, res, next);

      // Assert
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Access denied. Invalid token format.'
      });
    });

    test('should reject invalid JWT tokens', async () => {
      // Arrange
      const invalidToken = 'invalid.jwt.token';
      req.headers.authorization = `Bearer ${invalidToken}`;
      
      // Mock JWT verification to throw error
      jwt.verify.mockImplementation(() => {
        const error = new Error('invalid token');
        error.name = 'JsonWebTokenError';
        throw error;
      });

      // Act
      await authenticateToken(req, res, next);

      // Assert
      expect(jwt.verify).toHaveBeenCalledWith(invalidToken, process.env.JWT_SECRET);
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Invalid token.'
      });
    });

    test('should reject expired JWT tokens', async () => {
      // Arrange
      const expiredToken = 'expired.jwt.token';
      req.headers.authorization = `Bearer ${expiredToken}`;
      
      // Mock JWT verification to throw expired error
      jwt.verify.mockImplementation(() => {
        const error = new Error('jwt expired');
        error.name = 'TokenExpiredError';
        throw error;
      });

      // Act
      await authenticateToken(req, res, next);

      // Assert
      expect(jwt.verify).toHaveBeenCalledWith(expiredToken, process.env.JWT_SECRET);
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Token expired.'
      });
    });

    test('should handle missing JWT_SECRET environment variable', async () => {
      // Arrange
      const originalSecret = process.env.JWT_SECRET;
      delete process.env.JWT_SECRET;
      
      const validToken = 'valid.jwt.token';
      req.headers.authorization = `Bearer ${validToken}`;

      // Act
      await authenticateToken(req, res, next);

      // Assert
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Internal server error.'
      });

      // Cleanup
      process.env.JWT_SECRET = originalSecret;
    });
  });

  describe('Token Extraction', () => {
    test('should extract token from Bearer authorization header', async () => {
      // Arrange
      const token = 'valid.jwt.token';
      req.headers.authorization = `Bearer ${token}`;
      
      jwt.verify.mockReturnValue(testJWTPayloads.org1Admin);

      // Act
      await authenticateToken(req, res, next);

      // Assert
      expect(jwt.verify).toHaveBeenCalledWith(token, process.env.JWT_SECRET);
    });

    test('should handle authorization header with extra spaces', async () => {
      // Arrange
      const token = 'valid.jwt.token';
      req.headers.authorization = `Bearer   ${token}   `;
      
      jwt.verify.mockReturnValue(testJWTPayloads.org1Admin);

      // Act
      await authenticateToken(req, res, next);

      // Assert
      expect(jwt.verify).toHaveBeenCalledWith(token.trim(), process.env.JWT_SECRET);
    });

    test('should reject authorization header without Bearer scheme', async () => {
      // Arrange
      req.headers.authorization = 'Token some.jwt.token';

      // Act
      await authenticateToken(req, res, next);

      // Assert
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Access denied. Invalid token format.'
      });
    });
  });

  describe('User Context Setup', () => {
    test('should properly set user context from token payload', async () => {
      // Arrange
      const validToken = 'valid.jwt.token';
      req.headers.authorization = `Bearer ${validToken}`;
      
      const payload = testJWTPayloads.org1Admin;
      jwt.verify.mockReturnValue(payload);

      // Act
      await authenticateToken(req, res, next);

      // Assert
      expect(req.user).toEqual({
        id: payload.sub,
        email: payload.email,
        name: payload.name,
        role: payload.role,
        organizationId: payload.organizationId
      });
    });

    test('should handle tokens with minimal required fields', async () => {
      // Arrange
      const validToken = 'valid.jwt.token';
      req.headers.authorization = `Bearer ${validToken}`;
      
      const minimalPayload = {
        sub: 'user-123',
        email: 'user@example.com'
        // Missing optional fields like name, role, organizationId
      };
      jwt.verify.mockReturnValue(minimalPayload);

      // Act
      await authenticateToken(req, res, next);

      // Assert
      expect(req.user).toEqual({
        id: minimalPayload.sub,
        email: minimalPayload.email,
        name: undefined,
        role: undefined,
        organizationId: undefined
      });
      expect(next).toHaveBeenCalled();
    });

    test('should handle tokens with additional custom fields', async () => {
      // Arrange
      const validToken = 'valid.jwt.token';
      req.headers.authorization = `Bearer ${validToken}`;
      
      const extendedPayload = {
        ...testJWTPayloads.org1Admin,
        customField: 'customValue',
        permissions: ['read', 'write']
      };
      jwt.verify.mockReturnValue(extendedPayload);

      // Act
      await authenticateToken(req, res, next);

      // Assert
      expect(req.user).toEqual({
        id: extendedPayload.sub,
        email: extendedPayload.email,
        name: extendedPayload.name,
        role: extendedPayload.role,
        organizationId: extendedPayload.organizationId
        // Custom fields should not be included in req.user
      });
    });
  });

  describe('Error Handling', () => {
    test('should handle unexpected JWT verification errors', async () => {
      // Arrange
      const validToken = 'valid.jwt.token';
      req.headers.authorization = `Bearer ${validToken}`;
      
      // Mock JWT verification to throw unexpected error
      jwt.verify.mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      // Act
      await authenticateToken(req, res, next);

      // Assert
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Invalid token.'
      });
    });

    test('should handle missing token subject (sub)', async () => {
      // Arrange
      const validToken = 'valid.jwt.token';
      req.headers.authorization = `Bearer ${validToken}`;
      
      const payloadWithoutSub = {
        email: 'user@example.com',
        name: 'Test User'
        // Missing required 'sub' field
      };
      jwt.verify.mockReturnValue(payloadWithoutSub);

      // Act
      await authenticateToken(req, res, next);

      // Assert
      expect(req.user.id).toBeUndefined();
      expect(req.user.email).toBe(payloadWithoutSub.email);
      expect(next).toHaveBeenCalled(); // Should still proceed, just with undefined id
    });
  });

  describe('Security Considerations', () => {
    test('should not leak sensitive information in error responses', async () => {
      // Arrange
      const maliciousToken = 'malicious.jwt.token';
      req.headers.authorization = `Bearer ${maliciousToken}`;
      
      jwt.verify.mockImplementation(() => {
        const error = new Error('Very detailed error message with sensitive info');
        error.name = 'JsonWebTokenError';
        throw error;
      });

      // Act
      await authenticateToken(req, res, next);

      // Assert
      expect(res.json).toHaveBeenCalledWith({
        error: 'Invalid token.'
      });
      // Should not include the detailed error message
    });

    test('should handle very long tokens gracefully', async () => {
      // Arrange
      const longToken = 'a'.repeat(10000); // Very long token
      req.headers.authorization = `Bearer ${longToken}`;
      
      jwt.verify.mockImplementation(() => {
        const error = new Error('Token too long');
        error.name = 'JsonWebTokenError';
        throw error;
      });

      // Act
      await authenticateToken(req, res, next);

      // Assert
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Invalid token.'
      });
    });
  });
}); 