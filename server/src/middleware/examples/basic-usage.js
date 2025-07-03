/**
 * Basic Multi-Tenant Middleware Usage Example
 * 
 * This example demonstrates how to integrate the multi-tenant middleware
 * into an Express.js application with various configuration options.
 */

const express = require('express');
const { createMultiTenantMiddleware, clearOrganizationCache, getCacheStats } = require('../multiTenant');

const app = express();

// Middleware for parsing JSON
app.use(express.json());

// ===== BASIC CONFIGURATION =====

// Create multi-tenant middleware with default settings
const basicMultiTenant = createMultiTenantMiddleware();

// ===== ADVANCED CONFIGURATION =====

// Create multi-tenant middleware with custom configuration
const advancedMultiTenant = createMultiTenantMiddleware({
  // Enable database verification for maximum security
  verifyOrganizationAccess: true,
  
  // Cache for 5 minutes to improve performance
  cacheTTL: 300,
  
  // Allow super admin access
  allowSuperAdminAccess: true,
  
  // Custom error messages
  errorMessages: {
    authenticationRequired: 'Please provide a valid authentication token',
    invalidToken: 'Your session has expired. Please log in again.',
    organizationContextRequired: 'Organization context is required for this operation',
    organizationAccessDenied: 'You do not have access to this organization',
    userNotFound: 'User account not found',
    organizationNotActive: 'This organization account has been deactivated'
  },
  
  // Logging configuration
  logging: {
    enabled: true,
    logLevel: 'info',
    logSensitiveData: false // NEVER set to true in production
  }
});

// ===== PERFORMANCE-OPTIMIZED CONFIGURATION =====

// For high-traffic applications, you might want to disable database verification
// and rely on token-based validation only
const performanceMultiTenant = createMultiTenantMiddleware({
  verifyOrganizationAccess: false, // Skip database queries
  cacheTTL: 600, // 10-minute cache
  logging: {
    enabled: true,
    logLevel: 'error' // Only log errors in production
  }
});

// ===== ROUTE EXAMPLES =====

// Apply basic multi-tenant middleware to all API routes
app.use('/api/basic', basicMultiTenant);

// Apply advanced multi-tenant middleware to secure routes
app.use('/api/secure', advancedMultiTenant);

// Apply performance-optimized middleware to high-traffic routes
app.use('/api/fast', performanceMultiTenant);

// ===== BASIC ROUTES =====

// Basic dashboard route
app.get('/api/basic/dashboard', (req, res) => {
  const { userId, organizationId, organizationRole, organization } = req.multiTenant;
  
  res.json({
    message: `Welcome ${req.user.firstName} ${req.user.lastName}!`,
    user: {
      id: userId,
      email: req.user.email,
      role: organizationRole
    },
    organization: {
      id: organizationId,
      name: organization.name,
      code: organization.code,
      isActive: organization.isActive
    },
    context: {
      accessType: req.multiTenant.accessType,
      permissions: req.multiTenant.tokenContext?.permissions || []
    }
  });
});

// Organization-scoped data retrieval
app.get('/api/basic/projects', (req, res) => {
  const { organizationId } = req.multiTenant;
  
  // In a real application, you would query your database
  // and automatically filter by organizationId
  const projects = [
    { id: 1, name: 'Project Alpha', organizationId },
    { id: 2, name: 'Project Beta', organizationId }
  ];
  
  res.json({
    projects,
    organizationId,
    total: projects.length
  });
});

// ===== ROLE-BASED ACCESS CONTROL =====

// Helper function for role-based access control
function requireRole(requiredRole) {
  return (req, res, next) => {
    const { organizationRole } = req.multiTenant;
    
    // Define role hierarchy
    const roleHierarchy = ['GUEST', 'MEMBER', 'MANAGER', 'ADMIN', 'OWNER'];
    const userLevel = roleHierarchy.indexOf(organizationRole);
    const requiredLevel = roleHierarchy.indexOf(requiredRole);
    
    if (userLevel >= requiredLevel) {
      next();
    } else {
      res.status(403).json({
        success: false,
        message: `Access denied. Required role: ${requiredRole}, your role: ${organizationRole}`,
        code: 'INSUFFICIENT_ROLE'
      });
    }
  };
}

// Admin-only route
app.get('/api/secure/admin/users', requireRole('ADMIN'), (req, res) => {
  const { organizationId } = req.multiTenant;
  
  res.json({
    message: 'Admin access granted',
    organizationId,
    users: [
      { id: 1, name: 'John Doe', role: 'MEMBER' },
      { id: 2, name: 'Jane Smith', role: 'MANAGER' }
    ]
  });
});

// Manager-level route
app.post('/api/secure/projects', requireRole('MANAGER'), (req, res) => {
  const { organizationId, userId } = req.multiTenant;
  const { name, description } = req.body;
  
  // Create project scoped to organization
  const project = {
    id: Date.now(),
    name,
    description,
    organizationId,
    createdBy: userId,
    createdAt: new Date().toISOString()
  };
  
  res.status(201).json({
    success: true,
    project
  });
});

// ===== PERMISSION-BASED ACCESS CONTROL =====

// Helper function for permission-based access control
function requirePermission(permission) {
  return (req, res, next) => {
    const { permissions } = req.multiTenant.tokenContext || {};
    
    if (permissions && permissions.includes(permission)) {
      next();
    } else {
      res.status(403).json({
        success: false,
        message: `Access denied. Required permission: ${permission}`,
        code: 'MISSING_PERMISSION'
      });
    }
  };
}

// Permission-protected route
app.delete('/api/secure/users/:userId', requirePermission('org:manage_users'), (req, res) => {
  const { organizationId } = req.multiTenant;
  const { userId } = req.params;
  
  res.json({
    success: true,
    message: `User ${userId} deleted from organization ${organizationId}`
  });
});

// ===== CACHE MANAGEMENT ROUTES =====

// Get cache statistics
app.get('/api/admin/cache/stats', requireRole('ADMIN'), (req, res) => {
  const stats = getCacheStats();
  res.json({
    cache: stats,
    timestamp: new Date().toISOString()
  });
});

// Clear specific user cache
app.delete('/api/admin/cache/user/:userId', requireRole('ADMIN'), (req, res) => {
  const { userId } = req.params;
  clearOrganizationCache(userId);
  
  res.json({
    success: true,
    message: `Cache cleared for user ${userId}`
  });
});

// Clear all cache
app.delete('/api/admin/cache/all', requireRole('ADMIN'), (req, res) => {
  clearOrganizationCache();
  
  res.json({
    success: true,
    message: 'All cache cleared'
  });
});

// ===== ORGANIZATION SWITCHING =====

// Switch organization context
app.post('/api/auth/switch-organization', (req, res) => {
  const { organizationId } = req.body;
  const { userId } = req.multiTenant;
  
  if (!organizationId) {
    return res.status(400).json({
      success: false,
      message: 'Organization ID is required',
      code: 'MISSING_ORGANIZATION_ID'
    });
  }
  
  // In a real application, you would:
  // 1. Verify user has access to the new organization
  // 2. Generate a new JWT token with the new organization context
  // 3. Clear the user's cache
  
  // For this example, we'll simulate the response
  clearOrganizationCache(userId);
  
  res.json({
    success: true,
    message: 'Organization context switched',
    newOrganizationId: organizationId,
    // newToken: 'new-jwt-token-would-be-here'
  });
});

// ===== ERROR HANDLING =====

// Global error handler for multi-tenant errors
app.use((err, req, res, next) => {
  // Handle multi-tenant specific errors
  if (err.name && err.name.includes('MultiTenant')) {
    return res.status(err.statusCode || 500).json({
      success: false,
      message: err.message,
      code: err.code,
      timestamp: new Date().toISOString(),
      path: req.path
    });
  }
  
  // Handle other errors
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    code: 'INTERNAL_ERROR'
  });
});

// ===== HEALTH CHECK ROUTES =====

// Basic health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    cache: getCacheStats()
  });
});

// Multi-tenant specific health check
app.get('/api/health', basicMultiTenant, (req, res) => {
  const { organizationId, userId } = req.multiTenant;
  
  res.json({
    status: 'healthy',
    authenticated: true,
    userId,
    organizationId,
    timestamp: new Date().toISOString()
  });
});

// ===== START SERVER =====

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Multi-tenant server running on port ${PORT}`);
  console.log(`📊 Cache stats: ${JSON.stringify(getCacheStats())}`);
  console.log('');
  console.log('Available endpoints:');
  console.log('  GET  /health                           - Basic health check');
  console.log('  GET  /api/health                       - Authenticated health check');
  console.log('  GET  /api/basic/dashboard              - User dashboard');
  console.log('  GET  /api/basic/projects               - Organization projects');
  console.log('  GET  /api/secure/admin/users           - Admin users list (ADMIN+)');
  console.log('  POST /api/secure/projects              - Create project (MANAGER+)');
  console.log('  DELETE /api/secure/users/:userId       - Delete user (requires permission)');
  console.log('  GET  /api/admin/cache/stats            - Cache statistics (ADMIN+)');
  console.log('  DELETE /api/admin/cache/user/:userId   - Clear user cache (ADMIN+)');
  console.log('  DELETE /api/admin/cache/all            - Clear all cache (ADMIN+)');
  console.log('  POST /api/auth/switch-organization     - Switch organization context');
});

module.exports = app; 