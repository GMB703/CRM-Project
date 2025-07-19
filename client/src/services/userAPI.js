import { api } from "./api";

// Utility to safely extract users array from API response
function extractUsersArray(response) {
  if (response && response.data) {
    if (Array.isArray(response.data)) return response.data;
    if (Array.isArray(response.data.data)) return response.data.data;
  }
  return [];
}

export const getUsers = async () => {
  const response = await api.get("/users");
  return extractUsersArray(response);
};

export const createUser = async (userData) => {
  return api.post('/super-admin/users', userData);
};

export const updateUser = async (id, data) => {
  return api.put(`/users/${id}`, data);
};

export const getUsersByOrganization = async (orgId) => {
  return api.get(`/super-admin/organizations/${orgId}/users`);
};

export const getUserActivitySummary = async () => {
  return api.get('/super-admin/user-activity-summary');
};

export const deleteUser = async (id) => {
  return api.delete(`/users/${id}`);
};

export const toggleUserStatus = async (id) => {
  return api.put(`/users/${id}/toggle-status`);
};

export const getUserById = async (id) => {
  return api.get(`/users/${id}`);
};
