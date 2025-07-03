# Organization Filtering Test Guide

This document provides comprehensive testing instructions for the multi-tenant organization filtering functionality implemented in the CRM system.

## Overview

The organization filtering system ensures complete data isolation between different organizations using the same CRM instance. This is critical for security, privacy, and compliance in multi-tenant environments.

## Test Coverage

Our test suite covers the following areas:

### 1. Authentication & Organization Context
- ✅ JWT tokens contain organization context
- ✅ Organization-aware login/registration
- ✅ Token validation with organization data

### 2. Route Handler Organization Filtering
- ✅ Chat message routes with organization isolation
- ✅ Project access validation
- ✅ Cross-organization access prevention
- ✅ File upload organization scoping

### 3. Error Handling
- ✅ Organization-specific error responses
- ✅ Proper HTTP status codes
- ✅ Missing organization context handling
- ✅ Invalid organization access attempts

### 4. Data Isolation
- ✅ Complete separation of organization data
- ✅ No cross-contamination between organizations
- ✅ Organization-scoped database queries
- ✅ Message filtering by organization

## Running the Tests

### Prerequisites

1. **Database Setup**: Ensure your database is running and accessible
2. **Server Running**: The API server should be running on `http://localhost:5000` (or set `TEST_BASE_URL` environment variable)
3. **Dependencies**: Install required packages:
   ```bash
   cd server
   npm install axios
   ```

### Running the Automated Test Suite

```bash
# From the server directory
node test-organization-filtering.js
```

### Environment Variables

You can customize the test environment with these variables:

```bash
# Set custom API base URL
TEST_BASE_URL=http://localhost:3001 node test-organization-filtering.js

# Set custom database URL (if needed)
DATABASE_URL=your_test_database_url node test-organization-filtering.js
```

### Expected Output

Successful test run should show:
```
🚀 Starting Organization Filtering Test Suite
============================================================
🧪 [2024-01-01T12:00:00.000Z] Setting up test data 
✅ [2024-01-01T12:00:01.000Z] Test data setup - PASS
🧪 [2024-01-01T12:00:01.000Z] Testing authentication with organization context 
✅ [2024-01-01T12:00:02.000Z] Authentication with organization context - PASS
🧪 [2024-01-01T12:00:02.000Z] Testing chat routes with organization filtering 
✅ [2024-01-01T12:00:03.000Z] Chat routes organization filtering - PASS
🧪 [2024-01-01T12:00:03.000Z] Testing organization-related error handling 
✅ [2024-01-01T12:00:04.000Z] Organization error handling - PASS
🧪 [2024-01-01T12:00:04.000Z] Testing complete data isolation between organizations 
✅ [2024-01-01T12:00:05.000Z] Data isolation between organizations - PASS
🧪 [2024-01-01T12:00:05.000Z] Cleaning up test data 
✅ [2024-01-01T12:00:06.000Z] Test data cleanup - PASS
============================================================
🎉 All organization filtering tests passed!
```

## Manual Testing Scenarios

### Test Case 1: Organization Registration & Login

1. **Register User A in Organization A**:
   ```bash
   curl -X POST http://localhost:5000/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{
       "email": "user-a@example.com",
       "firstName": "User",
       "lastName": "A",
       "password": "TestPassword123!",
       "organizationId": "org-a-id"
     }'
   ```

2. **Register User B in Organization B**:
   ```bash
   curl -X POST http://localhost:5000/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{
       "email": "user-b@example.com",
       "firstName": "User",
       "lastName": "B", 
       "password": "TestPassword123!",
       "organizationId": "org-b-id"
     }'
   ```

3. **Verify Login Returns Organization Context**:
   ```bash
   curl -X POST http://localhost:5000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{
       "email": "user-a@example.com",
       "password": "TestPassword123!"
     }'
   ```

### Test Case 2: Chat Message Organization Isolation

1. **Send Message as User A**:
   ```bash
   curl -X POST http://localhost:5000/api/chat/messages \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer <user-a-token>" \
     -H "X-Organization-ID: <org-a-id>" \
     -d '{
       "content": "Message from Org A",
       "projectId": "<project-a-id>",
       "type": "TEXT"
     }'
   ```

2. **Try to Access Messages as User B** (should fail):
   ```bash
   curl -X GET http://localhost:5000/api/chat/messages/<project-a-id> \
     -H "Authorization: Bearer <user-b-token>" \
     -H "X-Organization-ID: <org-b-id>"
   ```

3. **Verify Error Response**:
   Expected: `404 Not Found` with organization access denied message

### Test Case 3: Error Handling

1. **Request Without Organization Context**:
   ```bash
   curl -X GET http://localhost:5000/api/chat/messages/<project-id> \
     -H "Authorization: Bearer <token>"
   ```
   Expected: `400 Bad Request` - Missing organization context

2. **Request with Invalid Organization**:
   ```bash
   curl -X GET http://localhost:5000/api/chat/messages/<project-id> \
     -H "Authorization: Bearer <token>" \
     -H "X-Organization-ID: invalid-org-id"
   ```
   Expected: `404 Not Found` - Organization not found

## Troubleshooting

### Common Issues

1. **Tests Fail with Database Connection Error**:
   - Verify database is running
   - Check `DATABASE_URL` in your `.env` file
   - Ensure database schema is up to date

2. **Tests Fail with API Connection Error**:
   - Verify server is running on expected port
   - Check `TEST_BASE_URL` environment variable
   - Ensure all required middleware is loaded

3. **Authentication Tests Fail**:
   - Verify JWT secret is configured
   - Check organization middleware is properly loaded
   - Ensure database has organization records

4. **Data Isolation Tests Fail**:
   - Check database service organization filtering
   - Verify middleware is applying organization context
   - Review route handler organization checks

### Debug Mode

Run tests with additional debugging:

```bash
DEBUG=1 node test-organization-filtering.js
```

This will provide more detailed output for troubleshooting failed tests.

## Security Considerations

### What the Tests Verify

- ✅ **No Cross-Organization Data Access**: Users cannot access data from other organizations
- ✅ **Proper Error Messages**: Error responses don't leak sensitive information
- ✅ **Token Validation**: JWT tokens are properly validated with organization context
- ✅ **Database Isolation**: All database queries are organization-scoped
- ✅ **Route Protection**: All routes require proper organization context

### What to Monitor

- **Failed Login Attempts**: Monitor for attempts to access other organizations
- **Cross-Organization Requests**: Log and alert on attempts to access other org data
- **Token Manipulation**: Watch for modified or invalid organization tokens
- **Database Query Patterns**: Ensure all queries include organization filtering

## Integration with CI/CD

Add to your CI/CD pipeline:

```yaml
# Example GitHub Actions step
- name: Run Organization Filtering Tests
  run: |
    cd server
    npm install
    node test-organization-filtering.js
  env:
    DATABASE_URL: ${{ secrets.TEST_DATABASE_URL }}
    TEST_BASE_URL: http://localhost:5000
```

## Conclusion

The organization filtering system provides robust multi-tenant data isolation. Regular testing ensures the security and integrity of the system as new features are added.

For questions or issues with the testing suite, please refer to the implementation details in:
- `server/src/middleware/auth.js` - Organization middleware
- `server/src/services/databaseService.js` - Organization-scoped database operations
- `server/src/middleware/errorHandler.js` - Organization error handling
- `server/src/middleware/organizationErrors.js` - Custom error classes 