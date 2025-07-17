import React, { useState, useEffect } from "react";
import { X, Building2, Check, Loader2 } from "lucide-react";
import { useOrganization } from "../../contexts/OrganizationContext.jsx";
import { useAuth } from "../../hooks/useAuth";

/**
 * OrganizationSwitcher Component
 * Allows super admin users to switch between organizations
 */
const OrganizationSwitcher = ({ isOpen, onClose }) => {
  const {
    currentOrganization,
    availableOrganizations,
    switchOrganization,
    loading,
  } = useOrganization();
  const { user } = useAuth();
  const [selectedOrgId, setSelectedOrgId] = useState(currentOrganization?.id);

  // Only SuperAdmin users can switch organizations
  const canSwitch = user?.role === "SUPER_ADMIN";

  useEffect(() => {
    if (currentOrganization) {
      setSelectedOrgId(currentOrganization.id);
    }
  }, [currentOrganization]);

  const handleSwitch = async (organizationId) => {
    if (!canSwitch) return;

    try {
      setSelectedOrgId(organizationId);
      await switchOrganization(organizationId);
      onClose();
    } catch (error) {
      console.error("Failed to switch organization:", error);
      setSelectedOrgId(currentOrganization?.id);
    }
  };

  if (!isOpen) return null;

  // If not SuperAdmin, show read-only organization info
  if (!canSwitch) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-96 max-w-md mx-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Organization Info
            </h2>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-2">
            <div className="flex items-center space-x-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <Building2 className="h-5 w-5 text-blue-600" />
              <div>
                <div className="font-medium text-gray-900 dark:text-white">
                  {currentOrganization?.name || "No Organization"}
                </div>
                {currentOrganization?.description && (
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {currentOrganization.description}
                  </div>
                )}
              </div>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
              Only SuperAdmin users can switch between organizations.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-96 max-w-md mx-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Switch Organization
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600 dark:text-gray-400">
              Loading organizations...
            </span>
          </div>
        ) : (
          <div className="space-y-2">
            {availableOrganizations?.map((org) => (
              <button
                key={org.id}
                onClick={() => handleSwitch(org.id)}
                className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all ${
                  selectedOrgId === org.id
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                    : "border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500"
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Building2
                    className={`h-5 w-5 ${
                      selectedOrgId === org.id
                        ? "text-blue-600"
                        : "text-gray-400"
                    }`}
                  />
                  <div className="text-left">
                    <div
                      className={`font-medium ${
                        selectedOrgId === org.id
                          ? "text-blue-900 dark:text-blue-100"
                          : "text-gray-900 dark:text-white"
                      }`}
                    >
                      {org.name}
                    </div>
                    {org.description && (
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {org.description}
                      </div>
                    )}
                  </div>
                </div>
                {selectedOrgId === org.id && (
                  <Check className="h-5 w-5 text-blue-600" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export { OrganizationSwitcher };
