import api from './api';

// Auth API functions
export const loginAPI = async (credentials) => {
  try {
    const response = await api.post('/auth/login', credentials);
    
    if (response.data.success) {
      const { token, refreshToken, user } = response.data;
      
      // Store tokens
      localStorage.setItem('token', token);
      if (refreshToken) {
        localStorage.setItem('refreshToken', refreshToken);
      }
      
      // Store organization context if available
      if (user.organizationId) {
        localStorage.setItem('organizationId', user.organizationId);
      }
      
      return response.data;
    } else {
      throw new Error(response.data.message || 'Login failed');
    }
  } catch (error) {
    throw new Error(error.response?.data?.message || error.message || 'Login failed');
  }
};

export const logoutAPI = async () => {
  try {
    await api.post('/auth/logout');
  } catch (error) {
    console.error('Logout API error:', error);
    // Don't throw error for logout - always clean local storage
  } finally {
    // Always clear local storage
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('organizationId');
  }
};

export const forgotPasswordAPI = async (email) => {
  try {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || error.message || 'Failed to send reset email');
  }
};

export const resetPasswordAPI = async (token, password) => {
  try {
    const response = await api.post('/auth/reset-password', { token, password });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || error.message || 'Failed to reset password');
  }
};

export const getCurrentUserAPI = async () => {
  try {
    const response = await api.get('/auth/me');
    if (response.data.success) {
      return response.data.user;
    } else {
      throw new Error(response.data.message || 'Failed to get user data');
    }
  } catch (error) {
    throw new Error(error.response?.data?.message || error.message || 'Failed to get user data');
  }
};

export const refreshTokenAPI = async () => {
  try {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await api.post('/auth/refresh', {
      refreshToken,
      organizationId: localStorage.getItem('organizationId')
    });

    if (response.data.success) {
      const { token } = response.data;
      localStorage.setItem('token', token);
      return token;
    } else {
      throw new Error(response.data.message || 'Token refresh failed');
    }
  } catch (error) {
    // Clear all auth data on refresh failure
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('organizationId');
    throw new Error(error.response?.data?.message || error.message || 'Token refresh failed');
  }
};

export default api; 