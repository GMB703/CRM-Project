import React, { useState } from "react";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import { useOrganization } from "../../contexts/OrganizationContext.jsx";
import { useAuth } from "../../hooks/useAuth";

/**
 * OrganizationSelector Component
 * Displays when user needs to select an organization (triggered by 300 status from API)
 */
const OrganizationSelector = ({ className = "" }) => {
  const { currentOrganization, availableOrganizations, switchOrganization } =
    useOrganization();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  // Only SuperAdmin users can switch organizations
  if (user?.role !== "SUPER_ADMIN") {
    return (
      <div className={`flex items-center ${className}`}>
        <div className="text-sm text-gray-700 dark:text-gray-300">
          {currentOrganization?.name || "No Organization"}
        </div>
      </div>
    );
  }

  const handleOrganizationSwitch = async (organizationId) => {
    try {
      await switchOrganization(organizationId);
      setIsOpen(false);
    } catch (error) {
      console.error("Failed to switch organization:", error);
    }
  };

  if (!availableOrganizations || availableOrganizations.length <= 1) {
    return (
      <div className={`flex items-center ${className}`}>
        <div className="text-sm text-gray-700 dark:text-gray-300">
          {currentOrganization?.name || "No Organization"}
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <span className="text-gray-700 dark:text-gray-300">
          {currentOrganization?.name || "Select Organization"}
        </span>
        <ChevronDownIcon
          className={`h-4 w-4 text-gray-500 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-64 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg z-50">
          <div className="py-1">
            {availableOrganizations?.map((org) => (
              <button
                key={org.id}
                onClick={() => handleOrganizationSwitch(org.id)}
                className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 ${
                  currentOrganization?.id === org.id
                    ? "bg-blue-50 dark:bg-blue-900 text-blue-600 dark:text-blue-300"
                    : "text-gray-700 dark:text-gray-300"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span>{org.name}</span>
                  {currentOrganization?.id === org.id && (
                    <span className="text-blue-500">✓</span>
                  )}
                </div>
                {org.description && (
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {org.description}
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export { OrganizationSelector };
