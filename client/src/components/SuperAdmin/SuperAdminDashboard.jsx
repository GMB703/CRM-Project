import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import {
  selectCurrentUser,
  selectIsSuperAdmin,
  selectAuthLoading,
} from "../../store/slices/authSlice";
import { Card, Button, Alert } from "@mui/material";
import { Spinner } from '../UI/Spinner';
import {
  getAllOrganizationsAdmin,
  extractOrganizationsArray,
} from "../../services/organizationAPI";
import UserActivitySummary from "./UserActivitySummary.jsx";
import ContextSwitcher from './ContextSwitcher.jsx';
import CreateOrganizationForm from './CreateOrganizationForm.jsx';
import CreateUserForm from './CreateUserForm.jsx';

console.log(
  "SuperAdminDashboard module loaded, organizationAPI:",
  getAllOrganizationsAdmin,
);

const SuperAdminDashboard = () => {
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const currentUser = useSelector(selectCurrentUser);
  const isSuperAdmin = useSelector(selectIsSuperAdmin);
  const authLoading = useSelector(selectAuthLoading);

  useEffect(() => {
    const loadOrganizations = async () => {
      // Don't load data if not authenticated as super admin
      if (!currentUser || !isSuperAdmin) {
        setLoading(false);
        return;
      }

      try {
        console.log(
          "Attempting to load organizations with API:",
          getAllOrganizationsAdmin,
        );
        setLoading(true);
        setError(null);
        const response = await getAllOrganizationsAdmin();
        const orgs = extractOrganizationsArray(response);
        setOrganizations(orgs);
      } catch (err) {
        console.error("Failed to load organizations:", err);
        setError(err.message || "Failed to load organizations");
      } finally {
        setLoading(false);
      }
    };

    // Only load organizations if auth check is complete
    if (!authLoading) {
      loadOrganizations();
    }
  }, [currentUser, isSuperAdmin, authLoading]);

  // Show loading while checking auth
  if (authLoading) {
    return <Spinner />;
  }

  // Show error if not super admin
  if (!isSuperAdmin) {
    return (
      <div className="p-4">
        <Alert severity="error">
          You do not have permission to access this page.
        </Alert>
      </div>
    );
  }

  // Show loading while fetching data
  if (loading) {
    return <Spinner />;
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Super Admin Dashboard
        </h1>
        <p className="mt-2 text-gray-600">Welcome back, {currentUser?.email}</p>
      </div>

      {error && (
        <Alert severity="error" className="mb-4">
          {error}
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* User Activity Summary - Only for Super Admins */}
        <div className="lg:col-span-3">
          <UserActivitySummary />
        </div>

        {/* Context Switcher - Only for Super Admins */}
        <div className="lg:col-span-3">
          <ContextSwitcher />
        </div>

        <div className="lg:col-span-3">
          <CreateOrganizationForm
            onOrganizationCreated={(newOrg) => {
              setOrganizations((prevOrgs) => [...prevOrgs, newOrg]);
            }}
          />
        </div>

        <div className="lg:col-span-3">
          <CreateUserForm />
        </div>

        <Card className="p-4">
          <h2 className="text-xl font-semibold mb-4">Organizations</h2>
          <div className="space-y-4">
            {organizations.map((org) => (
              <div key={org.id} className="p-4 border rounded-lg">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-medium">{org.name}</h3>
                    <p className="text-sm text-gray-500">{org.code}</p>
                  </div>
                  <Button
                    variant="contained"
                    color="primary"
                    size="small"
                    onClick={() => {
                      /* TODO: Implement organization management */
                    }}
                  >
                    Manage
                  </Button>
                </div>
                <div className="mt-2 grid grid-cols-3 gap-2 text-sm text-gray-600">
                  <div>Users: {org._count?.users || 0}</div>
                  <div>Clients: {org._count?.clients || 0}</div>
                  <div>Projects: {org._count?.projects || 0}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-4">
          <h2 className="text-xl font-semibold mb-4">System Stats</h2>
          <div className="space-y-2">
            <div>Total Organizations: {organizations.length}</div>
            <div>
              Active Organizations:{" "}
              {organizations.filter((org) => org.isActive).length}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export { SuperAdminDashboard };
