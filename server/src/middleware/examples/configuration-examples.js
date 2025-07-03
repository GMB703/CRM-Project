/**
 * Multi-Tenant Middleware Configuration Examples
 * 
 * This file demonstrates various configuration scenarios for different
 * deployment environments and use cases.
 */

const { createMultiTenantMiddleware } = require('../multiTenant');

// ===== DEVELOPMENT CONFIGURATION =====

/**
 * Development Environment Configuration
 * - Verbose logging for debugging
 * - Database verification enabled for testing
 * - Short cache TTL for rapid development
 * - Sensitive data logging allowed for debugging (UNSAFE for production)
 */
const developmentConfig = {
  verifyOrganizationAccess: true,
  cacheTTL: 60, // 1 minute for rapid testing
  allowSuperAdminAccess: true,
  
  errorMessages: {
    authenticationRequired: 'DEV: Authentication token required',
    invalidToken: 'DEV: Invalid or expired token',
    organizationContextRequired: 'DEV: Organization context missing',
    organizationAccessDenied: 'DEV: Access denied to organization',
    userNotFound: 'DEV: User not found in database',
    organizationNotActive: 'DEV: Organization is inactive'
  },
  
  logging: {
    enabled: true,
    logLevel: 'debug', // Most verbose logging
    logSensitiveData: true // ONLY for development debugging
  }
};

const developmentMiddleware = createMultiTenantMiddleware(developmentConfig);

// ===== STAGING CONFIGURATION =====

/**
 * Staging Environment Configuration
 * - Production-like settings with enhanced logging
 * - Database verification enabled
 * - Moderate cache TTL
 * - No sensitive data logging
 */
const stagingConfig = {
  verifyOrganizationAccess: true,
  cacheTTL: 300, // 5 minutes
  allowSuperAdminAccess: true,
  
  errorMessages: {
    authenticationRequired: 'Authentication required',
    invalidToken: 'Session expired. Please log in again.',
    organizationContextRequired: 'Organization context required',
    organizationAccessDenied: 'Access denied to organization',
    userNotFound: 'User account not found',
    organizationNotActive: 'Organization account is inactive'
  },
  
  logging: {
    enabled: true,
    logLevel: 'info',
    logSensitiveData: false
  }
};

const stagingMiddleware = createMultiTenantMiddleware(stagingConfig);

// ===== PRODUCTION CONFIGURATION =====

/**
 * Production Environment Configuration
 * - Optimized for performance and security
 * - Database verification enabled for security
 * - Longer cache TTL for performance
 * - Error-level logging only
 * - Generic error messages for security
 */
const productionConfig = {
  verifyOrganizationAccess: true,
  cacheTTL: 900, // 15 minutes
  allowSuperAdminAccess: false, // Disabled for security
  
  errorMessages: {
    authenticationRequired: 'Authentication required',
    invalidToken: 'Invalid session',
    organizationContextRequired: 'Invalid request',
    organizationAccessDenied: 'Access denied',
    userNotFound: 'Access denied',
    organizationNotActive: 'Service unavailable'
  },
  
  logging: {
    enabled: true,
    logLevel: 'error', // Only log errors
    logSensitiveData: false
  }
};

const productionMiddleware = createMultiTenantMiddleware(productionConfig);

// ===== HIGH-PERFORMANCE CONFIGURATION =====

/**
 * High-Performance Configuration
 * - Optimized for maximum throughput
 * - Database verification disabled for speed
 * - Extended cache TTL
 * - Minimal logging
 */
const highPerformanceConfig = {
  verifyOrganizationAccess: false, // Skip database queries
  cacheTTL: 1800, // 30 minutes
  allowSuperAdminAccess: false,
  
  errorMessages: {
    authenticationRequired: 'Authentication required',
    invalidToken: 'Invalid session',
    organizationContextRequired: 'Invalid request',
    organizationAccessDenied: 'Access denied',
    userNotFound: 'Access denied',
    organizationNotActive: 'Access denied'
  },
  
  logging: {
    enabled: false // Disable all logging for maximum performance
  }
};

const highPerformanceMiddleware = createMultiTenantMiddleware(highPerformanceConfig);

// ===== SECURITY-FOCUSED CONFIGURATION =====

/**
 * Security-Focused Configuration
 * - Maximum security settings
 * - Database verification always enabled
 * - Short cache TTL to minimize exposure
 * - Detailed logging for audit trails
 * - Super admin access disabled
 */
const securityFocusedConfig = {
  verifyOrganizationAccess: true,
  cacheTTL: 120, // 2 minutes only
  allowSuperAdminAccess: false,
  
  errorMessages: {
    authenticationRequired: 'Authentication required',
    invalidToken: 'Session expired',
    organizationContextRequired: 'Invalid request',
    organizationAccessDenied: 'Access denied',
    userNotFound: 'Access denied',
    organizationNotActive: 'Access denied'
  },
  
  logging: {
    enabled: true,
    logLevel: 'info', // Log for audit trails
    logSensitiveData: false
  }
};

const securityFocusedMiddleware = createMultiTenantMiddleware(securityFocusedConfig);

// ===== MICROSERVICES CONFIGURATION =====

/**
 * Microservices Configuration
 * - Optimized for service-to-service communication
 * - Token-based validation only (no database calls)
 * - Extended cache for service efficiency
 * - Structured logging for distributed tracing
 */
const microservicesConfig = {
  verifyOrganizationAccess: false, // Trust token validation only
  cacheTTL: 600, // 10 minutes
  allowSuperAdminAccess: true, // Allow for service-to-service calls
  
  errorMessages: {
    authenticationRequired: 'Service authentication required',
    invalidToken: 'Invalid service token',
    organizationContextRequired: 'Organization context required',
    organizationAccessDenied: 'Service access denied',
    userNotFound: 'User context not found',
    organizationNotActive: 'Organization context invalid'
  },
  
  logging: {
    enabled: true,
    logLevel: 'info',
    logSensitiveData: false
  }
};

const microservicesMiddleware = createMultiTenantMiddleware(microservicesConfig);

// ===== TESTING CONFIGURATION =====

/**
 * Testing Configuration
 * - Optimized for automated testing
 * - Database verification disabled for speed
 * - No caching to ensure test isolation
 * - Verbose logging for debugging test failures
 */
const testingConfig = {
  verifyOrganizationAccess: false, // Skip database for unit tests
  cacheTTL: 0, // Disable caching for test isolation
  allowSuperAdminAccess: true,
  
  errorMessages: {
    authenticationRequired: 'TEST: Authentication required',
    invalidToken: 'TEST: Invalid token',
    organizationContextRequired: 'TEST: Organization context required',
    organizationAccessDenied: 'TEST: Access denied',
    userNotFound: 'TEST: User not found',
    organizationNotActive: 'TEST: Organization inactive'
  },
  
  logging: {
    enabled: true,
    logLevel: 'debug',
    logSensitiveData: false
  }
};

const testingMiddleware = createMultiTenantMiddleware(testingConfig);

// ===== CONFIGURATION FACTORY =====

/**
 * Configuration Factory
 * Creates middleware based on environment variables
 */
function createEnvironmentMiddleware() {
  const env = process.env.NODE_ENV || 'development';
  
  switch (env.toLowerCase()) {
    case 'production':
      console.log('🔐 Using production multi-tenant configuration');
      return productionMiddleware;
      
    case 'staging':
      console.log('🧪 Using staging multi-tenant configuration');
      return stagingMiddleware;
      
    case 'test':
      console.log('🧪 Using testing multi-tenant configuration');
      return testingMiddleware;
      
    case 'development':
    default:
      console.log('🛠️ Using development multi-tenant configuration');
      return developmentMiddleware;
  }
}

// ===== CUSTOM CONFIGURATION BUILDER =====

/**
 * Custom Configuration Builder
 * Provides a fluent interface for building configurations
 */
class MultiTenantConfigBuilder {
  constructor() {
    this.config = {
      verifyOrganizationAccess: true,
      cacheTTL: 300,
      allowSuperAdminAccess: true,
      errorMessages: {},
      logging: {
        enabled: true,
        logLevel: 'info',
        logSensitiveData: false
      }
    };
  }
  
  // Database verification
  withDatabaseVerification(enabled = true) {
    this.config.verifyOrganizationAccess = enabled;
    return this;
  }
  
  // Cache configuration
  withCache(ttlSeconds = 300) {
    this.config.cacheTTL = ttlSeconds;
    return this;
  }
  
  withoutCache() {
    this.config.cacheTTL = 0;
    return this;
  }
  
  // Super admin access
  withSuperAdminAccess(enabled = true) {
    this.config.allowSuperAdminAccess = enabled;
    return this;
  }
  
  withoutSuperAdminAccess() {
    this.config.allowSuperAdminAccess = false;
    return this;
  }
  
  // Logging configuration
  withLogging(level = 'info', enabled = true) {
    this.config.logging.enabled = enabled;
    this.config.logging.logLevel = level;
    return this;
  }
  
  withoutLogging() {
    this.config.logging.enabled = false;
    return this;
  }
  
  withSensitiveDataLogging(enabled = false) {
    this.config.logging.logSensitiveData = enabled;
    return this;
  }
  
  // Error messages
  withCustomErrorMessages(messages) {
    this.config.errorMessages = { ...this.config.errorMessages, ...messages };
    return this;
  }
  
  // Build the middleware
  build() {
    return createMultiTenantMiddleware(this.config);
  }
  
  // Get the configuration object
  getConfig() {
    return { ...this.config };
  }
}

// ===== USAGE EXAMPLES =====

// Example 1: Using the configuration builder
const customMiddleware = new MultiTenantConfigBuilder()
  .withDatabaseVerification(true)
  .withCache(600) // 10 minutes
  .withLogging('warn')
  .withCustomErrorMessages({
    authenticationRequired: 'Please provide authentication',
    organizationAccessDenied: 'Organization access not permitted'
  })
  .build();

// Example 2: High-performance API gateway configuration
const apiGatewayMiddleware = new MultiTenantConfigBuilder()
  .withDatabaseVerification(false) // Trust upstream auth
  .withCache(1800) // 30 minutes
  .withoutLogging() // Maximum performance
  .withSuperAdminAccess(true) // Allow service-to-service
  .build();

// Example 3: Admin panel configuration
const adminPanelMiddleware = new MultiTenantConfigBuilder()
  .withDatabaseVerification(true) // Maximum security
  .withCache(60) // 1 minute only
  .withLogging('debug') // Detailed logging
  .withoutSuperAdminAccess() // No super admin in admin panel
  .build();

// ===== EXPORTS =====

module.exports = {
  // Pre-configured middlewares
  developmentMiddleware,
  stagingMiddleware,
  productionMiddleware,
  highPerformanceMiddleware,
  securityFocusedMiddleware,
  microservicesMiddleware,
  testingMiddleware,
  
  // Factory functions
  createEnvironmentMiddleware,
  MultiTenantConfigBuilder,
  
  // Example configurations
  customMiddleware,
  apiGatewayMiddleware,
  adminPanelMiddleware,
  
  // Raw configurations (for reference)
  configs: {
    development: developmentConfig,
    staging: stagingConfig,
    production: productionConfig,
    highPerformance: highPerformanceConfig,
    securityFocused: securityFocusedConfig,
    microservices: microservicesConfig,
    testing: testingConfig
  }
};

// ===== USAGE DOCUMENTATION =====

/*
Usage Examples:

1. Environment-based configuration:
   const middleware = createEnvironmentMiddleware();
   app.use('/api', middleware);

2. Custom configuration with builder:
   const middleware = new MultiTenantConfigBuilder()
     .withDatabaseVerification(true)
     .withCache(300)
     .withLogging('info')
     .build();
   app.use('/api', middleware);

3. Pre-configured middleware:
   const { productionMiddleware } = require('./configuration-examples');
   app.use('/api', productionMiddleware);

4. Configuration for specific use cases:
   // High-performance API
   app.use('/api/fast', highPerformanceMiddleware);
   
   // Security-critical endpoints
   app.use('/api/admin', securityFocusedMiddleware);
   
   // Microservices communication
   app.use('/internal', microservicesMiddleware);

5. Testing configuration:
   // In your test files
   const { testingMiddleware } = require('./configuration-examples');
   app.use('/api', testingMiddleware);
*/ 