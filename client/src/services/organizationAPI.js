import api from './api';

export const getCurrentOrganization = async () => {
  try {
    const response = await api.get('/organizations/current');
    return response.data;
  } catch (error) {
    if (error.response?.status === 401) {
      // Token expired or invalid, let the interceptor handle refresh
      throw error;
    }
    if (error.response?.status === 403) {
      // Organization access denied
      throw new Error('Organization access denied');
    }
    throw new Error('Failed to fetch organization');
  }
};

export const setCurrentOrganization = async (organizationId) => {
  try {
    const response = await api.post('/organizations/set-current', {
      organizationId
    });
    localStorage.setItem('organizationId', organizationId);
    return response.data;
  } catch (error) {
    localStorage.removeItem('organizationId');
    throw new Error('Failed to set organization');
  }
};

export const getOrganizations = async () => {
  try {
    const response = await api.get('/organizations');
    return response.data;
  } catch (error) {
    throw new Error('Failed to fetch organizations');
  }
}; 