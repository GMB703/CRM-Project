import React, { useEffect } from "react";
import {
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
} from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  getCurrentUser,
  selectIsAuthenticated,
  selectIsSuperAdmin,
  clearError,
  setToken,
} from "./store/slices/authSlice";
import { Toaster } from "react-hot-toast";
import { ThemeProvider } from "./contexts/ThemeContext.jsx";
import { OrganizationProvider } from "./contexts/OrganizationContext.jsx";
import { Layout } from "./components/Layout/Layout.jsx";
import { PrivateRoute } from "./components/PrivateRoute.jsx";
import { Login } from "./pages/Auth/Login.jsx";
import { ForgotPassword } from "./pages/Auth/ForgotPassword.jsx";
import { ResetPassword } from "./pages/Auth/ResetPassword.jsx";
import { Dashboard } from "./pages/Dashboard/Dashboard.jsx";
import { Leads } from "./pages/Leads.jsx";
import { Projects } from "./pages/Projects.jsx";
import { Tasks } from "./pages/Tasks.jsx";
import { Estimates } from "./pages/Estimates.jsx";
import { Settings } from "./pages/Settings.jsx";
import { CommunicationHub } from "./pages/Communication/CommunicationHub.jsx";
import { AdminDashboard } from "./components/Admin/AdminDashboard.jsx";
import { SuperAdminLayout } from "./components/SuperAdmin/SuperAdminLayout.jsx";
import { SuperAdminDashboard } from "./components/SuperAdmin/SuperAdminDashboard.jsx";
import { OrganizationsPage } from "./components/SuperAdmin/Organizations/OrganizationsPage.jsx";
import { UsersPage } from "./components/SuperAdmin/Users/UsersPage.jsx";
import { AnalyticsDashboard } from "./components/SuperAdmin/Analytics/AnalyticsDashboard.jsx";
import { AuditLogViewer } from "./components/SuperAdmin/AuditLogViewer.jsx";
import { Customers } from "./pages/Customers.jsx";
import { RolesAndPermissionsPage } from "./components/SuperAdmin/RolesAndPermissionsPage.jsx";

// AuthGate component to protect routes
function AuthGate({ children }) {
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  const location = useLocation();
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return children;
}

function App() {
  const dispatch = useDispatch();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const isSuperAdmin = useSelector(selectIsSuperAdmin);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("organizationId");
      dispatch(setToken(null));
      dispatch(clearError());
      if (window.location.pathname !== "/login") {
        navigate("/login");
      }
    }
  }, [isAuthenticated, dispatch, navigate]);

  useEffect(() => {
    if (localStorage.getItem("token")) {
      dispatch(getCurrentUser());
    }
  }, [dispatch]);

  return (
    <OrganizationProvider>
      <ThemeProvider>
        <Toaster position="top-right" />
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Super Admin Routes */}
          <Route
            path="/super-admin"
            element={
              <PrivateRoute>
                <SuperAdminLayout />
              </PrivateRoute>
            }
          >
            <Route index element={<SuperAdminDashboard />} />
            <Route path="organizations" element={<OrganizationsPage />} />
            <Route path="users" element={<UsersPage />} />
            <Route
              path="roles-permissions"
              element={<RolesAndPermissionsPage />}
            />
            <Route path="analytics" element={<AnalyticsDashboard />} />
            <Route path="security" element={<AuditLogViewer />} />
            <Route path="settings" element={<div>System Settings</div>} />
            <Route path="profile" element={<div>Admin Profile</div>} />
          </Route>

          {/* Regular User Routes */}
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <Layout />
              </PrivateRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="leads/*" element={<Leads />} />
            <Route path="projects" element={<Projects />} />
            <Route path="tasks" element={<Tasks />} />
            <Route path="estimates/*" element={<Estimates />} />
            <Route path="communication/*" element={<CommunicationHub />} />
            <Route path="settings" element={<Settings />} />
            <Route path="admin" element={<AdminDashboard />} />
            <Route path="customers" element={<Customers />} />
            <Route
              path="reports"
              element={<div>Reports page coming soon...</div>}
            />
          </Route>

          {/* Catch all route - redirect to appropriate dashboard */}
          <Route
            path="*"
            element={
              <Navigate
                to={
                  isAuthenticated
                    ? isSuperAdmin
                      ? "/super-admin"
                      : "/dashboard"
                    : "/"
                }
              />
            }
          />
        </Routes>
      </ThemeProvider>
    </OrganizationProvider>
  );
}

export { App };
