# Multi-Tenant Middleware for Express.js

A comprehensive, production-ready middleware for implementing multi-tenant authentication and organization context enforcement in Express.js applications.

## Features

- 🔐 **JWT Token Validation**: Secure token verification with enhanced claims validation
- 🏢 **Organization Context Enforcement**: Automatic organization access validation
- ⚡ **High Performance Caching**: In-memory caching with configurable TTL
- 🛡️ **Comprehensive Error Handling**: Custom error classes with detailed error codes
- 📝 **Advanced Logging**: Configurable logging with sensitive data protection
- 🔧 **Flexible Configuration**: Extensive customization options
- 🔄 **Backward Compatibility**: Seamless integration with existing auth systems

## Quick Start

### Basic Usage

```javascript
const express = require('express');
const { createMultiTenantMiddleware } = require('./middleware/multiTenant');

const app = express();

// Create middleware with default configuration
const multiTenantAuth = createMultiTenantMiddleware();

// Apply to all API routes
app.use('/api', multiTenantAuth);

// Your protected routes
app.get('/api/dashboard', (req, res) => {
  // Access user and organization context
  const { userId, organizationId, organizationRole } = req.multiTenant;
  const { organization } = req.multiTenant;
  
  res.json({
    message: `Welcome ${req.user.firstName}!`,
    organization: organization.name,
    role: organizationRole,
    permissions: req.multiTenant.tokenContext.permissions
  });
});
```

### Advanced Configuration

```javascript
const multiTenantAuth = createMultiTenantMiddleware({
  // Database verification (adds security but impacts performance)
  verifyOrganizationAccess: true,
  
  // Cache configuration
  cacheTTL: 300, // 5 minutes (0 disables caching)
  
  // Super admin access
  allowSuperAdminAccess: true,
  
  // Custom error messages
  errorMessages: {
    authenticationRequired: 'Please provide a valid authentication token',
    organizationAccessDenied: 'You do not have access to this organization',
    organizationNotActive: 'This organization account is inactive'
  },
  
  // Logging configuration
  logging: {
    enabled: true,
    logLevel: 'info', // 'debug', 'info', 'warn', 'error'
    logSensitiveData: false // NEVER set to true in production
  }
});
```

## Configuration Options

### Core Settings

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `verifyOrganizationAccess` | boolean | `true` | Enable database verification of organization access |
| `cacheTTL` | number | `300` | Cache TTL in seconds (0 disables caching) |
| `allowSuperAdminAccess` | boolean | `true` | Allow super admin access to multiple organizations |

### Error Messages

Customize error messages returned to clients:

```javascript
errorMessages: {
  authenticationRequired: 'Custom auth message',
  invalidToken: 'Custom invalid token message',
  organizationContextRequired: 'Custom org context message',
  organizationAccessDenied: 'Custom access denied message',
  userNotFound: 'Custom user not found message',
  organizationNotActive: 'Custom inactive org message'
}
```

### Logging Configuration

```javascript
logging: {
  enabled: true,           // Enable/disable logging
  logLevel: 'info',        // Minimum log level
  logSensitiveData: false  // Filter sensitive data (KEEP FALSE in production)
}
```

## Request Context

The middleware adds comprehensive context to the request object:

### `req.multiTenant`

```javascript
{
  userId: 'user-id',
  organizationId: 'org-id',
  userRole: 'USER',
  organizationRole: 'ADMIN',
  organization: {
    id: 'org-id',
    name: 'Organization Name',
    code: 'ORG_CODE',
    isActive: true
  },
  accessType: 'primary', // 'primary', 'secondary', 'super_admin', 'token_only'
  tokenContext: {
    permissions: ['org:manage_users', 'org:view_all'],
    sessionId: 'session-id',
    tokenVersion: 1,
    issuedAt: 1640995200,
    expiresAt: 1641001200
  }
}
```

### Backward Compatibility

The middleware maintains compatibility with existing auth systems:

```javascript
// Traditional auth context (still available)
req.user = {
  id: 'user-id',
  email: 'user@example.com',
  firstName: 'John',
  lastName: 'Doe',
  role: 'USER',
  organizationRole: 'ADMIN',
  organizationId: 'org-id',
  isActive: true
};

req.organizationContext = {
  organizationId: 'org-id',
  organizationRole: 'ADMIN',
  organization: { /* organization details */ }
};
```

## Error Handling

### Error Types

The middleware provides specific error classes for different scenarios:

| Error Class | Status Code | Error Code | Description |
|-------------|-------------|------------|-------------|
| `MissingTokenError` | 401 | `MISSING_TOKEN` | No authorization header or invalid format |
| `InvalidTokenError` | 401 | `INVALID_TOKEN` | Malformed, expired, or invalid JWT |
| `InvalidOrganizationError` | 403 | `INVALID_ORGANIZATION` | Missing organization context |
| `OrganizationAccessDeniedError` | 403 | `ORGANIZATION_ACCESS_DENIED` | No access to requested organization |

### Error Response Format

```javascript
{
  "success": false,
  "message": "Human-readable error message",
  "code": "MACHINE_READABLE_ERROR_CODE"
}
```

### Custom Error Handling

```javascript
app.use((err, req, res, next) => {
  if (err.name === 'MultiTenantError') {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      code: err.code,
      timestamp: new Date().toISOString()
    });
  }
  next(err);
});
```

## Caching

### Performance Benefits

The built-in caching system provides significant performance improvements:

- **First request**: ~400-500ms (database query)
- **Cached requests**: ~0-1ms (cache hit)
- **Performance improvement**: Up to 100% faster

### Cache Management

```javascript
const { clearOrganizationCache, getCacheStats } = require('./middleware/multiTenant');

// Clear specific user-organization cache
clearOrganizationCache('user-id', 'org-id');

// Clear all cache for a user
clearOrganizationCache('user-id');

// Clear all cache
clearOrganizationCache();

// Get cache statistics
const stats = getCacheStats();
console.log('Cache size:', stats.size);
console.log('Cache entries:', stats.entries);
```

### Cache Invalidation Strategies

```javascript
// After user role changes
app.post('/api/users/:userId/role', async (req, res) => {
  await updateUserRole(req.params.userId, req.body.role);
  
  // Invalidate user's cache
  clearOrganizationCache(req.params.userId);
  
  res.json({ success: true });
});

// After organization changes
app.put('/api/organizations/:orgId', async (req, res) => {
  await updateOrganization(req.params.orgId, req.body);
  
  // Invalidate all cache (or implement selective invalidation)
  clearOrganizationCache();
  
  res.json({ success: true });
});
```

## JWT Token Requirements

### Required Claims

Your JWT tokens must include these claims:

```javascript
{
  "sub": "user-id",                    // Subject (user ID)
  "organizationId": "org-id",          // Organization context
  "iat": 1640995200,                   // Issued at
  "exp": 1641001200                    // Expires at
}
```

### Enhanced Claims (Recommended)

```javascript
{
  "sub": "user-id",
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "role": "USER",
  "organizationId": "org-id",
  "organizationRole": "ADMIN",
  "tenant": "org-id",                  // Alternative to organizationId
  "tokenVersion": 1,                   // Token version for security
  "permissions": ["org:view", "org:edit"],
  "sessionId": "session-id",
  "iat": 1640995200,
  "exp": 1641001200
}
```

## Database Schema Requirements

### User Model

```sql
CREATE TABLE users (
  id VARCHAR PRIMARY KEY,
  email VARCHAR UNIQUE NOT NULL,
  first_name VARCHAR,
  last_name VARCHAR,
  role VARCHAR DEFAULT 'USER',
  organization_id VARCHAR REFERENCES organizations(id),
  organization_role VARCHAR DEFAULT 'MEMBER',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Organization Model

```sql
CREATE TABLE organizations (
  id VARCHAR PRIMARY KEY,
  name VARCHAR NOT NULL,
  code VARCHAR UNIQUE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### User-Organization Relationships (Many-to-Many)

```sql
CREATE TABLE user_organizations (
  user_id VARCHAR REFERENCES users(id),
  organization_id VARCHAR REFERENCES organizations(id),
  role VARCHAR DEFAULT 'MEMBER',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (user_id, organization_id)
);
```

## Production Deployment

### Environment Variables

```bash
# Required
JWT_SECRET=your-super-secret-jwt-key
DATABASE_URL=postgresql://user:pass@host:port/db

# Optional (for specific providers)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
```

### Performance Considerations

1. **Enable Caching**: Use appropriate TTL based on your use case
2. **Database Optimization**: Index user_id and organization_id columns
3. **Redis Integration**: Replace in-memory cache with Redis for production
4. **Connection Pooling**: Use database connection pooling
5. **Monitoring**: Monitor cache hit rates and response times

### Security Best Practices

1. **JWT Secret**: Use a strong, randomly generated secret
2. **Token Expiration**: Use short-lived tokens (1-2 hours)
3. **HTTPS Only**: Always use HTTPS in production
4. **Sensitive Data**: Never log sensitive information
5. **Rate Limiting**: Implement rate limiting on auth endpoints
6. **Token Rotation**: Implement token refresh mechanisms

## Migration from Existing Auth

### Step 1: Install Alongside Existing Auth

```javascript
// Apply multi-tenant middleware only to new routes
app.use('/api/v2', multiTenantAuth);

// Keep existing auth for legacy routes
app.use('/api/v1', existingAuthMiddleware);
```

### Step 2: Update Token Generation

```javascript
// Enhance existing token generation
const token = jwt.sign({
  // Existing claims
  sub: user.id,
  email: user.email,
  role: user.role,
  
  // Add organization context
  organizationId: user.organizationId,
  organizationRole: user.organizationRole,
  tenant: user.organizationId,
  tokenVersion: 1,
  permissions: getUserPermissions(user),
  sessionId: generateSessionId()
}, JWT_SECRET, { expiresIn: '2h' });
```

### Step 3: Gradual Migration

```javascript
// Use both middlewares during transition
app.use('/api', existingAuthMiddleware, multiTenantAuth);

// Routes can access both contexts
app.get('/api/data', (req, res) => {
  // Legacy context
  const userId = req.user?.id;
  
  // New context (preferred)
  const { userId: newUserId, organizationId } = req.multiTenant || {};
  
  // Use new context when available
  const finalUserId = newUserId || userId;
});
```

## Troubleshooting

### Common Issues

#### 1. "Token missing organization context"

**Cause**: JWT token doesn't include `organizationId` or `tenant` claim

**Solution**: Update token generation to include organization context

```javascript
const token = jwt.sign({
  sub: user.id,
  organizationId: user.organizationId, // Add this
  // ... other claims
}, JWT_SECRET);
```

#### 2. "Access denied to the requested organization"

**Cause**: User doesn't have access to the organization in the token

**Solution**: Verify user-organization relationships in database

```sql
SELECT * FROM user_organizations 
WHERE user_id = 'user-id' AND organization_id = 'org-id';
```

#### 3. Poor Performance

**Cause**: Database verification on every request without caching

**Solution**: Enable caching or disable database verification

```javascript
const middleware = createMultiTenantMiddleware({
  verifyOrganizationAccess: false, // Disable for better performance
  cacheTTL: 300 // Or enable caching
});
```

#### 4. Cache Not Working

**Cause**: TTL set to 0 or very short duration

**Solution**: Set appropriate cache TTL

```javascript
const middleware = createMultiTenantMiddleware({
  cacheTTL: 300 // 5 minutes
});
```

### Debug Mode

Enable debug logging to troubleshoot issues:

```javascript
const middleware = createMultiTenantMiddleware({
  logging: {
    enabled: true,
    logLevel: 'debug',
    logSensitiveData: false // Keep false in production
  }
});
```

## API Reference

### `createMultiTenantMiddleware(config?)`

Creates a new multi-tenant middleware instance.

**Parameters:**
- `config` (optional): Configuration object

**Returns:** Express middleware function

### `clearOrganizationCache(userId?, organizationId?)`

Clears organization access cache.

**Parameters:**
- `userId` (optional): Clear cache for specific user
- `organizationId` (optional): Clear cache for specific user-organization pair

### `getCacheStats()`

Returns cache statistics.

**Returns:** Object with cache size and entries

### Error Classes

- `MultiTenantError`: Base error class
- `MissingTokenError`: Missing or invalid authorization
- `InvalidTokenError`: Invalid JWT token
- `InvalidOrganizationError`: Missing organization context
- `OrganizationAccessDeniedError`: Organization access denied

## Examples

### Example 1: Basic Multi-Tenant API

```javascript
const express = require('express');
const { createMultiTenantMiddleware } = require('./middleware/multiTenant');

const app = express();
const multiTenant = createMultiTenantMiddleware();

app.use('/api', multiTenant);

app.get('/api/projects', (req, res) => {
  const { organizationId } = req.multiTenant;
  
  // Automatically scoped to user's organization
  const projects = getProjectsByOrganization(organizationId);
  res.json(projects);
});
```

### Example 2: Role-Based Access Control

```javascript
function requireRole(requiredRole) {
  return (req, res, next) => {
    const { organizationRole } = req.multiTenant;
    
    const roleHierarchy = ['GUEST', 'MEMBER', 'MANAGER', 'ADMIN', 'OWNER'];
    const userLevel = roleHierarchy.indexOf(organizationRole);
    const requiredLevel = roleHierarchy.indexOf(requiredRole);
    
    if (userLevel >= requiredLevel) {
      next();
    } else {
      res.status(403).json({ error: 'Insufficient permissions' });
    }
  };
}

app.delete('/api/projects/:id', requireRole('ADMIN'), (req, res) => {
  // Only admins and owners can delete projects
});
```

### Example 3: Permission-Based Access Control

```javascript
function requirePermission(permission) {
  return (req, res, next) => {
    const { permissions } = req.multiTenant.tokenContext;
    
    if (permissions.includes(permission)) {
      next();
    } else {
      res.status(403).json({ error: 'Missing required permission' });
    }
  };
}

app.post('/api/users', requirePermission('org:manage_users'), (req, res) => {
  // Only users with manage_users permission can create users
});
```

### Example 4: Organization Switching

```javascript
app.post('/api/auth/switch-organization', async (req, res) => {
  const { organizationId } = req.body;
  const { userId } = req.multiTenant;
  
  // Verify user has access to the new organization
  const hasAccess = await verifyUserOrganizationAccess(userId, organizationId);
  
  if (!hasAccess) {
    return res.status(403).json({ error: 'No access to organization' });
  }
  
  // Generate new token with new organization context
  const newToken = generateTokenWithOrganization(userId, organizationId);
  
  // Clear old cache
  clearOrganizationCache(userId);
  
  res.json({ token: newToken });
});
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## License

MIT License - see LICENSE file for details. 