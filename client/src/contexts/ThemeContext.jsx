import React, { createContext, useContext, useState, useEffect } from "react";

const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

// Default theme configuration
const defaultTheme = {
  primaryColor: "#1976d2",
  secondaryColor: "#dc004e",
  accentColor: "#f50057",
  logoUrl: "/logo-default.png",
  companyName: "CRM System",
  darkMode: false,
  mode: "light", // light, dark, auto
};

export const ThemeProvider = ({ children }) => {
  // Load theme from localStorage or use default
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem("crm-theme");
    return savedTheme ? JSON.parse(savedTheme) : defaultTheme;
  });

  // Apply theme to document
  useEffect(() => {
    // Save theme to localStorage
    localStorage.setItem("crm-theme", JSON.stringify(theme));
    
    // Apply CSS custom properties
    const root = document.documentElement;
    root.style.setProperty("--color-primary", theme.primaryColor);
    root.style.setProperty("--color-secondary", theme.secondaryColor);
    root.style.setProperty("--color-accent", theme.accentColor);
    
    // Convert hex to RGB for alpha variations
    const hexToRgb = (hex) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : "0, 0, 0";
    };
    
    root.style.setProperty("--color-primary-rgb", hexToRgb(theme.primaryColor));
    root.style.setProperty("--color-secondary-rgb", hexToRgb(theme.secondaryColor));
    root.style.setProperty("--color-accent-rgb", hexToRgb(theme.accentColor));
    
    // Apply dark mode
    if (theme.darkMode) {
      document.documentElement.classList.add("dark");
      document.documentElement.setAttribute("data-theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      document.documentElement.setAttribute("data-theme", "light");
    }
  }, [theme]);

  // Update theme function
  const updateTheme = (newTheme) => {
    setTheme(prev => ({ ...prev, ...newTheme }));
  };

  // Toggle dark mode
  const toggleDarkMode = () => {
    setTheme(prev => ({ ...prev, darkMode: !prev.darkMode }));
  };

  // Reset to default theme
  const resetTheme = () => {
    setTheme(defaultTheme);
  };

  // Set specific theme mode
  const setThemeMode = (mode) => {
    setTheme(prev => ({ ...prev, mode, darkMode: mode === "dark" }));
  };

  const value = {
    theme,
    setTheme: updateTheme,
    toggleDarkMode,
    resetTheme,
    setThemeMode,
    isDarkMode: theme.darkMode,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};
