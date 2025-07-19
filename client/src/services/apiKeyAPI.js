import { api } from './api';

// Get all API keys
export const getApiKeys = async () => {
  try {
    const response = await api.get('/api-keys');
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Create new API key
export const createApiKey = async (apiKeyData) => {
  try {
    const response = await api.post('/api-keys', apiKeyData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Update API key
export const updateApiKey = async (id, apiKeyData) => {
  try {
    const response = await api.put(`/api-keys/${id}`, apiKeyData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Delete API key
export const deleteApiKey = async (id) => {
  try {
    const response = await api.delete(`/api-keys/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Regenerate API key
export const regenerateApiKey = async (id) => {
  try {
    const response = await api.post(`/api-keys/${id}/regenerate`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Get API key statistics
export const getApiKeyStats = async (id) => {
  try {
    const response = await api.get(`/api-keys/${id}/stats`);
    return response.data;
  } catch (error) {
    throw error;
  }
}; 