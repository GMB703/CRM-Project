import axios from 'axios'

const API_BASE_URL = '/api'  // Use proxy path instead of full URL

// Create axios instance with base URL
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add organization header
api.interceptors.request.use(
  (config) => {
    // Add organization ID from localStorage if available and not super admin
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.role !== 'SUPER_ADMIN') {
      const organizationId = localStorage.getItem('organizationId');
      if (organizationId) {
        config.headers['x-organization-id'] = organizationId;
      }
    }
    
    // Add auth token
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear auth data on unauthorized
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      localStorage.removeItem('organizationId')
      
      // Redirect to login if not already there
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

// Organization service methods
export const organizationService = {
  // Get current organization from JWT token
  getCurrentOrganizationFromToken() {
    try {
      const token = localStorage.getItem('token');
      if (!token) return null;
      
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (!payload.organizationId) return null;
      
      return {
        id: payload.organizationId,
        name: payload.organization?.name,
        code: payload.organization?.code,
        userRole: payload.organizationRole || 'MEMBER'
      };
    } catch (error) {
      console.error('Error parsing organization from token:', error);
      return null;
    }
  },

  // Get current organization from API
  async getCurrentOrganization() {
    try {
      const response = await api.get('/organizations/current');
      return response.data?.data ? {
        success: true,
        data: response.data.data
      } : null;
    } catch (error) {
      // If 403, try to get organization from token as fallback
      if (error.response?.status === 403) {
        const tokenOrg = this.getCurrentOrganizationFromToken();
        if (tokenOrg) {
          return {
            success: true,
            data: tokenOrg
          };
        }
      }
      throw error;
    }
  },

  // Get available organizations (super admin only)
  async getAvailableOrganizations() {
    const response = await api.get('/organizations/available');
    return response.data;
  },

  // Switch organization context (super admin only)
  async switchOrganization(organizationId) {
    const response = await api.post('/auth/switch-organization', {
      organizationId
    });
    
    // If successful, update localStorage and return unwrapped data
    if (response.data?.data?.token) {
      const token = response.data.data.token;
      localStorage.setItem('token', token);
      
      // Update axios default headers
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Update organization context in localStorage only if not super admin
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (user.role !== 'SUPER_ADMIN') {
        if (response.data.data.organization) {
          localStorage.setItem('organizationId', response.data.data.organization.id);
        } else {
          localStorage.setItem('organizationId', organizationId);
        }
      } else {
        // For super admin, remove any stored organizationId
        localStorage.removeItem('organizationId');
      }
      
      // Update user data if provided
      if (response.data.data.user) {
        localStorage.setItem('user', JSON.stringify(response.data.data.user));
      }
    }
    
    return response.data;
  }
};

export const dashboardService = {
  // Get dashboard overview data
  async getDashboardOverview() {
    const response = await api.get('/dashboard/overview');
    return response.data?.data || response.data;
  },

  // Get project pipeline data
  async getPipeline() {
    const response = await api.get('/dashboard/pipeline');
    return response.data?.data || response.data;
  },

  // Get revenue analytics
  async getRevenueAnalytics(period = 'month') {
    const response = await api.get(`/dashboard/revenue?period=${period}`);
    return response.data?.data || response.data;
  },

  // Get task analytics
  async getTaskAnalytics() {
    const response = await api.get('/dashboard/tasks');
    return response.data?.data || response.data;
  }
};

export default api 