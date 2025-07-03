# CRM System Error Solutions and Fixes

This document tracks all critical errors encountered and their solutions to prevent future occurrences.

## Table of Contents
1. [Authentication Issues](#authentication-issues)
2. [SuperAdmin Architecture](#superadmin-architecture)
3. [Organization Context Issues](#organization-context-issues)
4. [API Export Errors](#api-export-errors)
5. [Theme Provider Issues](#theme-provider-issues)
6. [Server Configuration](#server-configuration)
7. [Missing Dependencies and Import Errors](#missing-dependencies-and-import-errors)
8. [Vite Import Resolution](#vite-import-resolution)

---

## Vite Import Resolution 

### Issue: Failed to resolve import errors during development
**Error**: `[vite:import-analysis] Failed to resolve import "../config" from "src/services/authAPI.js"`

**Root Cause**: Multiple import patterns and inconsistent API instance usage between service files
- `authAPI.js` was creating its own axios instance with interceptors
- `organizationAPI.js` was using the shared `api` instance
- Duplicate interceptors causing conflicts
- Missing config file references

**Solution**: 
1. **Standardize API Usage**: All API services should use the shared `api` instance from `services/api.js`
2. **Remove Duplicate Interceptors**: Only the main `api.js` should have request/response interceptors
3. **Consistent Import Patterns**: Use relative imports consistently across all service files

**Code Changes**:
```javascript
// ❌ WRONG - Creating duplicate axios instance
import axios from 'axios';
import { API_URL } from '../config';
const api = axios.create({ baseURL: API_URL });

// ✅ CORRECT - Use shared api instance
import api from './api';
```

**Files Modified**:
- `client/src/services/authAPI.js` - Removed duplicate axios instance and interceptors
- `client/src/services/organizationAPI.js` - Already using shared instance correctly
- `client/src/config.js` - Created with proper API_URL export

**Prevention**:
- Always use the shared `api` instance from `services/api.js`
- Never create multiple axios instances with interceptors
- Keep API configuration centralized in `api.js`

---

## Organization Context Issues

### Issue: 401 Unauthorized errors on organization endpoints before login
**Error**: `Failed to load resource: the server responded with a status of 401 (Unauthorized)`
**Location**: `OrganizationContext.jsx:51`

**Root Cause**: OrganizationContext was trying to load organizations immediately on app load, even when users weren't authenticated

**Solution**: 
1. **Conditional Loading**: Only load organizations when user is authenticated
2. **Auth State Dependencies**: Use auth state to trigger organization loading
3. **Proper Error Handling**: Clear organization data when not authenticated
4. **SuperAdmin Support**: Handle SuperAdmin users who may not have a default organization

**Code Changes**:
```javascript
// ✅ CORRECT - Only load when authenticated
const loadOrganizations = async () => {
  if (!isAuthenticated || !user) {
    return; // Exit early if not authenticated
  }
  // ... rest of loading logic
};

// ✅ CORRECT - Clear data when not authenticated
const initializeOrganization = async () => {
  if (isAuthenticated && user) {
    await loadOrganizations();
  } else {
    // Clear organization data when not authenticated
    setOrganizations([]);
    setCurrentOrganizationState(null);
    setLoading(false);
    setError(null);
  }
};
```

**Prevention**:
- Always check authentication state before making API calls
- Use auth state changes as triggers for data loading
- Clear sensitive data when authentication state changes

---

## SuperAdmin Architecture

### Critical Understanding: User Role Hierarchy

**NEVER modify the SuperAdmin privileges without understanding the complete role hierarchy:**

```
SUPER_ADMIN > ADMIN > OWNER > USER
```

### Organization Switching Privileges

**WHO CAN SWITCH ORGANIZATIONS:**
- **SUPER_ADMIN**: Can switch between ANY organization - this is their primary function
- **ADMIN/OWNER**: Cannot switch organizations - they are bound to their assigned organization  
- **USER**: Cannot switch organizations - they are bound to their assigned organization

**CODE IMPLEMENTATION:**
```javascript
// ✅ CORRECT - Only SuperAdmin can switch organizations
const canSwitch = user?.role === 'SUPER_ADMIN';

// ❌ WRONG - Don't allow regular admins to switch
const canSwitch = user?.role === 'ADMIN' || user?.role === 'OWNER';
```

**COMPONENTS AFFECTED:**
- `OrganizationSelector.jsx` - Shows dropdown only for SUPER_ADMIN
- `OrganizationSwitcher.jsx` - Full functionality only for SUPER_ADMIN  
- `Sidebar.jsx` - SuperAdmin menu items only for SUPER_ADMIN

**SERVER ROUTES:**
- `/api/super-admin/*` - Only accessible by SUPER_ADMIN users
- `/api/admin/*` - Accessible by ADMIN, OWNER, and SUPER_ADMIN within their organization
- `/api/organizations/switch` - Only accessible by SUPER_ADMIN

### SuperAdmin vs Admin Distinction

**SuperAdmin Features:**
- Cross-organization access and management
- Can create/modify/delete organizations
- Can assign users to organizations
- Can switch between any organization context
- Has access to system-wide analytics and settings

**Regular Admin Features:**
- Organization-bound administration
- Can manage users within their organization only
- Can view organization-specific analytics
- Cannot switch to other organizations
- Cannot modify organization structure

---

## Missing Dependencies and Import Errors

### Issue: Missing config file
**Error**: `Failed to resolve import "../config" from "src/services/authAPI.js"`

**Root Cause**: Multiple service files were trying to import a config file that didn't exist

**Solution**: Created `client/src/config.js` with proper exports
```javascript
// client/src/config.js
export const API_URL = '/api'; // Use proxy path for development
export const APP_NAME = 'CRM System';
export const VERSION = '1.0.0';
```

**Prevention**: 
- Maintain centralized configuration
- Use consistent import paths
- Document all shared configuration files

### Issue: Missing UI components
**Error**: `Failed to resolve import "../ui/Spinner" from "src/components/Admin/AdminDashboard.jsx"`

**Root Cause**: Component was trying to import a non-existent Spinner component

**Solution**: Use existing LoadingSpinner component consistently
```javascript
// ✅ CORRECT
import LoadingSpinner from '../UI/LoadingSpinner';

// ❌ WRONG  
import { Spinner } from '../ui/Spinner';
```

**Prevention**:
- Use existing UI components before creating new ones
- Maintain a UI component inventory
- Use consistent import paths for UI components

---

## Authentication Issues

### Issue: Refresh token mechanism conflicts
**Error**: Multiple token refresh attempts causing auth loops

**Root Cause**: 
- Duplicate axios interceptors in different service files
- Inconsistent token storage/retrieval patterns
- Circular dependency in auth refresh logic

**Solution**:
1. **Single Source of Truth**: Only `api.js` should have auth interceptors
2. **Consistent Storage**: Use localStorage consistently for token management
3. **Clean Refresh Logic**: Separate refresh functionality from general API calls

**Code Pattern**:
```javascript
// ✅ CORRECT - In api.js only
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 && !error.config._retry) {
      error.config._retry = true;
      // Handle refresh logic
    }
    return Promise.reject(error);
  }
);
```

**Prevention**:
- Never add auth interceptors to service-specific API instances
- Keep auth logic centralized in the main API instance
- Use consistent error handling patterns

---

## Server Configuration

### Issue: Server crashing due to missing exports
**Error**: `ReferenceError: superAdminRoutes is not defined`

**Root Cause**: Import/export mismatches between route files and main server file

**Solution**: Ensure all route imports match their exports
```javascript
// ✅ CORRECT - server/src/index.js
import superAdminRoutes from './routes/superAdmin.js';
app.use('/api/super-admin', superAdminRoutes);
```

**Prevention**:
- Verify all route file exports before importing
- Use consistent ES6 export/import syntax
- Test server startup after any route changes

---

## API Export Errors

### Issue: Missing named exports from API modules
**Error**: `authAPI is not exported from 'services/authAPI.js'`

**Root Cause**: Inconsistent export patterns between API service files

**Solution**: Use consistent named exports
```javascript
// ✅ CORRECT
export const loginAPI = async (credentials) => { /* ... */ };
export const logoutAPI = async () => { /* ... */ };
export default api;
```

**Prevention**:
- Use named exports for all API functions
- Keep default export for the API instance
- Document all exported functions

---

## Theme Provider Issues

### Issue: useTheme hook used outside provider
**Error**: `useTheme must be used within a ThemeProvider`

**Root Cause**: Component using theme hook before ThemeProvider was mounted

**Solution**: Ensure provider hierarchy in App.jsx
```javascript
// ✅ CORRECT - App.jsx
<ThemeProvider>
  <OrganizationProvider>
    <Routes>
      {/* Components can now use useTheme */}
    </Routes>
  </OrganizationProvider>
</ThemeProvider>
```

**Prevention**:
- Always wrap app with required providers
- Test provider hierarchy after any routing changes
- Document provider dependencies

---

## Prevention Guidelines

### Development Workflow
1. **Before Making Changes**: Check existing patterns and imports
2. **After API Changes**: Test both authenticated and unauthenticated flows  
3. **Before Committing**: Verify both client and server start without errors
4. **Component Changes**: Ensure all required providers are available

### Code Review Checklist
- [ ] No duplicate API instances or interceptors
- [ ] Consistent import/export patterns
- [ ] Authentication state properly checked before API calls
- [ ] SuperAdmin privileges preserved correctly
- [ ] All route files properly exported and imported
- [ ] Provider hierarchy maintained in App.jsx

### Testing Requirements
- [ ] Login/logout functionality works
- [ ] Organization switching works for SuperAdmin only
- [ ] 401 errors handled gracefully
- [ ] Client starts without import errors
- [ ] Server starts without missing export errors

---

## Common Debugging Commands

```bash
# Check if services are running
curl http://localhost:5000/health
curl -I http://localhost:3001

# Kill conflicting processes
pkill -f "npm run dev"
lsof -ti:3001,5000 | xargs kill -9

# Clean restart both services
cd server && npm run dev &
cd client && npm run dev &

# Test API endpoints
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test","password":"test"}'
```

This comprehensive documentation should prevent these critical errors from recurring. Always refer to this document when making changes to authentication, organization management, or API service files.

**Last Updated**: July 2, 2025
**Version**: 2.0