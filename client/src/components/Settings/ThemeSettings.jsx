import React, { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useOrganization } from '../../contexts/OrganizationContext';

const ThemeSettings = () => {
  const { theme, setTheme, toggleDarkMode } = useTheme();
  const { currentOrganization } = useOrganization();
  const [isLoading, setIsLoading] = useState(false);
  const [localTheme, setLocalTheme] = useState({
    primaryColor: theme.primaryColor,
    secondaryColor: theme.secondaryColor,
    accentColor: theme.accentColor,
    logoUrl: theme.logoUrl,
    companyName: theme.companyName,
    darkMode: theme.darkMode
  });

  const handleColorChange = (colorType, value) => {
    setLocalTheme(prev => ({
      ...prev,
      [colorType]: value
    }));
  };

  const handleApplyTheme = async () => {
    setIsLoading(true);
    try {
      // Apply theme immediately for preview
      setTheme(localTheme);
      
      // TODO: Save to API when backend is ready
      // await api.updateOrganizationSettings(currentOrganization.id, localTheme);
      
      console.log('Theme settings updated:', localTheme);
    } catch (error) {
      console.error('Error updating theme:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetTheme = () => {
    const defaultTheme = {
      primaryColor: '#1976d2',
      secondaryColor: '#dc004e',
      accentColor: '#f50057',
      logoUrl: '/logo-default.png',
      companyName: currentOrganization?.name || 'CRM System',
      darkMode: false
    };
    setLocalTheme(defaultTheme);
    setTheme(defaultTheme);
  };

  const previewStyles = {
    '--preview-primary': localTheme.primaryColor,
    '--preview-secondary': localTheme.secondaryColor,
    '--preview-accent': localTheme.accentColor,
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          Theme Settings
        </h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Theme Configuration */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Color Scheme
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
                  onChange={(e) => handleColorChange('primaryColor', e.target.value)}
                  className="w-12 h-12 rounded-lg border-2 border-gray-300 cursor-pointer"
                />
                <input
                  type="text"
                  value={localTheme.primaryColor}
                  onChange={(e) => handleColorChange('primaryColor', e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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
                  onChange={(e) => handleColorChange('secondaryColor', e.target.value)}
                  className="w-12 h-12 rounded-lg border-2 border-gray-300 cursor-pointer"
                />
                <input
                  type="text"
                  value={localTheme.secondaryColor}
                  onChange={(e) => handleColorChange('secondaryColor', e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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
                  onChange={(e) => handleColorChange('accentColor', e.target.value)}
                  className="w-12 h-12 rounded-lg border-2 border-gray-300 cursor-pointer"
                />
                <input
                  type="text"
                  value={localTheme.accentColor}
                  onChange={(e) => handleColorChange('accentColor', e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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
                onChange={(e) => handleColorChange('companyName', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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
                onChange={(e) => handleColorChange('logoUrl', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="https://example.com/logo.png"
              />
            </div>

            {/* Dark Mode Toggle */}
            <div>
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={localTheme.darkMode}
                  onChange={(e) => handleColorChange('darkMode', e.target.checked)}
                  className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500"
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
              Preview
            </h3>
            
            <div 
              className="border rounded-lg p-6 bg-gray-50 dark:bg-gray-700"
              style={previewStyles}
            >
              <div className="space-y-4">
                {/* Header Preview */}
                <div className="flex items-center justify-between">
                  <h4 className="text-lg font-semibold company-branding">
                    {localTheme.companyName}
                  </h4>
                  {localTheme.logoUrl && (
                    <div className="logo-container">
                      <img 
                        src={localTheme.logoUrl} 
                        alt="Logo"
                        className="h-8 w-auto"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                </div>

                {/* Button Previews */}
                <div className="space-y-3">
                  <button 
                    className="btn-primary px-4 py-2 rounded-md text-white font-medium"
                    style={{ backgroundColor: localTheme.primaryColor }}
                  >
                    Primary Button
                  </button>
                  <button 
                    className="btn-secondary px-4 py-2 rounded-md text-white font-medium ml-3"
                    style={{ backgroundColor: localTheme.secondaryColor }}
                  >
                    Secondary Button
                  </button>
                  <button 
                    className="btn-accent px-4 py-2 rounded-md text-white font-medium ml-3"
                    style={{ backgroundColor: localTheme.accentColor }}
                  >
                    Accent Button
                  </button>
                </div>

                {/* Link Preview */}
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Sample text with a{' '}
                  <span 
                    className="link-primary font-medium"
                    style={{ color: localTheme.primaryColor }}
                  >
                    themed link
                  </span>
                  {' '}example.
                </p>

                {/* Card Preview */}
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border shadow-sm">
                  <h5 className="font-medium text-gray-900 dark:text-white">Sample Card</h5>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                    This is how cards will look with your theme.
                  </p>
                  <div 
                    className="w-full bg-gray-200 rounded-full h-2 mt-3"
                  >
                    <div 
                      className="h-2 rounded-full" 
                      style={{ 
                        backgroundColor: localTheme.primaryColor,
                        width: '60%'
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
              className="px-6 py-2 bg-theme-primary text-white rounded-md hover:opacity-90 transition-opacity disabled:opacity-50"
              style={{ backgroundColor: localTheme.primaryColor }}
            >
              {isLoading ? 'Applying...' : 'Apply Theme'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThemeSettings; 