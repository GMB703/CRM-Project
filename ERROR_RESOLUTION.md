---

## [DATE: 2024-07-09] React Query Error: No QueryClient set

### **Issue**
- Error: `Uncaught Error: No QueryClient set, use QueryClientProvider to set one` in components using React Query hooks (e.g., OrganizationsPage).
- The app crashed or failed to render pages using React Query.

### **Root Cause**
- The app was using React Query hooks (like `useQuery`) without being wrapped in a `<QueryClientProvider>`, which is required for React Query to function.

### **Resolution**
- Updated `client/src/main.jsx` to import `QueryClient` and `QueryClientProvider` from `@tanstack/react-query`.
- Created a `queryClient` instance and wrapped the app root with `<QueryClientProvider client={queryClient}>`.
- This enables React Query throughout the app and resolves the error.

### **Permanent Prevention**
- Always wrap your app (or any subtree using React Query hooks) in a `QueryClientProvider`.
- If you add new entry points or layouts, ensure the provider is present.

### **Status**
- **RESOLVED**. React Query is now fully enabled and the error will not recur. 

---

## [DATE: 2024-07-09] 404 Error: /api/api/users (Double Prefix)

### **Issue**
- Error: `GET http://localhost:3001/api/api/users 404 (Not Found)` when loading the Users page as Super Admin.
- The frontend was requesting `/api/api/users` instead of `/api/users`.

### **Root Cause**
- The axios instance in `client/src/services/api.js` already uses `/api` as its base URL.
- The user API endpoints in `client/src/services/userAPI.js` were incorrectly using `/api/users`, resulting in a double prefix (`/api/api/users`).

### **Resolution**
- Updated all user API endpoints in `userAPI.js` to use `/users` (not `/api/users`).
- This ensures the correct path (`/api/users`) is used for all user-related requests.

### **Permanent Prevention**
- Always check the axios base URL before adding prefixes to endpoint paths.
- Document the base URL usage in API service files for clarity.

### **Status**
- **RESOLVED**. Users API endpoints now work correctly and the 404 error is gone. 

---

## [DATE: 2024-07-09] 404 Error: /api/users (Route Not Mounted)

### **Issue**
- Error: `GET http://localhost:3001/api/users 404 (Not Found)` when loading the Users page as Super Admin.
- The backend was not serving the /api/users endpoint, resulting in a 404 error for all user API requests.

### **Root Cause**
- The users route file (`server/src/routes/users.js`) was not imported or mounted in the main server entry point (`server/src/index.js`).

### **Resolution**
- Imported `usersRoutes` in `server/src/index.js`.
- Mounted it at `/api/users` with the `isAuthenticated` middleware:
  ```js
  import usersRoutes from './routes/users.js';
  app.use('/api/users', isAuthenticated, usersRoutes);
  ```
- This enables all user API endpoints at `/api/users`.

### **Permanent Prevention**
- Always import and mount new route files in the main server entry point.
- Document the route registration process in backend guidelines.

### **Status**
- **RESOLVED**. The Users API is now available and the 404 error is gone. 

---

## [DATE: 2024-07-09] TypeError: users.map is not a function in UsersPage

### **Issue**
- Error: `Uncaught TypeError: users.map is not a function` in `UsersPage.jsx` when loading the Super Admin Users page.
- The frontend expected `getUsers()` to return an array, but received an object (the full Axios response or a nested object).

### **Root Cause**
- The backend returns `{ data: usersArray }`, but the frontend's `getUsers` in `userAPI.js` returned the full Axios response, not the array.
- `UsersPage.jsx` called `.map` on the result, causing a runtime error if the structure was not an array.

### **Resolution**
- Updated `getUsers` in `userAPI.js` to always extract and return the users array directly, using a utility function for safety.
- Updated `UsersPage.jsx` to expect an array from `getUsers`, not an object with `.data`.
- This prevents `.map` errors and ensures robust, future-proof data handling.

### **Permanent Prevention**
- Always return arrays directly from API service functions when the frontend expects them.
- Use utility functions to safely extract arrays from API responses.
- Documented this pattern for all future API integrations. 

---

## [DATE: 2024-07-09] Organizations Dropdown Not Populating in Create User (Super Admin)

### **Issue**
- When creating a user as Super Admin, the organizations dropdown was empty.
- This prevented assigning a user to an organization.

### **Root Cause**
- The UsersPage component used `getOrganizations(true)`, which calls the regular organizations endpoint.
- For Super Admin, the correct endpoint is `/super-admin/organizations`, accessed via `getAllOrganizationsAdmin`.
- The regular endpoint may not return all organizations or may be restricted by tenant context.

### **Resolution**
- Updated UsersPage to use `getAllOrganizationsAdmin()` for loading organizations in Super Admin context.
- The organizations dropdown is now always populated with all organizations for user creation.

### **Permanent Prevention**
- Always use the dedicated Super Admin endpoints for organization/user management in Super Admin views.
- Documented this pattern for all future Super Admin features. 

---

## [DATE: 2024-07-09] Add Organization Button Not Working in Super Admin Organizations Page

### **Issue**
- The Add Organization button did not open a dialog or allow creation of new organizations.
- There was no UI or logic implemented for adding organizations.

### **Root Cause**
- The button's onClick handler was a placeholder with no dialog, form, or API call.
- No state or mutation logic existed for organization creation.

### **Resolution**
- Implemented a modern MUI dialog that opens when Add Organization is clicked.
- Added a form for organization name and code, with validation and error handling.
- On submit, the form calls `createOrganizationAdmin` and refreshes the organizations list on success.
- UI and logic are consistent with the rest of the app and robust against errors.

### **Permanent Prevention**
- Always implement and test full CRUD flows for admin management pages.
- Documented this pattern for all future admin features. 

---

## [DATE: 2024-07-09] ESM Import/Export Errors and Port Conflicts

### **Issue**
- Backend failed to start due to mixed CommonJS/ESM syntax in `users.js` (require/module.exports used in ES module project).
- Client or server failed to start due to ports 3001 or 5000 already in use, causing ECONNREFUSED and proxy errors in the frontend.

### **Root Cause**
- `server/package.json` uses `"type": "module"`, so all backend files must use ES module syntax (`import`/`export default`).
- Stuck processes on ports 3001/5000 prevented clean startup.

### **Resolution**
- Converted `server/src/routes/users.js` to pure ES module syntax (no require/module.exports, only import/export default).
- Always kill all processes on ports 3001 and 5000 before running `npm run dev`.

### **Permanent Prevention**
- All backend files must use ES module syntax. Never use require/module.exports in this project.
- Always check and free ports 3001 and 5000 before starting the dev environment.
- Documented this pattern for all future contributors. 

---

## [DATE: 2024-07-09] Analytics Dashboard 404 Error (Double /api Prefix)

### **Issue**
- The Super Admin Analytics Dashboard failed to load analytics data, showing 404 errors for `/api/api/analytics/system`.
- The frontend was requesting analytics endpoints with a double `/api` prefix, resulting in 404 Not Found errors from the backend.

### **Root Cause**
- The axios instance in `client/src/services/api.js` already uses `/api` as its base URL.
- The analytics API service (`analyticsAPI.js`) incorrectly used `/api/analytics/...` as the endpoint, causing requests to `/api/api/analytics/...`.

### **Resolution**
- Updated all analytics API endpoints in `analyticsAPI.js` to use `/analytics/...` (not `/api/analytics/...`).
- This ensures requests go to the correct backend route (e.g., `/api/analytics/system`).

### **How the Analytics Dashboard Works**
- On load, the dashboard calls analytics endpoints (e.g., `/api/analytics/system`) to fetch system-wide metrics for super admin.
- The backend route `/api/analytics/system` is protected and returns aggregated data (user counts, org stats, etc.).
- The dashboard displays this data in summary cards, charts, or tables for super admin oversight.

### **Permanent Prevention**
- Always use relative paths (no leading `/api`) in frontend API services when using a base URL.
- Documented this pattern for all future analytics and admin features. 