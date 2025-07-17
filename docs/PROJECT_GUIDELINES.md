# Project Guidelines and Best Practices

## Project Overview
This is a multi-tenant CRM system with role-based access control and organization-level data isolation. The system is built with a React frontend and Node.js backend, using Supabase for database management.

## Core Principles

### 1. Multi-Tenancy
- Always consider organization context in data operations
- Verify organization ID is properly passed in headers
- Use multi-tenant middleware for protected routes
- Test features with multiple organization accounts

### 2. Authentication & Authorization
- All routes except login/register require authentication
- Use proper role checks (SUPER_ADMIN, ADMIN, USER, etc.)
- Maintain organization context in auth tokens
- Handle token refresh and session management properly

### 3. Configuration Management
- Server runs on port 5000
- Client runs on port 3001
- Database uses direct Supabase connection (not Transaction Pooler)
- CORS is configured for localhost:3001
- Environment files should be kept clean and up-to-date

### 4. Test Accounts
All test accounts use password: Admin123!
- ACME Construction:
  - admin@acmeconst.com (ADMIN/OWNER)
  - manager@acmeconst.com (USER/MANAGER)
- Builder Pro LLC:
  - admin@builderpro.com (ADMIN/OWNER)
- Super Admin:
  - superadmin@crmapp.com (SUPER_ADMIN with access to all organizations)

## Development Guidelines

### 1. Error Handling
- Always implement proper error boundaries
- Use try-catch blocks for async operations
- Provide meaningful error messages to users
- Log errors appropriately for debugging
- Update error tracking documentation

### 2. State Management
- Use Redux for global state
- Implement proper loading states
- Handle optimistic updates where appropriate
- Clear state on logout/organization switch

### 3. API Integration
- Use the api.js service for all HTTP requests
- Implement proper request/response interceptors
- Handle token refresh automatically
- Maintain organization context in headers

### 4. Security Best Practices
- Never expose sensitive data in logs
- Implement proper input validation
- Use parameterized queries for database operations
- Follow least privilege principle for roles
- Sanitize user inputs

### 5. Performance Considerations
- Implement proper caching strategies
- Use pagination for large data sets
- Optimize database queries
- Implement lazy loading where appropriate
- Monitor and optimize bundle size

## Common Workflows

### 1. Adding New Features
1. Consider multi-tenant implications
2. Implement proper role checks
3. Add necessary database migrations
4. Update API documentation
5. Add appropriate tests
6. Update relevant documentation

### 2. Bug Fixing
1. Reproduce issue in development environment
2. Check error tracking documentation
3. Implement fix with proper error handling
4. Test across different organizations
5. Update error tracking documentation
6. Add regression tests if necessary

### 3. Database Changes
1. Create proper migrations
2. Consider multi-tenant data isolation
3. Update relevant models
4. Add appropriate indexes
5. Test with significant data volume

## Deployment Considerations
1. Verify environment variables
2. Run database migrations
3. Clear cache if necessary
4. Monitor error rates
5. Check performance metrics

## Documentation
1. Keep error tracking up to date
2. Document API changes
3. Update deployment guides
4. Maintain change log
5. Document configuration changes

Remember: This is a professional system used by multiple organizations. Always consider security, performance, and multi-tenant implications when making changes. 

## Module Export Standards

### Named Exports vs Default Exports

The project follows these standards for module exports:

1. **API Services and Utilities**
   - Use named exports for all API service functions and utilities
   - Each function should be individually exported
   - Example:
   ```javascript
   // Good
   export const getUsers = async () => { ... };
   export const createUser = async () => { ... };

   // Avoid
   const userAPI = { getUsers: async () => { ... } };
   export default userAPI;
   ```

2. **React Components**
   - Use default exports for React components (following React conventions)
   - Example:
   ```javascript
   const MyComponent = () => { ... };
   export default MyComponent;
   ```

3. **Configuration and Constants**
   - Use named exports for configuration objects and constants
   - Example:
   ```javascript
   export const API_BASE_URL = '/api';
   export const DEFAULT_TIMEOUT = 5000;
   ```

4. **Hooks and Context**
   - Use named exports for custom hooks and context
   - Example:
   ```javascript
   export const useAuth = () => { ... };
   export const AuthContext = createContext();
   ```

### Benefits of Named Exports

1. Better tree-shaking: Bundlers can remove unused code
2. Explicit dependencies: Imports clearly show what's being used
3. IDE support: Better autocomplete and refactoring support
4. Consistent naming: Prevents accidental renaming during import

### Import Examples

```javascript
// Good - Named imports
import { getUsers, createUser } from './userAPI';
import { API_BASE_URL } from './config';

// Good - Default import for components
import UserList from './components/UserList';

// Avoid - Default import for services
import userAPI from './userAPI';
``` 

### Service Module Exports

All service modules in the project use named exports for better tree-shaking and maintainability:

1. **API Services**
   ```javascript
   // Good
   export const getUsers = async () => { ... };
   export const createUser = async () => { ... };

   // Instead of
   const userAPI = { getUsers: async () => { ... } };
   export default userAPI;
   ```

2. **Socket Service**
   ```javascript
   // Export both class and singleton instance
   export class SocketService { ... }
   export const socketService = new SocketService();
   ```

3. **Using Services**
   ```javascript
   // Good - Import only what you need
   import { getUsers, createUser } from '../services/userAPI';
   import { socketService } from '../services/socket';

   // Instead of
   import userAPI from '../services/userAPI';
   import socket from '../services/socket';
   ```

Benefits of this approach:
- Better tree-shaking (unused functions are removed from the bundle)
- More explicit dependencies
- Better IDE support for imports
- Consistent naming across the codebase
- Easier to maintain and understand 

## API Service Patterns

### Named Exports

All API service modules use named exports instead of default exports. This provides better tree-shaking, explicit imports, and clearer code organization.

Example:
```javascript
// BAD
export default {
  getUsers,
  createUser
};

// GOOD
export const getUsers = async () => {
  // implementation
};

export const createUser = async (userData) => {
  // implementation
};
```

### API Function Naming

- Use clear, action-based names (get, create, update, delete)
- Include the entity name in the function (getUser, createOrganization)
- Use async/await consistently
- Return the response.data when possible

Example:
```javascript
export const getUsers = async () => {
  const response = await api.get('/api/users');
  return response.data;
};
```

### Error Handling

- Use try/catch blocks in service functions when additional error processing is needed
- Throw meaningful errors with context
- Include error response data when available

Example:
```javascript
export const updateUser = async (id, userData) => {
  try {
    const response = await api.put(`/api/users/${id}`, userData);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to update user');
  }
};
```

### API Organization

Our API services are organized by domain:

- `api.js` - Core axios instance and common utilities
- `authAPI.js` - Authentication and authorization
- `userAPI.js` - User management
- `organizationAPI.js` - Organization management
- `analyticsAPI.js` - Analytics and reporting
- `dashboardAPI.js` - Dashboard metrics
- `leadAPI.js` - Lead management

Each service module should:
1. Import the core api instance from api.js
2. Export individual functions as named exports
3. Follow consistent patterns for error handling
4. Include JSDoc comments for complex functions 

## API Response Formats

All API responses should follow a consistent format:

```javascript
{
  success: boolean,
  data?: any,
  error?: {
    message: string,
    code?: string,
    details?: any
  }
}
```

### Success Response Example
```javascript
{
  "success": true,
  "data": {
    "id": "123",
    "name": "Example Organization"
  }
}
```

### Error Response Example
```javascript
{
  "success": false,
  "error": {
    "message": "Organization not found",
    "code": "ORG_NOT_FOUND",
    "details": { "id": "123" }
  }
}
```

## API Versioning

Our API versioning strategy:

1. URL Path Versioning:
```javascript
// Current version (implicit v1)
/api/users

// Future versions (explicit)
/api/v2/users
```

2. Version Headers:
```javascript
// Request header
X-API-Version: 2

// Response header
X-API-Version: 2
```

3. Version Deprecation:
- Announce deprecation 6 months in advance
- Include deprecation warnings in response headers
- Maintain backwards compatibility for 1 year

## Testing Patterns

### API Service Tests

1. Mock API Calls:
```javascript
// services/__tests__/userAPI.test.js
import { getUsers } from '../userAPI';
import { api } from '../api';

jest.mock('../api');

describe('userAPI', () => {
  it('should fetch users', async () => {
    const mockData = [{ id: 1, name: 'Test' }];
    api.get.mockResolvedValue({ data: mockData });
    
    const result = await getUsers();
    expect(result).toEqual(mockData);
  });
});
```

2. Error Handling Tests:
```javascript
it('should handle errors', async () => {
  const error = new Error('Network error');
  api.get.mockRejectedValue(error);
  
  await expect(getUsers()).rejects.toThrow('Network error');
});
```

3. Test Organization:
- Group tests by service module
- Test happy path first
- Test error cases
- Test edge cases
- Test response transformations

## API Security

1. Authentication:
- All API calls require valid JWT token
- Token refresh mechanism
- Organization context validation

2. Rate Limiting:
```javascript
// Rate limit configuration
{
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
}
```

3. Input Validation:
- Validate request parameters
- Sanitize inputs
- Type checking
- Size limits

4. Error Handling:
- Never expose internal errors
- Log errors securely
- Return appropriate status codes

## API Performance

1. Caching Strategy:
```javascript
// Example cache configuration
const cacheConfig = {
  ttl: 60 * 5, // 5 minutes
  max: 100 // maximum 100 items
};
```

2. Query Optimization:
- Use pagination
- Limit response fields
- Optimize database queries
- Use appropriate indexes

3. Monitoring:
- Track response times
- Monitor error rates
- Set up alerts
- Use performance metrics 

## API Endpoint Structure

### Base URL Configuration
- Development: `http://localhost:5000`
- No `/api` prefix in URLs
- All endpoints are mounted directly at the root level

### Authentication Endpoints
```
POST /auth/login
POST /auth/register
POST /auth/refresh-token
POST /auth/logout
```

### Dashboard Endpoints
```
GET /dashboard/metrics
GET /dashboard/projects/metrics
GET /dashboard/tasks/metrics
GET /dashboard/financial/metrics
GET /dashboard/clients/metrics
GET /dashboard/trends
```

### Lead Management Endpoints
```
GET    /leads
POST   /leads
GET    /leads/:id
PATCH  /leads/:id/status
GET    /leads/pipeline
```

### Organization Endpoints
```
GET    /organizations
POST   /organizations
GET    /organizations/:id
PUT    /organizations/:id
```

### Health Check
```
GET /health
```

## API Response Format

All API responses follow this structure:
```javascript
{
  success: boolean,
  data?: any,
  error?: {
    message: string,
    code?: string
  }
}
```

## Client-Side API Integration

1. Service Module Structure:
```javascript
// services/api.js - Base API configuration
import axios from 'axios';

export const api = axios.create({
  baseURL: 'http://localhost:5000',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add auth token to requests
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

2. Feature-Specific Service Modules:
```javascript
// services/dashboardAPI.js
import { api } from './api';

export const getMetrics = () => api.get('/dashboard/metrics');
export const getProjectMetrics = () => api.get('/dashboard/projects/metrics');
```

## Common Issues and Solutions

1. API Path Mismatches
   - Always use the paths defined in this document
   - No `/api` prefix in URLs
   - Keep server routes and client service paths in sync

2. Authentication Headers
   - All protected routes require Bearer token
   - Token is automatically added by API interceptor

3. Error Handling
   - All errors should be caught and formatted consistently
   - Use the standard error response format

4. Route Organization
   - Group related endpoints in feature-specific route files
   - Mount all routes at the root level in `server/src/index.js`

## Testing API Endpoints

Before deploying changes:

1. Test Health Check:
```bash
curl -X GET http://localhost:5000/health
```

2. Test Authentication:
```bash
curl -X POST http://localhost:5000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'
```

3. Test Protected Routes:
```bash
curl -X GET http://localhost:5000/dashboard/metrics \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Route File Organization

Server-side route files should be organized as follows:

```
server/
  src/
    routes/
      index.js          # Main router configuration
      authRoutes.js     # Authentication routes
      dashboardRoutes.js # Dashboard routes
      leadRoutes.js     # Lead management routes
      ...
```

## Client-Side Service Organization

Client-side services should be organized as follows:

```
client/
  src/
    services/
      api.js           # Base API configuration
      authAPI.js       # Authentication service
      dashboardAPI.js  # Dashboard service
      leadAPI.js       # Lead management service
      ...
```

## Deployment Considerations

1. Environment Variables:
   - `VITE_API_URL` for client
   - `PORT` for server
   - No hardcoded URLs

2. CORS Configuration:
   - Development: `localhost:3001`
   - Production: Configure based on deployment domain

3. Security:
   - All routes except /health and /auth/* require authentication
   - Use proper CORS headers
   - Validate all inputs 

## RBAC Backend Enhancements (2024-07-15)

### New Endpoints

- **/api/permissions/permissions**: CRUD for Permission objects (Super Admin only)
- **/api/permissions/roles**: CRUD for Role objects (Super Admin only)
- **/api/permissions/roles/:roleId/permissions/:permissionId**: Assign/revoke permissions to roles
- **/api/permissions/users/:userId/roles/:roleId**: Assign/revoke roles to users
- **/api/permissions/users/:userId/permissions/:permissionId**: Assign/revoke direct permissions to users

All endpoints require Super Admin privileges.

### Permission Middleware

- `requirePermission(permission)` can be used in any route to enforce fine-grained access control.
- Example usage:
  ```js
  import { requirePermission } from '../middleware/permission.js';
  router.post('/users', requirePermission('org:manage_users'), ...);
  ```
- Permissions are checked from the JWT or multi-tenant context. In the future, DB fallback will be supported.

### Best Practices
- Use roles for broad access, permissions for specific actions.
- Always log permission/role changes for auditability.
- Keep permissions in sync between roles and direct user grants. 