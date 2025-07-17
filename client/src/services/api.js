import axios from "axios";

const API_BASE_URL = "/api"; // Use proxy path instead of full URL

// Create axios instance with base URL
export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add organization header
api.interceptors.request.use(
  (config) => {
    // Add organization ID from localStorage if available and not super admin
    let user = {};
    try {
      const userStr = localStorage.getItem("user");
      if (userStr) {
        user = JSON.parse(userStr);
      }
    } catch (error) {
      console.warn("Failed to parse user from localStorage:", error);
    }

    if (user.role !== "SUPER_ADMIN") {
      const organizationId = localStorage.getItem("organizationId");
      if (organizationId) {
        config.headers["x-organization-id"] = organizationId;
      }
    }

    // Add auth token
    const token = localStorage.getItem("token");
    // Debug log: token attached to request
    console.log("[Axios Interceptor] Attaching token to request:", token);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear auth data on unauthorized
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("organizationId");

      // Redirect to login if not already there
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  },
);

// Organization service methods
export const getCurrentOrganizationFromToken = () => {
  try {
    const token = localStorage.getItem("token");
    if (!token) return null;

    const payload = JSON.parse(atob(token.split(".")[1]));
    if (!payload.organizationId) return null;

    return {
      id: payload.organizationId,
      name: payload.organization?.name,
      code: payload.organization?.code,
      userRole: payload.organizationRole || "MEMBER",
    };
  } catch (error) {
    console.error("Error parsing organization from token:", error);
    return null;
  }
};

// Get current organization from API
export const getCurrentOrganization = async () => {
  try {
    const response = await api.get("/organizations/current");
    return response.data?.data
      ? {
          success: true,
          data: response.data.data,
        }
      : null;
  } catch (error) {
    // If 403, try to get organization from token as fallback
    if (error.response?.status === 403) {
      const tokenOrg = getCurrentOrganizationFromToken();
      if (tokenOrg) {
        return {
          success: true,
          data: tokenOrg,
        };
      }
    }
    throw error;
  }
};

// Get available organizations (super admin only)
export const getAvailableOrganizations = async () => {
  const response = await api.get("/organizations/available");
  return response.data;
};

// Switch organization context (super admin only)
export const switchOrganization = async (organizationId) => {
  const response = await api.post("/auth/switch-organization", {
    organizationId,
  });

  // If successful, update localStorage and return unwrapped data
  if (response.data?.data?.token) {
    const token = response.data.data.token;
    localStorage.setItem("token", token);

    // Update axios default headers
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;

    // Update organization context in localStorage only if not super admin
    let user = {};
    try {
      const userStr = localStorage.getItem("user");
      if (userStr) {
        user = JSON.parse(userStr);
      }
    } catch (error) {
      console.warn("Failed to parse user from localStorage:", error);
    }

    if (user.role !== "SUPER_ADMIN") {
      if (response.data.data.organization) {
        localStorage.setItem(
          "organizationId",
          response.data.data.organization.id,
        );
      } else {
        localStorage.setItem("organizationId", organizationId);
      }
    } else {
      // For super admin, remove any stored organizationId
      localStorage.removeItem("organizationId");
    }

    // Update user data if provided
    if (response.data.data.user) {
      localStorage.setItem("user", JSON.stringify(response.data.data.user));
    }
  }

  return response.data;
};

// Dashboard service methods
export const getDashboardOverview = async () => {
  const response = await api.get("/dashboard/overview");
  return response.data?.data || response.data;
};

export const getPipeline = async () => {
  const response = await api.get("/dashboard/pipeline");
  return response.data?.data || response.data;
};

export const getRevenueAnalytics = async (period = "month") => {
  const response = await api.get(`/dashboard/revenue?period=${period}`);
  return response.data?.data || response.data;
};

export const getTaskAnalytics = async () => {
  const response = await api.get("/dashboard/tasks");
  return response.data?.data || response.data;
};

/* [STABLE COMPONENT - DO NOT MODIFY]
 * This API service configuration is complete and stable.
 * Core functionality:
 * - Axios instance configuration
 * - Request/response interceptors
 * - Token management
 * - Organization context handling
 * - Error handling and auto-logout
 * - Dashboard service methods
 *
 * This is the main API service that handles all HTTP requests.
 * Changes here could affect all API communications and authentication.
 * Modify only if absolutely necessary and after thorough testing.
 */
