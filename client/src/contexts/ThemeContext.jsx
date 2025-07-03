import React, { createContext, useContext, useEffect, useState } from 'react';
import { useOrganization } from './OrganizationContext';

const defaultTheme = {
  primaryColor: '#1976d2',
  secondaryColor: '#dc004e',
  accentColor: '#f50057',
  logoUrl: '/logo-default.png',
  faviconUrl: '/favicon.ico',
  companyName: 'CRM System',
  darkMode: false,
  sidebarCollapsed: false
};

const ThemeContext = createContext(undefined);

export const ThemeProvider = ({ children }) => {
  const { currentOrganization } = useOrganization();
  const [theme, setThemeState] = useState(defaultTheme);

  // Apply CSS custom properties to the document root
  const applyCSSVariables = (themeConfig) => {
    const root = document.documentElement;
    
    // Convert hex colors to RGB for better CSS variable usage
    const hexToRgb = (hex) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      } : null;
    };

    const primaryRgb = hexToRgb(themeConfig.primaryColor);
    const secondaryRgb = hexToRgb(themeConfig.secondaryColor);
    const accentRgb = hexToRgb(themeConfig.accentColor);

    // Set CSS custom properties
    root.style.setProperty('--color-primary', themeConfig.primaryColor);
    root.style.setProperty('--color-secondary', themeConfig.secondaryColor);
    root.style.setProperty('--color-accent', themeConfig.accentColor);
    
    if (primaryRgb) {
      root.style.setProperty('--color-primary-rgb', `${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}`);
    }
    if (secondaryRgb) {
      root.style.setProperty('--color-secondary-rgb', `${secondaryRgb.r}, ${secondaryRgb.g}, ${secondaryRgb.b}`);
    }
    if (accentRgb) {
      root.style.setProperty('--color-accent-rgb', `${accentRgb.r}, ${accentRgb.g}, ${accentRgb.b}`);
    }

    // Dark mode handling
    if (themeConfig.darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    // Sidebar state
    root.style.setProperty('--sidebar-collapsed', themeConfig.sidebarCollapsed ? '1' : '0');
  };

  // Update theme when organization changes
  useEffect(() => {
    if (currentOrganization?.organizationSettings) {
      const settings = currentOrganization.organizationSettings;
      
      const newTheme = {
        ...defaultTheme,
        primaryColor: settings.primaryColor || defaultTheme.primaryColor,
        secondaryColor: settings.secondaryColor || defaultTheme.secondaryColor,
        accentColor: settings.accentColor || defaultTheme.accentColor,
        logoUrl: settings.logoUrl || defaultTheme.logoUrl,
        faviconUrl: settings.faviconUrl || defaultTheme.faviconUrl,
        companyName: settings.companyName || currentOrganization.name || defaultTheme.companyName,
        darkMode: settings.darkMode || defaultTheme.darkMode,
        sidebarCollapsed: settings.sidebarCollapsed || defaultTheme.sidebarCollapsed
      };

      setThemeState(newTheme);
      applyCSSVariables(newTheme);

      // Update favicon if provided
      if (settings.faviconUrl) {
        const link = document.querySelector("link[rel*='icon']");
        if (link) {
          link.href = settings.faviconUrl;
        } else {
          // Create favicon link if it doesn't exist
          const newLink = document.createElement('link');
          newLink.rel = 'icon';
          newLink.href = settings.faviconUrl;
          document.head.appendChild(newLink);
        }
      }

      // Update document title
      const companyName = settings.companyName || currentOrganization.name;
      if (companyName) {
        document.title = `${companyName} - CRM`;
      }
    } else {
      // Apply default theme if no organization settings
      setThemeState(defaultTheme);
      applyCSSVariables(defaultTheme);
      document.title = 'CRM System';
    }
  }, [currentOrganization]);

  const setTheme = (newTheme) => {
    const updatedTheme = {
      ...theme,
      ...newTheme
    };
    setThemeState(updatedTheme);
    applyCSSVariables(updatedTheme);
  };

  const toggleDarkMode = () => {
    setTheme({ darkMode: !theme.darkMode });
  };

  const toggleSidebar = () => {
    setTheme({ sidebarCollapsed: !theme.sidebarCollapsed });
  };

  const value = {
    theme,
    setTheme,
    toggleDarkMode,
    toggleSidebar
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}; 