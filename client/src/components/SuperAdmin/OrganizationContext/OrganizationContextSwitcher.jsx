import React, { useState, useEffect } from "react";
import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Chip,
  CircularProgress,
} from "@mui/material";
import ExitIcon from "@mui/icons-material/ExitToApp";
import { getOrganizations } from "../../../services/organizationAPI";
import { useOrganization } from "../../../contexts/OrganizationContext.jsx";
import { useAuth } from "../../../hooks/useAuth";
import toast from "react-hot-toast";

const OrganizationContextSwitcher = () => {
  const [organizations, setOrganizations] = useState([]);
  const {
    currentOrganization,
    switchOrganization,
    clearOrganizationContext,
    loading: contextLoading,
    error: contextError,
  } = useOrganization();
  const { user, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated && user?.isSuperAdmin) {
      loadOrganizations();
    }
  }, [isAuthenticated, user]);

  const loadOrganizations = async () => {
    try {
      setLoading(true);
      const response = await getOrganizations(true);
      setOrganizations(response.data || []);
    } catch (error) {
      toast.error("Failed to load organizations");
      console.error("Error loading organizations:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOrganizationChange = async (event) => {
    const orgId = event.target.value;
    try {
      if (orgId) {
        const org = organizations.find((o) => o.id === orgId);
        await switchOrganization(org);
        toast.success(`Switched to ${org.name}`);
      } else {
        await clearOrganizationContext();
        toast.success("Exited organization context");
      }
    } catch (error) {
      toast.error("Failed to switch organization context");
      console.error("Error switching organization:", error);
    }
  };

  const handleExitContext = async () => {
    try {
      await clearOrganizationContext();
      toast.success("Exited organization context");
    } catch (error) {
      toast.error("Failed to exit organization context");
      console.error("Error exiting context:", error);
    }
  };

  // Don't render if not authenticated or not super admin
  if (!isAuthenticated || !user?.isSuperAdmin) {
    return null;
  }

  // Show loading state
  if (loading || contextLoading) {
    return (
      <Box className="flex items-center gap-2 px-4 py-2">
        <CircularProgress size={20} />
        <Typography variant="body2">Loading organizations...</Typography>
      </Box>
    );
  }

  // Show error state
  if (contextError) {
    return (
      <Box className="flex items-center gap-2 px-4 py-2">
        <Typography variant="body2" color="error">
          {contextError}
        </Typography>
      </Box>
    );
  }

  return (
    <Box className="flex items-center gap-4 px-4 py-2 bg-gray-100 rounded-lg">
      <Typography variant="body2" className="text-gray-600 whitespace-nowrap">
        Organization Context:
      </Typography>

      {currentOrganization ? (
        <Box className="flex items-center gap-2">
          <Chip
            label={currentOrganization.name}
            color="primary"
            onDelete={handleExitContext}
            deleteIcon={<ExitIcon />}
          />
        </Box>
      ) : (
        <FormControl size="small" className="min-w-[200px]">
          <InputLabel>Select Organization</InputLabel>
          <Select
            value=""
            onChange={handleOrganizationChange}
            label="Select Organization"
          >
            {organizations.map((org) => (
              <MenuItem key={org.id} value={org.id}>
                {org.name}
                {!org.isActive && (
                  <Chip
                    size="small"
                    label="Inactive"
                    color="default"
                    className="ml-2"
                  />
                )}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}
    </Box>
  );
};

export { OrganizationContextSwitcher };
