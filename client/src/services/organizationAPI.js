import { api } from "./api";

// SuperAdmin Organization Endpoints
export const getAllOrganizationsAdmin = async () => {
  return api.get("/super-admin/organizations");
};

export const createOrganizationAdmin = async (data) => {
  return api.post("/super-admin/organizations", data);
};

export const updateOrganizationAdmin = async (id, data) => {
  return api.put(`/super-admin/organizations/${id}`, data);
};

export const deleteOrganizationAdmin = async (id) => {
  return api.delete(`/super-admin/organizations/${id}`);
};

// Regular Organization Endpoints
// Utility to safely extract organizations array from API response
export function extractOrganizationsArray(response) {
  if (response && response.data) {
    if (Array.isArray(response.data)) return response.data;
    if (Array.isArray(response.data.data)) return response.data.data;
  }
  return [];
}

// Get all organizations (returns array directly)
export const getOrganizations = async (includeInactive = false) => {
  const response = await api.get(
    `/organizations?includeInactive=${includeInactive}`,
  );
  return extractOrganizationsArray(response);
};

// Get a single organization
export const getOrganization = async (id) => {
  return api.get(`/organizations/${id}`);
};

// Create a new organization
export const createOrganization = async (data) => {
  return api.post("/organizations", data);
};

// Update an organization
export const updateOrganization = async (id, data) => {
  return api.put(`/organizations/${id}`, data);
};

// Delete an organization
export const deleteOrganization = async (id) => {
  return api.delete(`/organizations/${id}`);
};

// Set current organization context
export const setCurrentOrganization = async (id) => {
  return api.post("/organizations/set-current", { organizationId: id });
};

// Get organization settings
export const getOrganizationSettings = async (id) => {
  return api.get(`/organizations/${id}/settings`);
};

// Update organization settings
export const updateOrganizationSettings = async (id, settings) => {
  return api.put(`/organizations/${id}/settings`, settings);
};

// Get organization system metrics
export const getOrganizationSystem = async (id) => {
  return api.get(`/organizations/${id}/system`);
};
