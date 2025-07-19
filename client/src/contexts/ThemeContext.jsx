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

    // Utility to convert HEX to HSL string "h s% l%"
    const hexToHsl = (hex) => {
      // Expand shorthand hex (#03F) to full form (#0033FF)
      const fullHex = hex.replace(/^#([a-f\d])([a-f\d])([a-f\d])$/i,
        (m, r, g, b) => `#${r}${r}${g}${g}${b}${b}`);
      const int = parseInt(fullHex.substring(1), 16);
      const r = (int >> 16) & 255;
      const g = (int >> 8) & 255;
      const b = int & 255;

      const rPerc = r / 255;
      const gPerc = g / 255;
      const bPerc = b / 255;

      const max = Math.max(rPerc, gPerc, bPerc);
      const min = Math.min(rPerc, gPerc, bPerc);
      let h, s, l;
      l = (max + min) / 2;

      if (max === min) {
        h = s = 0; // achromatic
      } else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
          case rPerc:
            h = (gPerc - bPerc) / d + (gPerc < bPerc ? 6 : 0);
            break;
          case gPerc:
            h = (bPerc - rPerc) / d + 2;
            break;
          case bPerc:
            h = (rPerc - gPerc) / d + 4;
            break;
          default:
            h = 0;
        }
        h /= 6;
      }

      h = Math.round(h * 360);
      s = Math.round(s * 100);
      l = Math.round(l * 100);
      return `${h} ${s}% ${l}%`;
    };

    // Set Tailwind-compatible HSL variables for primary/secondary/accent 500 shades
    root.style.setProperty("--primary-500", hexToHsl(theme.primaryColor));
    root.style.setProperty("--secondary-500", hexToHsl(theme.secondaryColor));
    root.style.setProperty("--accent-500", hexToHsl(theme.accentColor));

    // Optionally adjust 600/700 shades slightly darker for hovers
    const adjustLightness = (hslStr, delta) => {
      const [h, s, l] = hslStr.split(/\s|%/).filter(Boolean);
      let newL = Math.max(0, Math.min(100, parseInt(l, 10) + delta));
      return `${h} ${s}% ${newL}%`;
    };

    const pHsl = hexToHsl(theme.primaryColor);
    root.style.setProperty("--primary-600", adjustLightness(pHsl, -5));
    root.style.setProperty("--primary-700", adjustLightness(pHsl, -10));

    const sHsl = hexToHsl(theme.secondaryColor);
    root.style.setProperty("--secondary-600", adjustLightness(sHsl, -5));
    root.style.setProperty("--secondary-700", adjustLightness(sHsl, -10));
    const aHsl = hexToHsl(theme.accentColor);
    root.style.setProperty("--accent-600", adjustLightness(aHsl, -5));
    root.style.setProperty("--accent-700", adjustLightness(aHsl, -10));
    
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
