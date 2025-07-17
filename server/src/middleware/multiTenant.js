import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { createOrgContext } from '../services/databaseService.js';

const prisma = new PrismaClient();

/**
 * Multi-Tenant Middleware Configuration
 * Allows customization of middleware behavior
 */
const defaultConfig = {
  // Whether to verify organization access in database (adds security but impacts performance)
  verifyOrganizationAccess: true,
  
  // Cache TTL in seconds (0 disables caching)
  cacheTTL: 300, // 5 minutes
  
  // Whether to allow super admin access to multiple organizations
  allowSuperAdminAccess: true,
  
  // Custom error messages
  errorMessages: {
    authenticationRequired: 'Authentication required',
    invalidToken: 'Invalid or expired token',
    organizationContextRequired: 'Organization context required in token',
    organizationAccessDenied: 'Access denied to the requested organization',
    userNotFound: 'User not found',
    organizationNotActive: 'Organization is not active'
  },
  
  // Logging configuration
  logging: {
    enabled: true,
    logLevel: 'info', // 'debug', 'info', 'warn', 'error'
    logSensitiveData: false
  }
};

/**
 * In-memory cache for user-organization associations
 * In production, this should be replaced with Redis or similar
 */
const organizationAccessCache = new Map();

/**
 * Custom error classes for multi-tenant middleware
 */
class MultiTenantError extends Error {
  constructor(message, statusCode = 500, code = 'MULTI_TENANT_ERROR') {
    super(message);
    this.name = 'MultiTenantError';
    this.statusCode = statusCode;
    this.code = code;
  }
}

class MissingTokenError extends MultiTenantError {
  constructor(message = 'Authentication token is required') {
    super(message, 401, 'MISSING_TOKEN');
  }
}

class InvalidTokenError extends MultiTenantError {
  constructor(message = 'Invalid or expired token') {
    super(message, 401, 'INVALID_TOKEN');
  }
}

class InvalidOrganizationError extends MultiTenantError {
  constructor(message = 'Invalid organization context') {
    super(message, 403, 'INVALID_ORGANIZATION');
  }
}

class OrganizationAccessDeniedError extends MultiTenantError {
  constructor(message = 'Access denied to the requested organization') {
    super(message, 403, 'ORGANIZATION_ACCESS_DENIED');
  }
}

/**
 * Logging utility
 */
function log(level, message, data = {}, config = defaultConfig) {
  if (!config.logging.enabled) return;
  
  const logLevels = { debug: 0, info: 1, warn: 2, error: 3 };
  const currentLevel = logLevels[config.logging.logLevel] || 1;
  const messageLevel = logLevels[level] || 1;
  
  if (messageLevel >= currentLevel) {
    const logData = config.logging.logSensitiveData ? data : 
      Object.keys(data).reduce((acc, key) => {
        if (!['token', 'password', 'secret'].some(sensitive => key.toLowerCase().includes(sensitive))) {
          acc[key] = data[key];
        }
        return acc;
      }, {});
    
    console.log(`[MultiTenant-${level.toUpperCase()}] ${message}`, logData);
  }
}

/**
 * Extract JWT token from request headers
 */
function extractToken(req) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return null;
  }
  
  if (!authHeader.startsWith('Bearer ')) {
    throw new MissingTokenError('Authorization header must use Bearer scheme');
  }
  
  return authHeader.split(' ')[1];
}

/**
 * Verify and decode JWT token
 */
function verifyToken(token, config = defaultConfig) {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Validate enhanced token structure
    if (!decoded.sub) {
      throw new InvalidTokenError('Token missing subject (sub) claim');
    }
    
    if (!decoded.organizationId && !decoded.tenant) {
      throw new InvalidOrganizationError('Token missing organization context');
    }
    
    // Check token version for security
    if (decoded.tokenVersion && decoded.tokenVersion !== 1) {
      throw new InvalidTokenError('Unsupported token version');
    }
    
    return decoded;
  } catch (error) {
    if (error instanceof MultiTenantError) {
      throw error;
    }
    
    if (error.name === 'JsonWebTokenError') {
      throw new InvalidTokenError('Invalid token signature');
    }
    
    if (error.name === 'TokenExpiredError') {
      throw new InvalidTokenError('Token has expired');
    }
    
    throw new InvalidTokenError(`Token verification failed: ${error.message}`);
  }
}

/**
 * Generate cache key for user-organization access
 */
function getCacheKey(userId, organizationId) {
  return `user:${userId}:org:${organizationId}`;
}

/**
 * Check cache for user-organization access
 */
function getCachedAccess(userId, organizationId, config = defaultConfig) {
  if (config.cacheTTL <= 0) return null;
  
  const cacheKey = getCacheKey(userId, organizationId);
  const cached = organizationAccessCache.get(cacheKey);
  
  if (cached && Date.now() < cached.expiry) {
    log('debug', 'Cache hit for organization access', { userId, organizationId }, config);
    return cached.data;
  }
  
  if (cached) {
    // Expired entry
    organizationAccessCache.delete(cacheKey);
    log('debug', 'Cache entry expired', { userId, organizationId }, config);
  }
  
  return null;
}

/**
 * Set cache for user-organization access
 */
function setCachedAccess(userId, organizationId, accessData, config = defaultConfig) {
  if (config.cacheTTL <= 0) return;
  
  const cacheKey = getCacheKey(userId, organizationId);
  const expiry = Date.now() + (config.cacheTTL * 1000);
  
  organizationAccessCache.set(cacheKey, {
    data: accessData,
    expiry
  });
  
  log('debug', 'Cache set for organization access', { userId, organizationId, expiry }, config);
}

/**
 * Verify user has access to organization
 */
async function verifyOrganizationAccess(userId, organizationId, userRole, config = defaultConfig) {
  // Super admin access (if enabled)
  if (config.allowSuperAdminAccess && userRole === 'SUPER_ADMIN') {
    log('debug', 'Super admin access granted', { userId, organizationId }, config);
    return {
      hasAccess: true,
      role: 'SUPER_ADMIN',
      organization: null, // Will be fetched separately if needed
      accessType: 'super_admin'
    };
  }
  
  // Check cache first
  const cachedAccess = getCachedAccess(userId, organizationId, config);
  if (cachedAccess) {
    return cachedAccess;
  }
  
  try {
    // Query user-organization relationship
    const userOrgAccess = await prisma.userOrganization.findUnique({
      where: {
        userId_organizationId: {
          userId,
          organizationId
        }
      },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            code: true,
            isActive: true
          }
        }
      }
    });
    
    if (!userOrgAccess) {
      // Check if user's primary organization matches
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          organizationId: true,
          organizationRole: true,
          organization: {
            select: {
              id: true,
              name: true,
              code: true,
              isActive: true
            }
          }
        }
      });
      
      if (user && user.organizationId === organizationId) {
        const accessData = {
          hasAccess: user.organization.isActive,
          role: user.organizationRole,
          organization: user.organization,
          accessType: 'primary'
        };
        
        setCachedAccess(userId, organizationId, accessData, config);
        return accessData;
      }
      
      const accessData = {
        hasAccess: false,
        role: null,
        organization: null,
        accessType: 'none'
      };
      
      setCachedAccess(userId, organizationId, accessData, config);
      return accessData;
    }
    
    const accessData = {
      hasAccess: userOrgAccess.isActive && userOrgAccess.organization.isActive,
      role: userOrgAccess.role,
      organization: userOrgAccess.organization,
      accessType: 'secondary'
    };
    
    setCachedAccess(userId, organizationId, accessData, config);
    return accessData;
    
  } catch (error) {
    log('error', 'Database error during organization access verification', { 
      userId, 
      organizationId, 
      error: error.message 
    }, config);
    
    throw new MultiTenantError('Failed to verify organization access');
  }
}

/**
 * Main multi-tenant middleware factory
 */
function createMultiTenantMiddleware(customConfig = {}) {
  const config = { ...defaultConfig, ...customConfig };
  
  return async function multiTenantMiddleware(req, res, next) {
    try {
      log('debug', 'Multi-tenant middleware processing request', { 
        path: req.path, 
        method: req.method 
      }, config);
      
      // Extract token from request
      const token = extractToken(req);
      if (!token) {
        throw new MissingTokenError(config.errorMessages.authenticationRequired);
      }
      
      // Verify and decode token
      const decoded = verifyToken(token, config);
      
      // Extract organization context
      const organizationId = decoded.organizationId || decoded.tenant;
      const userId = decoded.sub || decoded.id;
      const userRole = decoded.role;
      
      log('debug', 'Token decoded successfully', { 
        userId, 
        organizationId, 
        userRole,
        tokenVersion: decoded.tokenVersion 
      }, config);
      
      // Verify organization access if enabled
      let organizationAccess = null;
      if (config.verifyOrganizationAccess) {
        organizationAccess = await verifyOrganizationAccess(userId, organizationId, userRole, config);
        
        if (!organizationAccess.hasAccess) {
          throw new OrganizationAccessDeniedError(config.errorMessages.organizationAccessDenied);
        }
        
        if (!organizationAccess.organization?.isActive && organizationAccess.accessType !== 'super_admin') {
          throw new InvalidOrganizationError(config.errorMessages.organizationNotActive);
        }
      }
      
      // Create organization-scoped database context
      const dbContext = createOrgContext(organizationId, {
        enableLogging: config.logging.enabled && config.logging.logLevel === 'debug'
      });

      // Set request context
      req.multiTenant = {
        userId,
        organizationId,
        userRole,
        organizationRole: organizationAccess?.role || decoded.organizationRole,
        organization: organizationAccess?.organization,
        accessType: organizationAccess?.accessType || 'token_only',
        tokenContext: {
          permissions: decoded.permissions || [],
          sessionId: decoded.sessionId,
          tokenVersion: decoded.tokenVersion || 1,
          issuedAt: decoded.iat,
          expiresAt: decoded.exp
        },
        // Organization-scoped database context
        db: dbContext
      };
      
      // Maintain backward compatibility with existing middleware
      if (!req.user) {
        req.user = {
          id: userId,
          email: decoded.email,
          firstName: decoded.firstName,
          lastName: decoded.lastName,
          role: userRole,
          organizationRole: organizationAccess?.role || decoded.organizationRole,
          organizationId,
          isActive: decoded.isActive !== false
        };
      }
      
      if (!req.organizationContext) {
        req.organizationContext = {
          organizationId,
          organizationRole: organizationAccess?.role || decoded.organizationRole,
          organization: organizationAccess?.organization || {
            id: organizationId,
            name: decoded.organizationName,
            code: decoded.organizationCode
          },
          // Organization-scoped database context for backward compatibility
          db: dbContext
        };
      }

      // Add database context directly to request for easy access
      req.db = dbContext;
      
      log('info', 'Multi-tenant context established', { 
        userId, 
        organizationId, 
        accessType: organizationAccess?.accessType 
      }, config);
      
      next();
      
    } catch (error) {
      log('error', 'Multi-tenant middleware error', { 
        error: error.message, 
        code: error.code,
        path: req.path 
      }, config);
      
      if (error instanceof MultiTenantError) {
        return res.status(error.statusCode).json({
          success: false,
          message: error.message,
          code: error.code
        });
      }
      
      // Unexpected error
      return res.status(500).json({
        success: false,
        message: 'Internal server error in multi-tenant middleware',
        code: 'INTERNAL_ERROR'
      });
    }
  };
}

/**
 * Utility function to clear organization access cache
 */
function clearOrganizationCache(userId = null, organizationId = null) {
  if (userId && organizationId) {
    // Clear specific cache entry
    const cacheKey = getCacheKey(userId, organizationId);
    organizationAccessCache.delete(cacheKey);
  } else if (userId) {
    // Clear all cache entries for a user
    for (const key of organizationAccessCache.keys()) {
      if (key.startsWith(`user:${userId}:`)) {
        organizationAccessCache.delete(key);
      }
    }
  } else {
    // Clear all cache
    organizationAccessCache.clear();
  }
}

/**
 * Get cache statistics
 */
function getCacheStats() {
  return {
    size: organizationAccessCache.size,
    entries: Array.from(organizationAccessCache.keys())
  };
}

export {
  createMultiTenantMiddleware,
  clearOrganizationCache,
  getCacheStats,
  MultiTenantError,
  MissingTokenError,
  InvalidTokenError,
  InvalidOrganizationError,
  OrganizationAccessDeniedError
};

/* [STABLE COMPONENT - DO NOT MODIFY]
 * This multi-tenant middleware is complete and stable.
 * Core functionality:
 * - Organization context management
 * - Token validation and decoding
 * - Access verification
 * - Database context creation
 * 
 * This is a critical system component that ensures proper data isolation.
 * Changes here could affect the entire application's multi-tenant functionality.
 * Modify only if absolutely necessary and after thorough review.
 */ 