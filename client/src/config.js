// API Configuration
export const API_URL = '/api'; // Use proxy path for development, matches vite.config.js proxy

// Other environment-specific configuration
export const APP_NAME = 'CRM System';
export const VERSION = '1.0.0';

// Feature flags
export const FEATURES = {
  SUPER_ADMIN: true,
  MULTI_TENANT: true,
  REAL_TIME_NOTIFICATIONS: true,
};

// Default configuration values
export const DEFAULTS = {
  PAGE_SIZE: 10,
  TIMEOUT: 10000,
  REFRESH_INTERVAL: 30000,
}; 