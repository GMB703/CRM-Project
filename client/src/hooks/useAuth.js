import { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  selectCurrentUser,
  selectIsAuthenticated,
  selectAuthLoading,
  selectAuthError,
  getCurrentUser,
  clearError,
} from "../store/slices/authSlice";

export const useAuth = () => {
  const user = useSelector(selectCurrentUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const loading = useSelector(selectAuthLoading);
  const error = useSelector(selectAuthError);
  const token = localStorage.getItem("token");

  return {
    user,
    token,
    loading,
    error,
    isAuthenticated,
  };
};

// Hook for checking user permissions
export const usePermissions = () => {
  const { user } = useAuth();

  const hasRole = (role) => {
    if (!user) return false;
    return user.role === role;
  };

  const hasAnyRole = (roles) => {
    if (!user) return false;
    return roles.includes(user.role);
  };

  const can = (permission) => {
    if (!user) return false;

    // Define permission mappings based on user role
    const permissions = {
      ORG_ADMIN: [
        "users.manage",
        "clients.manage",
        "projects.manage",
        "tasks.manage",
        "estimates.manage",
        "invoices.manage",
        "reports.view",
        "settings.manage",
        "system.admin",
      ],
      USER: [
        "clients.view",
        "projects.view",
        "tasks.manage",
        "estimates.view",
        "invoices.view",
        "reports.view",
      ],
      VIEWER: [
        "clients.view",
        "projects.view",
        "tasks.view",
        "estimates.view",
        "invoices.view",
      ],
    };

    const userPermissions = permissions[user.role] || [];
    return userPermissions.includes(permission);
  };

  const canManage = (entity) => {
    return can(`${entity}.manage`);
  };

  const canView = (entity) => {
    return can(`${entity}.view`) || can(`${entity}.manage`);
  };

  return {
    hasRole,
    hasAnyRole,
    can,
    canManage,
    canView,
    isOrgAdmin: hasRole("ORG_ADMIN"),
    isUser: hasRole("USER"),
    isViewer: hasRole("VIEWER"),
  };
};

// Hook for checking if user can access specific features
export const useFeatureAccess = () => {
  const { can } = usePermissions();

  return {
    canAccessDashboard: can("reports.view"),
    canManageUsers: can("users.manage"),
    canManageClients: can("clients.manage"),
    canManageProjects: can("projects.manage"),
    canManageTasks: can("tasks.manage"),
    canManageEstimates: can("estimates.manage"),
    canManageInvoices: can("invoices.manage"),
    canViewReports: can("reports.view"),
    canManageSettings: can("settings.manage"),
    canAccessAdmin: can("system.admin"),
  };
};

// Hook for getting user's assigned projects and tasks
export const useUserAssignments = () => {
  const { user } = useAuth();

  // This would typically fetch from API, but for now return empty arrays
  const assignedProjects = [];
  const assignedTasks = [];

  return {
    assignedProjects,
    assignedTasks,
    hasAssignments: assignedProjects.length > 0 || assignedTasks.length > 0,
  };
};

// Hook for user preferences
export const useUserPreferences = () => {
  const { user } = useAuth();

  const preferences = {
    theme: localStorage.getItem("theme") || "light",
    sidebarCollapsed: localStorage.getItem("sidebarCollapsed") === "true",
    notifications: {
      email: true,
      push: true,
      sms: false,
    },
    dashboard: {
      layout: "grid",
      widgets: ["overview", "recent-activity", "upcoming-deadlines"],
    },
  };

  const updatePreference = (key, value) => {
    if (key === "theme") {
      localStorage.setItem("theme", value);
    } else if (key === "sidebarCollapsed") {
      localStorage.setItem("sidebarCollapsed", value.toString());
    }
    // In a real app, you'd also save to the backend
  };

  return {
    preferences,
    updatePreference,
  };
};
