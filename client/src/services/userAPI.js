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
  return api.post("/users", userData);
};

export const updateUser = async (id, userData) => {
  return api.put(`/users/${id}`, userData);
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
