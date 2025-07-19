import React, { useState, useEffect } from "react";
import { useTheme } from "../../contexts/ThemeContext.jsx";
import { useOrganization } from "../../contexts/OrganizationContext.jsx";
import { getOrganizationTheme, updateOrganizationTheme } from "../../services/authAPI.js";
import toast from "react-hot-toast";

const ThemeSettings = () => {
  const { theme, setTheme, toggleDarkMode, resetTheme, setThemeMode } = useTheme();
  const { organization } = useOrganization();
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingTheme, setIsLoadingTheme] = useState(true);
  const [localTheme, setLocalTheme] = useState({
    primaryColor: theme.primaryColor || "#1976d2",
    secondaryColor: theme.secondaryColor || "#dc004e",
    accentColor: theme.accentColor || "#f50057",
    logoUrl: theme.logoUrl || "/logo-default.png",
    companyName: theme.companyName || "CRM System",
    darkMode: theme.darkMode || false,
  });

  // Load organization theme from backend
  useEffect(() => {
    const loadOrganizationTheme = async () => {
      try {
        setIsLoadingTheme(true);
        const response = await getOrganizationTheme();
        if (response.success && response.data) {
          const orgTheme = response.data;
          const newTheme = {
            primaryColor: orgTheme.primaryColor || "#1976d2",
            secondaryColor: orgTheme.secondaryColor || "#dc004e",
            accentColor: orgTheme.accentColor || "#f50057",
            logoUrl: orgTheme.logoUrl || "/logo-default.png",
            companyName: orgTheme.companyName || "CRM System",
            darkMode: orgTheme.darkMode || false,
          };
          setLocalTheme(newTheme);
          // Don't update context theme here to prevent infinite loop
          // Context theme will be updated only when user applies changes
        }
      } catch (error) {
        console.error("Error loading organization theme:", error);
        toast.error("Failed to load organization theme");
      } finally {
        setIsLoadingTheme(false);
      }
    };

    loadOrganizationTheme();
  }, []); // Empty dependency array to run only once

  // Remove the problematic second useEffect that was causing the infinite loop
  // The local theme will be managed independently and only updated when user makes changes

  // CRM Theme Presets
  const themePresets = {
    default: {
      name: "Default Blue",
      primaryColor: "#1976d2",
      secondaryColor: "#dc004e",
      accentColor: "#f50057",
    },
    construction: {
      name: "Construction Orange",
      primaryColor: "#ff6b35",
      secondaryColor: "#f7931e",
      accentColor: "#ffd23f",
    },
    professional: {
      name: "Professional Gray",
      primaryColor: "#374151",
      secondaryColor: "#6b7280",
      accentColor: "#9ca3af",
    },
    modern: {
      name: "Modern Green",
      primaryColor: "#10b981",
      secondaryColor: "#059669",
      accentColor: "#34d399",
    },
    corporate: {
      name: "Corporate Navy",
      primaryColor: "#1e3a8a",
      secondaryColor: "#3b82f6",
      accentColor: "#60a5fa",
    },
  };

  const handleColorChange = (colorType, value) => {
    setLocalTheme((prev) => ({
      ...prev,
      [colorType]: value,
    }));
  };

  const handlePresetChange = (presetKey) => {
    const preset = themePresets[presetKey];
    setLocalTheme((prev) => ({
      ...prev,
      primaryColor: preset.primaryColor,
      secondaryColor: preset.secondaryColor,
      accentColor: preset.accentColor,
    }));
  };

  const handleApplyTheme = async () => {
    setIsLoading(true);
    try {
      // Apply theme immediately to context
      setTheme(localTheme);
      
      // Save to backend
      const response = await updateOrganizationTheme(localTheme);
      if (response.success) {
        toast.success("Theme applied and saved successfully!");
      } else {
        toast.error("Failed to save theme to server");
      }
      
      console.log("Theme settings updated:", localTheme);
    } catch (error) {
      console.error("Error updating theme:", error);
      toast.error("Failed to apply theme");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetTheme = async () => {
    const defaultTheme = {
      primaryColor: "#1976d2",
      secondaryColor: "#dc004e",
      accentColor: "#f50057",
      logoUrl: "/logo-default.png",
      companyName: organization?.name || "CRM System",
      darkMode: false,
    };
    setLocalTheme(defaultTheme);
    setTheme(defaultTheme);
    
    try {
      // Save default theme to backend
      await updateOrganizationTheme(defaultTheme);
      toast.success("Theme reset to default");
    } catch (error) {
      console.error("Error resetting theme:", error);
      toast.error("Failed to save default theme");
    }
  };

  const previewStyles = {
    "--preview-primary": localTheme.primaryColor,
    "--preview-secondary": localTheme.secondaryColor,
    "--preview-accent": localTheme.accentColor,
  };

  if (isLoadingTheme) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-500 mt-2">Loading theme settings...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          Theme Settings
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Theme Configuration */}
          <div className="space-y-6">
            {/* Theme Presets */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Quick Presets
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(themePresets).map(([key, preset]) => (
                  <button
                    key={key}
                    onClick={() => handlePresetChange(key)}
                    className="p-3 border rounded-lg hover:border-blue-500 transition-colors text-left"
                  >
                    <div className="flex items-center space-x-2 mb-2">
                      <div
                        className="w-4 h-4 rounded"
                        style={{ backgroundColor: preset.primaryColor }}
                      />
                      <div
                        className="w-4 h-4 rounded"
                        style={{ backgroundColor: preset.secondaryColor }}
                      />
                      <div
                        className="w-4 h-4 rounded"
                        style={{ backgroundColor: preset.accentColor }}
                      />
                    </div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {preset.name}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Custom Colors
            </h3>

            {/* Primary Color */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Primary Color
              </label>
              <div className="flex items-center space-x-3">
                <input
                  type="color"
                  value={localTheme.primaryColor}
                  onChange={(e) =>
                    handleColorChange("primaryColor", e.target.value)
                  }
                  className="w-12 h-12 rounded-lg border-2 border-gray-300 cursor-pointer"
                />
                <input
                  type="text"
                  value={localTheme.primaryColor}
                  onChange={(e) =>
                    handleColorChange("primaryColor", e.target.value)
                  }
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="#1976d2"
                />
              </div>
            </div>

            {/* Secondary Color */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Secondary Color
              </label>
              <div className="flex items-center space-x-3">
                <input
                  type="color"
                  value={localTheme.secondaryColor}
                  onChange={(e) =>
                    handleColorChange("secondaryColor", e.target.value)
                  }
                  className="w-12 h-12 rounded-lg border-2 border-gray-300 cursor-pointer"
                />
                <input
                  type="text"
                  value={localTheme.secondaryColor}
                  onChange={(e) =>
                    handleColorChange("secondaryColor", e.target.value)
                  }
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="#dc004e"
                />
              </div>
            </div>

            {/* Accent Color */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Accent Color
              </label>
              <div className="flex items-center space-x-3">
                <input
                  type="color"
                  value={localTheme.accentColor}
                  onChange={(e) =>
                    handleColorChange("accentColor", e.target.value)
                  }
                  className="w-12 h-12 rounded-lg border-2 border-gray-300 cursor-pointer"
                />
                <input
                  type="text"
                  value={localTheme.accentColor}
                  onChange={(e) =>
                    handleColorChange("accentColor", e.target.value)
                  }
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="#f50057"
                />
              </div>
            </div>

            {/* Company Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Company Name
              </label>
              <input
                type="text"
                value={localTheme.companyName}
                onChange={(e) => handleColorChange("companyName", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Your Company Name"
              />
            </div>

            {/* Logo URL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Logo URL
              </label>
              <input
                type="url"
                value={localTheme.logoUrl}
                onChange={(e) => handleColorChange("logoUrl", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="https://example.com/logo.png"
              />
            </div>

            {/* Dark Mode Toggle */}
            <div>
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={localTheme.darkMode}
                  onChange={(e) =>
                    handleColorChange("darkMode", e.target.checked)
                  }
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Enable Dark Mode
                </span>
              </label>
            </div>
          </div>

          {/* Preview Section */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Live Preview
            </h3>

            <div
              className="border rounded-lg p-6 bg-gray-50 dark:bg-gray-700"
              style={previewStyles}
            >
              <div className="space-y-4">
                {/* Header Preview */}
                <div className="flex items-center justify-between">
                  <h4 className="text-lg font-semibold" style={{ color: localTheme.primaryColor }}>
                    {localTheme.companyName}
                  </h4>
                  {localTheme.logoUrl && (
                    <div className="logo-container">
                      <img
                        src={localTheme.logoUrl}
                        alt="Logo"
                        className="h-8 w-auto"
                        onError={(e) => {
                          e.target.style.display = "none";
                        }}
                      />
                    </div>
                  )}
                </div>

                {/* Button Previews */}
                <div className="space-y-3">
                  <button
                    className="px-4 py-2 rounded-md text-white font-medium"
                    style={{ backgroundColor: localTheme.primaryColor }}
                  >
                    Primary Button
                  </button>
                  <button
                    className="px-4 py-2 rounded-md text-white font-medium ml-3"
                    style={{ backgroundColor: localTheme.secondaryColor }}
                  >
                    Secondary Button
                  </button>
                  <button
                    className="px-4 py-2 rounded-md text-white font-medium ml-3"
                    style={{ backgroundColor: localTheme.accentColor }}
                  >
                    Accent Button
                  </button>
                </div>

                {/* CRM Elements Preview */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: localTheme.primaryColor }}></div>
                    <span className="text-sm">Active Lead</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: localTheme.secondaryColor }}></div>
                    <span className="text-sm">Pending Project</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: localTheme.accentColor }}></div>
                    <span className="text-sm">Urgent Task</span>
                  </div>
                </div>

                {/* Progress Bar Preview */}
                <div className="space-y-2">
                  <div className="text-sm font-medium">Project Progress</div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="h-2 rounded-full"
                      style={{ 
                        backgroundColor: localTheme.primaryColor,
                        width: "65%"
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200 dark:border-gray-600">
          <button
            onClick={handleResetTheme}
            className="px-4 py-2 text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Reset to Default
          </button>

          <div className="space-x-3">
            <button
              onClick={toggleDarkMode}
              className="px-4 py-2 text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Toggle Dark Mode
            </button>
            <button
              onClick={handleApplyTheme}
              disabled={isLoading}
              className="px-6 py-2 text-white rounded-md hover:opacity-90 transition-opacity disabled:opacity-50"
              style={{ backgroundColor: localTheme.primaryColor }}
            >
              {isLoading ? "Applying..." : "Apply Theme"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export { ThemeSettings };
