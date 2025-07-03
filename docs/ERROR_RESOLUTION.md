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