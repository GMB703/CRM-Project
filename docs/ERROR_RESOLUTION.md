# Error Resolution Guide

## Connection and Startup Issues

### ERR_CONNECTION_REFUSED (Port 5000/3001)

**Error Message:**
```
POST http://localhost:5000/api/auth/login net::ERR_CONNECTION_REFUSED
```

**Cause:**
- Server or client processes are not running
- Port conflicts (port already in use)
- Incorrect working directory when starting services

**Resolution Steps:**

1. Kill any existing processes:
```bash
pkill -f "npm run dev"
# Or for specific ports:
sudo kill -9 $(lsof -ti:5000,3001)
```

2. Start the server (from project root):
```bash
cd server && npm run dev
```
Expected output:
```
🚀 Server running on http://localhost:5000
✅ Database connected successfully
```

3. Start the client (from project root):
```bash
cd client && npm run dev
```
Expected output:
```
VITE v5.4.19  ready in XXX ms
➜  Local:   http://localhost:3001/
```

**Note:** Always ensure you're in the correct directory (project root) before running the commands. If the project directory has spaces, use quotes: `cd "CRM Project"` or escape the space: `cd CRM\ Project`.

### Database Connection Issues

**Error Message:**
```
❌ Database connection failed: PrismaClientInitializationError: Can't reach database server at `db.jpieswaxjlyxmvtlobmd.supabase.co:5432`
Please make sure your database server is running at `db.jpieswaxjlyxmvtlobmd.supabase.co:5432`.
```

**Cause:**
- IPv6/IPv4 compatibility issues with direct database connection
- Incorrect database connection URL format
- Wrong region or connection pooler configuration

**Resolution:**
1. Use Supabase connection pooler instead of direct connection:
   ```
   postgresql://postgres.jpieswaxjlyxmvtlobmd:Up4TDvvQSgwFO6ec@aws-0-us-east-2.pooler.supabase.com:6543/postgres
   ```

2. Key configuration points:
   - Use shared connection pooler (supports both IPv4/IPv6)
   - Correct region: us-east-2
   - Project reference in username: postgres.jpieswaxjlyxmvtlobmd
   - Port: 6543
   - SSL required: Add ?ssl=require to the connection string

3. Verify the connection:
   - Server should show: "✅ Database connected successfully"
   - Login endpoints should return proper 401 errors for invalid credentials
   - Multi-tenant queries should work correctly

**Note:** If switching between direct connection and connection pooler, ensure all related configuration (like max connections, idle timeout) is updated accordingly.

### Link Component Not Defined

**Error Message:**
```
Uncaught ReferenceError: Link is not defined
    at Sidebar.jsx:299:30
```

**Cause:**
Missing import for the Link component from react-router-dom

**Resolution:**
Add the Link import to the component:
```javascript
import { NavLink, Link, useLocation } from 'react-router-dom';
```

### List Component Not Defined

**Error Message:**
```
Uncaught ReferenceError: List is not defined
    at Sidebar.jsx:265:22
```

**Cause:**
Missing import for the List component from @mui/material

**Resolution:**
Add the List component to the Material-UI imports:
```javascript
import {
  Box,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
  List
} from '@mui/material';
```

This error commonly occurs when using Material-UI components without importing them. Always check that all MUI components are properly imported from '@mui/material'.

## Lead Management Issues

### Lead Status Not Updating

**Error Message:**
```
Failed to update lead
```

**Cause:**
- Invalid status transition
- Missing required fields in the update request
- Network connectivity issues

**Resolution:**
1. Check that the status transition is valid (e.g., cannot move directly from 'NEW' to 'CLOSED_WON' without intermediate steps)
2. Ensure all required fields are filled out in the form
3. Verify network connection and API endpoint availability

### Lead Source Validation

**Error Message:**
```
Invalid lead source value
```

**Cause:**
Custom lead source entered that's not in the predefined list

**Resolution:**
Use only the following predefined lead sources:
- Website
- Referral
- Social Media
- Email Campaign
- Trade Show
- Cold Call
- Other

### Lead Form Submission

**Error Message:**
```
Failed to add/update lead
```

**Cause:**
- Missing required fields (firstName, lastName, email)
- Invalid email format
- Duplicate email address

**Resolution:**
1. Ensure all required fields are filled out:
   - First Name
   - Last Name
   - Valid email address
2. Check for duplicate email addresses in the system
3. Verify the email format is valid

### Lead List Not Loading

**Error Message:**
```
Failed to load leads
```

**Cause:**
- API endpoint connection issues
- Authentication token expired
- Permission issues

**Resolution:**
1. Check network connection
2. Verify authentication status
3. Refresh the page to get a new token
4. Contact administrator if permission issues persist

### Pipeline View Drag and Drop Issues

**Warning Message:**
```
react-beautiful-dnd is now deprecated
```

**Cause:**
The react-beautiful-dnd package is deprecated but still functional. Future updates may require migration to alternatives like @dnd-kit/core.

**Resolution:**
Currently, the package works as expected. When migration becomes necessary:
1. Install @dnd-kit/core and related packages
2. Update PipelineView.jsx to use the new drag-and-drop implementation
3. Test all drag-and-drop functionality thoroughly

**Common Drag and Drop Errors:**

1. **Invalid Drag Handle**
```
Invariant failed: Drag handle must be a mounted DOM element
```
**Resolution:**
- Ensure drag handle refs are properly set
- Check that the draggable component is mounted before enabling drag

2. **Dropping Outside Valid Area**
```
No droppable found with id: [STATUS]
```
**Resolution:**
- Verify droppableId matches the expected status ID
- Check that Droppable components are properly wrapped
- Ensure status IDs in leadStatuses array match backend values

3. **Performance Issues**
If the pipeline view becomes sluggish with many leads:
- Implement virtualization for lead cards
- Add pagination or infinite scroll
- Consider reducing unnecessary re-renders using React.memo or useMemo 

### Lead API Issues

**Error Message:**
```
Failed to load pipeline data
```

**Cause:**
1. Network connectivity issues
2. Backend server not running
3. Authentication token expired
4. Invalid API response format

**Resolution:**
1. Check network connection
2. Verify server is running on port 5000
3. Try logging out and back in to refresh the token
4. Check browser console for detailed error messages

**Common API Errors:**

1. **Status Update Failed**
```
Failed to update lead status
```
**Resolution:**
- Check if the lead ID exists
- Verify the status is valid
- Ensure you have permission to update leads
- Check network connectivity

2. **Bulk Update Failed**
```
Failed to perform bulk status update
```
**Resolution:**
- Verify all lead IDs are valid
- Check that all status values are valid
- Ensure the updates array format is correct
- Try updating leads individually if bulk update fails

3. **Lead Not Found**
```
Lead with ID [X] not found
```
**Resolution:**
- Verify the lead ID is correct
- Check if the lead was deleted
- Refresh the page to get updated data
- Clear browser cache if issues persist 

### Login Authentication Issues

**Error Message:**
```
401 Unauthorized - Invalid credentials
```

**Cause:**
1. Database seeding issues - test users not properly created
2. Password hashing mismatch between seed data and login
3. Organization context missing or incorrect

**Resolution:**
1. Run database seed script to create test users and organizations:
```bash
cd server
npx prisma db seed
```

2. Verify test accounts are created with correct credentials:
- admin@acmeconst.com (ADMIN/OWNER)
- manager@acmeconst.com (USER/MANAGER)
- admin@builderpro.com (ADMIN/OWNER)
- superadmin@crmapp.com (SUPER_ADMIN)
All using password: Admin123!

3. Key points in the fix:
   - Use `upsert` instead of `create` to handle existing records
   - Properly hash passwords using bcrypt during seeding
   - Ensure organizations exist before creating users
   - Set correct organization roles and relationships

4. Test login with curl to verify server response:
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@acmeconst.com","password":"Admin123!"}'
```

Expected successful response should include:
- success: true
- user object with role and organization details
- valid JWT token
- organization context

**Note:** If login succeeds but subsequent requests fail with 403, check that the JWT token includes proper organization context and roles.

# Error Resolution Log

## Authentication & Authorization

### JSON Parsing Error in Login Flow
**Error**: `SyntaxError: "undefined" is not valid JSON`
**Location**: `authAPI.js:33` and `api.js:19`
**Root Cause**: Unsafe JSON parsing of localStorage data when user data doesn't exist
**Resolution**:
1. Added safe JSON parsing in API interceptor:
   ```javascript
   let user = {};
   try {
     const userStr = localStorage.getItem('user');
     if (userStr) {
       user = JSON.parse(userStr);
     }
   } catch (error) {
     console.warn('Failed to parse user from localStorage:', error);
   }
   ```
2. Added similar safety checks in organization service
3. Improved error handling and fallback values

### WebSocket Connection Issues
**Error**: `[vite] server connection lost. Polling for restart...`
**Location**: Development server WebSocket connection
**Root Cause**: Unstable WebSocket configuration in Vite
**Resolution**:
1. Updated Vite configuration with explicit HMR settings:
   ```javascript
   server: {
     hmr: {
       protocol: 'ws',
       host: 'localhost',
       port: 3001,
       clientPort: 3001,
       timeout: 5000,
     },
     proxy: {
       '/api': {
         target: 'http://localhost:5000',
         changeOrigin: true,
         secure: false,
         ws: true
       }
     }
   }
   ```
2. Added WebSocket support in proxy configuration
3. Increased connection timeout for better stability 
## Module System and Import Issues

### ES Module Import/Export Errors

**Error Message:**
```
SyntaxError: The requested module './middleware/errorHandler.js' does not provide an export named 'errorHandler'
```
or
```
SyntaxError: The requested module '../middleware/superAdmin.js' does not provide an export named 'default'
```

**Cause:**
- Mismatch between export type (default vs named) and import statement
- Incorrect import syntax in ES modules
- Missing .js extension in import paths

**Resolution:**
1. For default exports:
   ```javascript
   // In the exporting file (e.g., errorHandler.js)
   const errorHandler = (err, req, res, next) => {
     // ... handler implementation
   };
   export default errorHandler;

   // In the importing file
   import errorHandler from './middleware/errorHandler.js';
   ```

2. For named exports:
   ```javascript
   // In the exporting file (e.g., superAdmin.js)
   export const isSuperAdmin = (req, res, next) => {
     // ... middleware implementation
   };

   // In the importing file
   import { isSuperAdmin } from '../middleware/superAdmin.js';
   ```

3. Always include .js extension in import paths when using ES modules
4. Check package.json has "type": "module" for ES module syntax

### Port Already in Use

**Error Message:**
```
Error: listen EADDRINUSE: address already in use :::5000
```

**Cause:**
- Previous server instance still running
- Another application using the same port
- Process didn't shut down properly

**Resolution:**
1. Kill existing processes:
   ```bash
   # For specific ports
   lsof -ti:5000,3001 | xargs kill -9
   
   # Or for all node processes
   pkill -f node
   ```

2. Add proper error handling in server startup:
   ```javascript
   const startServer = async () => {
     try {
       const server = app.listen(PORT, () => {
         console.log(`Server running on port ${PORT}`);
       });

       server.on('error', (error) => {
         if (error.code === 'EADDRINUSE') {
           console.error(`Port ${PORT} is already in use`);
           process.exit(1);
         }
       });
     } catch (error) {
       console.error('Failed to start server:', error);
       process.exit(1);
     }
   };
   ```

3. If port 5000 is consistently blocked, configure a different port:
   - Set PORT environment variable
   - Update client proxy configuration in vite.config.js
   - Update CORS configuration in server

**Note:** Always ensure both client and server are properly shut down before restarting. 

## Component Loading Order Issues

### Module Export Not Found Errors

**Error Message:**
```
Uncaught SyntaxError: The requested module '/src/services/organizationAPI.js' does not provide an export named 'getOrganizations'
```
or
```
Uncaught SyntaxError: The requested module '/src/contexts/OrganizationContext.jsx' does not provide an export named 'useOrganizationContext'
```

**Cause:**
1. Components loading before their dependencies are ready
2. Mismatch between export and import statements
3. Context providers not properly wrapping components
4. Authentication state not being checked before rendering protected components

**Resolution Steps:**

1. **Provider Order in App.jsx:**
   ```jsx
   function App() {
     return (
       <Provider store={store}>
         <PersistGate loading={null} persistor={persistor}>
           <OrganizationProvider>
             <ThemeProvider>
               <Router>
                 {/* App content */}
               </Router>
             </ThemeProvider>
           </OrganizationProvider>
         </PersistGate>
       </Provider>
     );
   }
   ```
   Ensure providers are ordered correctly: Redux > PersistGate > OrganizationProvider > ThemeProvider

2. **Protected Component Loading:**
   ```jsx
   const ProtectedComponent = () => {
     const { isAuthenticated, loading } = useAuth();
     
     if (loading) return <LoadingSpinner />;
     if (!isAuthenticated) return null;
     
     return <Component />;
   }
   ```

3. **Context Usage:**
   ```jsx
   // OrganizationContext.jsx
   export const useOrganization = () => {
     const context = useContext(OrganizationContext);
     if (!context) throw new Error('useOrganization must be used within OrganizationProvider');
     return context;
   };

   // Component using context
   const Component = () => {
     const { user, isAuthenticated, loading } = useAuth();
     const { currentOrganization } = useOrganization();

     if (loading) return <LoadingSpinner />;
     if (!isAuthenticated) return null;

     return <div>{/* Component content */}</div>;
   };
   ```

4. **Export/Import Consistency:**
   ```jsx
   // organizationAPI.js
   const organizationAPI = {
     getOrganizations: async () => { /* ... */ },
     // other methods
   };
   export default organizationAPI;

   // Using the API
   import organizationAPI from '../services/organizationAPI';
   const { data } = await organizationAPI.getOrganizations();
   ```

5. **Loading States:**
   - Add loading states to all async operations
   - Show loading indicators during state transitions
   - Handle errors gracefully with error boundaries
   - Prevent premature component rendering

6. **Authentication Flow:**
   ```jsx
   // Check auth on app load
   useEffect(() => {
     if (localStorage.getItem('token')) {
       dispatch(getCurrentUser());
     }
   }, [dispatch]);

   // Protect routes
   <Route
     path="/protected"
     element={
       <PrivateRoute>
         <ProtectedComponent />
       </PrivateRoute>
     }
   />
   ```

**Best Practices:**
1. Always wrap components requiring auth in PrivateRoute
2. Check authentication state before loading protected data
3. Use loading states during async operations
4. Handle errors gracefully
5. Follow proper provider hierarchy
6. Maintain consistent export/import patterns

**Prevention:**
1. Use TypeScript for better type checking
2. Implement proper error boundaries
3. Add comprehensive loading states
4. Follow consistent module export patterns
5. Use proper dependency injection
6. Maintain clear provider hierarchy

Remember: Components should never try to access data or context that isn't guaranteed to be available. Always check authentication and loading states before rendering protected content. 

### API Import Standardization

**Issue:**
Inconsistent import patterns across the codebase for API services, leading to potential confusion and errors.

**Examples of Inconsistent Imports:**
```javascript
// Named exports (problematic)
import { getSystemMetrics } from '../services/analyticsAPI';
import { leadAPI } from '../../services/leadAPI';
import { loginAPI, getCurrentUserAPI } from '../../services/authAPI';

// Default exports (correct)
import api from '../services/api';
import organizationAPI from '../services/organizationAPI';
import dashboardAPI from '../../services/dashboardAPI';
```

**Standardization Rules:**
1. All API service modules should use default exports
2. Service methods should be grouped in a single object
3. Consistent method naming within each service
4. All services should extend from the base api.js configuration

**Example of Standardized API Service:**
```javascript
import api from './api';

const serviceAPI = {
  getAll: () => api.get('/endpoint'),
  getOne: (id) => api.get(`/endpoint/${id}`),
  create: (data) => api.post('/endpoint', data),
  update: (id, data) => api.put(`/endpoint/${id}`, data),
  delete: (id) => api.delete(`/endpoint/${id}`),
  // Additional methods as needed
};

export default serviceAPI;
```

**Common Locations for Standardization:**
- authAPI.js
- leadAPI.js
- analyticsAPI.js
- organizationAPI.js
- userAPI.js
- dashboardAPI.js

**Benefits:**
1. Consistent import pattern across the codebase
2. Better IDE support and auto-completion
3. Easier refactoring and maintenance
4. Reduced chance of import-related errors
5. Clear dependency chain through base api.js

Remember: All API services should follow this pattern to maintain consistency and prevent import-related errors. 

### Premature Component Loading and Import Errors

**Error Message:**
```
Uncaught SyntaxError: The requested module '/src/services/organizationAPI.js' does not provide an export named 'getOrganizations' (at SuperAdminDashboard.jsx:6:10)
```

**Cause:**
1. Components trying to load and import modules before authentication is complete
2. Incorrect import patterns (named vs default exports)
3. Components not properly protected against premature rendering

**Resolution:**
1. Add proper authentication checks before component rendering:
   ```javascript
   const SuperAdminDashboard = () => {
     const { user, isAuthenticated, loading: authLoading } = useAuth();
     const isSuperAdmin = useSelector(selectIsSuperAdmin);

     // Don't render if auth is loading or user isn't super admin
     if (authLoading) return <LoadingSpinner />;
     if (!isAuthenticated || !isSuperAdmin) return null;

     // Rest of the component...
   };
   ```

2. Fix import patterns:
   ```javascript
   // Wrong:
   import { getOrganizations } from '../../services/organizationAPI';
   
   // Correct:
   import organizationAPI from '../../services/organizationAPI';
   ```

3. Add dependency checks in useEffect:
   ```javascript
   useEffect(() => {
     // Only load data if authenticated and super admin
     if (isAuthenticated && isSuperAdmin && !authLoading) {
       loadData();
     }
   }, [isAuthenticated, isSuperAdmin, authLoading]);
   ```

**Prevention:**
1. Always wrap protected components in auth checks
2. Use consistent import patterns (prefer default exports for services)
3. Check auth state before making API calls
4. Add loading states for auth checks
5. Follow the component loading order:
   - Auth check
   - Role verification
   - Data loading
   - Component rendering

**Common Locations:**
- SuperAdmin components
- Organization management features
- User management features
- Analytics dashboards
- Settings pages

Remember: Components should never attempt to access protected resources or make API calls until authentication is confirmed and the user's role is verified. 

### File Organization and Casing

**Issue:**
Inconsistent file casing and duplicate files can cause import errors and confusion.

**Example:**
```
client/src/components/Leads/InactivitySettings.jsx  ✅ Correct
client/src/components/leads/InactivitySettings.jsx  ❌ Incorrect (duplicate)
```

**Rules:**
1. Use PascalCase for component directories and files
   - Components: `LeadList.tsx`, `InactivitySettings.jsx`
   - Directories: `Leads/`, `SuperAdmin/`

2. Use camelCase for utility and service files
   - Services: `leadAPI.js`, `authAPI.js`
   - Utils: `dateHelpers.js`

3. TypeScript/JavaScript Organization:
   - TypeScript (.ts/.tsx) files for components with type requirements
   - JavaScript (.js/.jsx) for simpler components
   - Keep TypeScript interfaces in .ts files
   - Example: Leads module uses TypeScript for complex state management

**Prevention:**
1. Check for duplicate files with different casing
2. Use consistent naming conventions
3. Keep TypeScript and JavaScript separation intentional
4. Document type interfaces in dedicated files
5. Use proper file extensions (.tsx for TypeScript React components)

Remember: Case sensitivity matters in imports. Always use the exact casing as the file system. 

## Service Module Export Standardization

### Issue: Inconsistent Module Export Patterns

The codebase had mixed usage of default exports and named exports across service modules, leading to:
- Inconsistent import patterns
- Poor tree-shaking
- Potential naming conflicts
- Reduced IDE support

### Resolution Steps

1. **Converted API Services to Named Exports**
   - Modified the following services:
     ```
     ✓ api.js
     ✓ authAPI.js
     ✓ analyticsAPI.js
     ✓ userAPI.js
     ✓ dashboardAPI.js
     ✓ leadAPI.js
     ✓ socket.js
     ```

2. **Updated Import Statements**
   - Changed from:
     ```javascript
     import userAPI from '../services/userAPI';
     userAPI.getUsers();
     ```
   - To:
     ```javascript
     import { getUsers } from '../services/userAPI';
     getUsers();
     ```

3. **Socket Service Updates**
   - Exported both class and singleton:
     ```javascript
     export class SocketService { ... }
     export const socketService = new SocketService();
     ```

4. **Testing Process**
   ```bash
   # Kill existing processes
   lsof -i :5000 | grep LISTEN | awk '{print $2}' | xargs kill -9

   # Start server
   cd server && npm start

   # Start client
   cd client && npm run dev
   ```

5. **Verification Steps**
   - Ensure server starts on port 5000
   - Verify client development server runs
   - Test authentication flow
   - Check organization context switching
   - Verify lead management functionality
   - Test real-time socket connections

### Benefits

1. **Development**
   - Better IDE support for imports
   - Clearer dependency tracking
   - Improved code completion
   - Easier refactoring

2. **Build**
   - Improved tree-shaking
   - Smaller bundle sizes
   - Better code splitting

3. **Maintenance**
   - Consistent patterns
   - Clear import/export relationships
   - Better error tracking
   - Simplified debugging

### Common Issues and Solutions

1. **Module Resolution Errors**
   ```
   Error: The requested module '/src/services/organizationAPI.js' does not provide an export named 'getOrganizations'
   ```
   Solution: Ensure you're using named imports that match the exported function names exactly.

2. **Import Statement Fixes**
   ```javascript
   // Incorrect
   import organizationAPI from '../../services/organizationAPI';
   
   // Correct
   import { getOrganizations, createOrganization } from '../../services/organizationAPI';
   ```

3. **Socket Service Usage**
   ```javascript
   // Incorrect
   import socket from '../../services/socket';
   
   // Correct
   import { socketService } from '../../services/socket';
   ```

### Standards Going Forward

1. **New Services**
   - Use named exports for all service functions
   - Export classes and singletons separately
   - Maintain consistent naming patterns

2. **Documentation**
   - Update PROJECT_GUIDELINES.md with export standards
   - Document any deviations from standards
   - Include examples in comments

3. **Testing**
   - Verify all named exports are accessible
   - Test tree-shaking in production builds
   - Monitor bundle sizes 

### Server and Client Startup Procedures

When starting the application after making significant changes (like the service module exports refactoring), follow these steps carefully:

1. **Clean Installation**
   ```bash
   # From project root
   npm install                  # Install root dependencies
   cd client && npm install    # Install client dependencies
   cd ../server && npm install # Install server dependencies
   ```

2. **Server Startup**
   ```bash
   # From server directory
   # First, ensure no process is using port 5000
   lsof -i :5000 | grep LISTEN | awk '{print $2}' | xargs kill -9

   # Start server with debug logging if needed
   NODE_ENV=development DEBUG=* npm start
   # Or normal start
   npm start
   ```

3. **Client Startup**
   ```bash
   # From client directory
   npm run dev
   ```

4. **Verification Steps**
   - Server should show: "Server running on port 5000"
   - Client should start on port 3001
   - Test API connection:
     ```bash
     curl -X POST http://localhost:5000/api/auth/login \
       -H "Content-Type: application/json" \
       -d '{"email":"admin@acmeconst.com","password":"Admin123!"}'
     ```

### Common Startup Issues

1. **Port Already in Use**
   ```
   Error: Port 5000 is already in use
   ```
   Solution: Kill the existing process and restart
   ```bash
   lsof -i :5000 | grep LISTEN | awk '{print $2}' | xargs kill -9
   ```

2. **Module Not Found Errors**
   ```
   Error: Cannot find module '...'
   ```
   Solution: Reinstall dependencies
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

3. **Client-Server Connection Issues**
   - Verify CORS settings in server/.env
   - Check client's vite.config.js proxy settings
   - Ensure client is using correct API URL

4. **Database Connection Issues**
   - Verify DATABASE_URL in server/.env
   - Check Supabase connection status
   - Ensure SSL requirements are met

### Monitoring and Debugging

1. **Server Logs**
   ```bash
   # Enhanced logging
   NODE_ENV=development DEBUG=* npm start
   ```

2. **Client Development**
   ```bash
   # With detailed logging
   VITE_DEBUG=true npm run dev
   ```

3. **Database Connection**
   ```bash
   # Test database connection
   node scripts/check-db.js
   ``` 

## API Import Errors

### SyntaxError: The requested module does not provide an export named 'default'

This error occurs when trying to use default imports with modules that use named exports.

#### Problem:
```javascript
// This will fail
import api from '../services/api';
import userAPI from '../services/userAPI';
```

#### Solution:
Use named imports to match the export pattern:
```javascript
// This will work
import { api } from '../services/api';
import { getUsers, createUser } from '../services/userAPI';
```

### Common API Import Patterns

For each service module, import only the functions you need:

1. Core API instance:
```javascript
import { api } from '../services/api';
```

2. Auth functions:
```javascript
import { login, logout, getCurrentUser } from '../services/authAPI';
```

3. User management:
```javascript
import { getUsers, createUser, updateUser } from '../services/userAPI';
```

4. Organization management:
```javascript
import { getOrganizations, setCurrentOrganization } from '../services/organizationAPI';
```

5. Analytics:
```javascript
import { getSystemMetrics, getOrganizationMetrics } from '../services/analyticsAPI';
```

### Best Practices

1. Import only what you need - avoid importing everything from a module
2. Use consistent naming across imports
3. Group related imports together
4. Keep imports at the top of the file
5. Use relative paths consistently 

## Common API Errors and Solutions

### Authentication Errors

1. Invalid Token (401 Unauthorized)
```
Error: Invalid or expired JWT token
Solution: 
1. Check token expiration
2. Use refresh token to get new access token
3. Re-authenticate if refresh token expired
```

2. Missing Token (401 Unauthorized)
```
Error: No authorization token provided
Solution:
1. Check if token is included in Authorization header
2. Ensure format is "Bearer <token>"
3. Verify token is being set after login
```

3. Invalid Permissions (403 Forbidden)
```
Error: Insufficient permissions
Solution:
1. Verify user role matches required permissions
2. Check organization context
3. Review access control settings
```

### Database Connection Errors

1. Connection Timeout
```
Error: Database connection timeout
Solution:
1. Check database connection string
2. Verify database server is running
3. Check network connectivity
4. Review connection pool settings
```

2. Query Timeout
```
Error: Query execution timeout
Solution:
1. Optimize query performance
2. Add appropriate indexes
3. Review query timeout settings
4. Consider query pagination
```

### API Request Errors

1. Rate Limit Exceeded (429 Too Many Requests)
```
Error: Too many requests
Solution:
1. Implement request throttling
2. Cache frequently requested data
3. Review rate limit settings
```

2. Invalid Input (400 Bad Request)
```
Error: Invalid request parameters
Solution:
1. Validate input data format
2. Check required fields
3. Verify data types
4. Review API documentation
```

3. Resource Not Found (404 Not Found)
```
Error: Resource not found
Solution:
1. Verify resource ID exists
2. Check URL parameters
3. Confirm access permissions
4. Review database records
```

### Multi-tenant Errors

1. Organization Context Missing
```
Error: Organization context not set
Solution:
1. Set organization ID in request context
2. Verify organization exists
3. Check user-organization association
```

2. Cross-Organization Access
```
Error: Unauthorized cross-organization access
Solution:
1. Verify user belongs to organization
2. Check resource ownership
3. Review organization boundaries
```

### Frontend Integration Errors

1. CORS Issues
```
Error: Cross-Origin Resource Sharing error
Solution:
1. Configure CORS headers
2. Add origin to allowed list
3. Check request credentials
```

2. API Version Mismatch
```
Error: Incompatible API version
Solution:
1. Check API version headers
2. Update client version
3. Review API compatibility
```

### Debugging Tips

1. Error Logging
```javascript
// Implement structured logging
logger.error('Operation failed', {
  error: err.message,
  stack: err.stack,
  context: {
    userId,
    organizationId,
    operation
  }
});
```

2. Error Monitoring
```javascript
// Set up error alerts
monitor.onError(error => {
  if (error.severity === 'high') {
    notifyTeam(error);
  }
});
```

3. Error Recovery
```javascript
// Implement retry logic
async function withRetry(operation, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (err) {
      if (i === maxRetries - 1) throw err;
      await delay(Math.pow(2, i) * 1000);
    }
  }
}
``` 

---

## Service Module Import/Export Errors

**Error Message:**
```
Uncaught SyntaxError: The requested module '/src/services/authAPI.js' does not provide an export named 'default'
```

**Cause:**
- Attempting to import a default export from a service file (e.g., authAPI.js) that only provides named exports.

**Resolution Steps:**
1. Always use named imports for service modules unless a default export is explicitly provided.
   - Example (correct):
     ```js
     import { resetPassword } from '../../services/authAPI';
     ```
   - Example (incorrect):
     ```js
     import authAPI from '../../services/authAPI'; // ❌ No default export
     ```
2. Audit all service imports in the codebase to ensure only named imports are used.
3. Add an ESLint rule to prevent default imports from files that only have named exports (see below).

**Permanent Prevention:**
- Enforce the following ESLint rule in your .eslintrc configuration:
  ```json
  {
    "rules": {
      "import/no-default-export": ["error"]
    }
  }
  ```
- This will prevent accidental default imports in the future.

**Date Logged:** 2024-07-09 

## [DATE] - Login Endpoint 404 and Infinite Auth Loop

**Issue:**
- The frontend was calling `/login` instead of `/api/auth/login`, resulting in 404 errors from the Vite dev server and an infinite authentication loop.

**Root Cause:**
- The login API call used a relative path (`/login`) that was not proxied to the backend, so the request never reached the Node.js server.

**Solution:**
- Updated all frontend login calls to use `/api/auth/login` via the shared axios instance (`api.js`).
- Ensured all authentication endpoints use the `/api/auth/` prefix for clarity and security.

**Prevention:**
- Always use the `/api` prefix for backend API calls in the frontend.
- Use a shared axios instance with a base URL of `/api` and route all API requests through it.
- Documented this error to avoid recurrence.

---

## [DATE] - Missing forgotPassword Export in authAPI.js

**Issue:**
- The frontend tried to import 'forgotPassword' from 'authAPI.js', but it was not exported, causing a runtime error and breaking the Forgot Password page.

**Root Cause:**
- The forgotPassword function was removed or not re-implemented in 'authAPI.js' after refactoring, but JSX files still tried to import and use it.

**Solution:**
- Re-implement the 'forgotPassword' function in 'authAPI.js' to call the backend '/auth/forgot-password' endpoint using the shared axios instance.
- Audit all JSX files for similar missing exports and ensure all used auth functions are implemented and exported.

**Prevention:**
- When refactoring or removing exports from shared service files, always check for imports/usages across the codebase.
- Add tests or lint rules to catch missing exports before runtime.

---

## React Router Nested Router Error

### Error Message:
```
Uncaught Error: You cannot render a <Router> inside another <Router>. You should never have more than one in your app.
```

### Cause:
- Multiple <BrowserRouter> or <Router> components rendered in the React component tree. This usually happens when <BrowserRouter> is used in both main.jsx (entry point) and again in App.jsx or a layout/page component.

### Resolution Steps:
1. Ensure that <BrowserRouter> (or <Router>) is only used once, typically in client/src/main.jsx wrapping <App />.
2. Remove any <BrowserRouter> or <Router> from App.jsx and all child components. Only use <Routes>, <Route>, and router hooks (useNavigate, useLocation, etc.) inside components.
3. In this project, the fix was to remove the nested <BrowserRouter as Router> from App.jsx and rely solely on the top-level <BrowserRouter> in main.jsx.

**Reference commit:** [See App.jsx and main.jsx for correct usage.]

### Prevention:
- Always wrap your app in a single <BrowserRouter> at the entry point (main.jsx).
- Never use <BrowserRouter> or <Router> in App.jsx, Layout.jsx, or any child component.
- Use only <Routes>, <Route>, and router hooks in components.

---

## JWT Payload Mismatch (401 Loop)

### Error Message:
```
401 Unauthorized - jwt malformed
```

### Cause:
- The backend was using decoded.userId to look up the user, but the JWT payload used id. This caused all authenticated requests to fail with 401 errors.

### Resolution Steps:
- Updated the isAuthenticated middleware in server/src/middleware/auth.js to use decoded.id for user lookup instead of decoded.userId.

---

## Port Already in Use (Service Management)

### Error Message:
```
Error: Port 3001 is already in use
Error: Port 5000 is already in use
```

### Cause:
- Previous server/client instance still running, or another application using the same port.

### Resolution Steps:
- Kill existing processes using:
  ```bash
  lsof -ti:5000,3001 | xargs kill -9
  ```
- Always check if ports 3001 (client) and 5000 (server) are free before starting services.
- Restart the client and server after ensuring ports are available.

---

## Dashboard Metrics 404 Error

### Error Message:
```
GET /api/dashboard/metrics 404
GET /api/dashboard/projects/metrics 404
GET /api/dashboard/tasks/metrics 404
GET /api/dashboard/financial/metrics 404
GET /api/dashboard/clients/metrics 404
```

### Cause:
- The frontend dashboard expected endpoints like `/api/dashboard/metrics` and related `/metrics` endpoints for projects, tasks, financials, and clients.
- The backend did not implement these endpoints, resulting in repeated 404 errors and a non-functional dashboard.

### Resolution Steps:
1. Implemented the following endpoints in `server/src/routes/dashboard.js`:
   - `GET /metrics`
   - `GET /projects/metrics`
   - `GET /tasks/metrics`
   - `GET /financial/metrics`
   - `GET /clients/metrics`
2. Each endpoint returns sample JSON data for now, matching the frontend's expected structure.
3. Registered these endpoints in the main router.

### Result:
- Dashboard metrics and widgets now load successfully for all users.
- Sidebar navigation and dashboard functionality are restored.

## [2024-07-15] Fix: MUI Select Out-of-Range and Controlled/Uncontrolled Input Warnings in Super Admin Users Page

**Symptoms:**
- MUI warning: You have provided an out-of-range value `SUPER_ADMIN` for the select component. The available values are `ORG_ADMIN`, `USER`, `VIEWER`.
- MUI warning: You have provided an out-of-range value `null` for the select component. The available values are organization IDs.
- React warning: A component is changing an uncontrolled input to be controlled.

**Root Cause:**
- The role select did not include `SUPER_ADMIN` as an option, but some users have this value.
- The organization select did not handle `null`/empty values (e.g., for super admins with no org).
- Some select/input values could be `null` or `undefined`.

**Resolution:**
- Always include `SUPER_ADMIN` in the allowedRoles for display, but disable editing for SUPER_ADMIN users.
- Add a 'No Organization' option (value: '') to the organization select, and handle null/empty orgId gracefully.
- Ensure all select/input values are always defined (never null/undefined).
- See code comments in `client/src/components/SuperAdmin/Users/UsersPage.jsx` for details.

---

## Issue: Persistent `Spinner` Export Error

**Date:** 2024-07-18

**Error Message:** `[plugin:vite:react-babel] /Users/duke/Desktop/CRM Project/client/src/components/UI/Spinner.jsx: 'Spinner' has already been exported. Exported identifiers must be unique. (7:9)`

**Root Cause:**
The application had two spinner components, `Spinner.jsx` and `LoadingSpinner.jsx`, in the `client/src/components/UI` directory. An `index.js` file in the same directory was attempting to export both, which caused a conflict. This issue was compounded by inconsistent import paths, with some files using `ui` and others using `UI`.

**Solution:**
The issue was resolved by taking the following steps:
1.  Consolidated the two spinner components into a single, well-defined component in `client/src/components/UI/Spinner.jsx`.
2.  Deleted the redundant `client/src/components/UI/LoadingSpinner.jsx` file.
3.  Deleted the conflicting `client/src/components/UI/index.js` file.
4.  Updated all files that were importing the old spinner components to use the new, consolidated one with a consistent import path (`'../UI/Spinner'`).
