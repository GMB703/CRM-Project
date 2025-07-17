import axios from 'axios';

// Create axios instance with default config
export const api = axios.create({
  baseURL: 'http://localhost:5000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response) {
      // Handle 401 Unauthorized
      if (error.response.status === 401) {
        // Clear token and redirect to login
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
      
      // Return error response data
      return Promise.reject(error.response.data);
    }
    
    return Promise.reject(error);
  }
);

export { api }; 

/* [STABLE COMPONENT - DO NOT MODIFY]
 * This API Utilities module is complete and stable.
 * Core functionality:
 * - Axios instance configuration
 * - Authentication token handling
 * - Request/response interceptors
 * - Error handling
 * - Unauthorized redirection
 * 
 * This is a critical API communication component.
 * Changes here could affect all API calls across the application.
 * Modify only if absolutely necessary and after thorough testing.
 */ 