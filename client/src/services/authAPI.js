import { api } from "./api";

// Login
export const login = async (credentials) => {
  try {
    const response = await api.post("/auth/login", credentials);
    return response.data;
  } catch (error) {
    if (error.response?.status === 401) {
      throw new Error("Invalid credentials");
    }
    throw error.response?.data?.message || error.message || "Login failed";
  }
};

// Get current user
export const getCurrentUser = async () => {
  try {
    const response = await api.get("/auth/me");
    return response.data;
  } catch (error) {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("organizationId");
    }
    throw error;
  }
};

// Refresh token
export const refreshToken = async () => {
  try {
    const refreshToken = localStorage.getItem("refreshToken");
    if (!refreshToken) {
      throw new Error("No refresh token available");
    }
    const response = await api.post("/auth/refresh", {
      refreshToken,
      organizationId: localStorage.getItem("organizationId"),
    });
    if (response.data.success) {
      const { token } = response.data;
      localStorage.setItem("token", token);
      return token;
    } else {
      throw new Error(response.data.message || "Token refresh failed");
    }
  } catch (error) {
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("organizationId");
    throw (
      error.response?.data?.message || error.message || "Token refresh failed"
    );
  }
};

// Logout
export const logout = async () => {
  try {
    await api.post("/auth/logout");
  } catch (error) {
    // Ignore errors, always clear local auth data
  } finally {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("organizationId");
    localStorage.removeItem("refreshToken");
  }
};

// Forgot Password
export const forgotPassword = async (email) => {
  try {
    const response = await api.post("/auth/forgot-password", { email });
    return response.data;
  } catch (error) {
    throw (
      error.response?.data?.message ||
      error.message ||
      "Failed to send reset email"
    );
  }
};

// Reset Password
export const resetPassword = async (token, password) => {
  try {
    const response = await api.post("/auth/reset-password", {
      token,
      password,
    });
    return response.data;
  } catch (error) {
    throw (
      error.response?.data?.message ||
      error.message ||
      "Failed to reset password"
    );
  }
};

// Get user notification preferences
export const getNotificationPreferences = async () => {
  try {
    const response = await api.get("/auth/notification-preferences");
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Update user notification preferences
export const updateNotificationPreferences = async (preferences) => {
  try {
    const response = await api.put("/auth/notification-preferences", preferences);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Get organization theme
export const getOrganizationTheme = async () => {
  try {
    const response = await api.get("/auth/organization-theme");
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Update organization theme
export const updateOrganizationTheme = async (theme) => {
  try {
    const response = await api.put("/auth/organization-theme", theme);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Security-related API functions

// Get user's login history
export const getLoginHistory = async () => {
  try {
    const response = await api.get("/auth/login-history");
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Get user's active sessions
export const getActiveSessions = async () => {
  try {
    const response = await api.get("/auth/active-sessions");
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Logout from all other sessions
export const logoutAllSessions = async () => {
  try {
    const response = await api.post("/auth/logout-all-sessions");
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Get security settings
export const getSecuritySettings = async () => {
  try {
    const response = await api.get("/auth/security-settings");
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Update security settings
export const updateSecuritySettings = async (settings) => {
  try {
    const response = await api.put("/auth/security-settings", settings);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Get all users (for super admin context switching)
export const getUsers = async () => {
  try {
    const response = await api.get("/super-admin/users");
    return response.data;
  } catch (error) {
    throw error;
  }
};
