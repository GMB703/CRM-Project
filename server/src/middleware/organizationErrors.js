/**
 * Custom error classes for organization-related issues
 */

class OrganizationError extends Error {
  constructor(message, code = 'ORGANIZATION_ERROR', statusCode = 500) {
    super(message);
    this.name = 'OrganizationError';
    this.code = code;
    this.statusCode = statusCode;
  }
}

class OrganizationAccessError extends OrganizationError {
  constructor(message = 'Access denied: This resource belongs to a different organization', resource = null) {
    super(message, 'ORGANIZATION_ACCESS_DENIED', 403);
    this.name = 'OrganizationAccessError';
    this.resource = resource;
  }
}

class OrganizationNotFoundError extends OrganizationError {
  constructor(organizationId = null) {
    super('Organization not found or access denied', 'ORGANIZATION_NOT_FOUND', 404);
    this.name = 'OrganizationNotFoundError';
    this.organizationId = organizationId;
  }
}

class OrganizationInactiveError extends OrganizationError {
  constructor(organizationId = null) {
    super('Organization is inactive or suspended', 'ORGANIZATION_INACTIVE', 403);
    this.name = 'OrganizationInactiveError';
    this.organizationId = organizationId;
  }
}

class MissingOrganizationContextError extends OrganizationError {
  constructor() {
    super('Organization context is required for this operation', 'MISSING_ORGANIZATION_ID', 400);
    this.name = 'MissingOrganizationContextError';
  }
}

class InsufficientOrganizationRoleError extends OrganizationError {
  constructor(requiredRole, currentRole) {
    super(
      `Insufficient organization role. Required: ${requiredRole}, Current: ${currentRole}`,
      'INSUFFICIENT_ORGANIZATION_ROLE',
      403
    );
    this.name = 'InsufficientOrganizationRoleError';
    this.requiredRole = requiredRole;
    this.currentRole = currentRole;
  }
}

class MissingOrganizationPermissionsError extends OrganizationError {
  constructor(missingPermissions = [], userPermissions = []) {
    super(
      `Missing required organization permissions: ${missingPermissions.join(', ')}`,
      'MISSING_ORGANIZATION_PERMISSIONS',
      403
    );
    this.name = 'MissingOrganizationPermissionsError';
    this.missingPermissions = missingPermissions;
    this.userPermissions = userPermissions;
  }
}

class OrganizationSelectionRequiredError extends OrganizationError {
  constructor(availableOrganizations = []) {
    super('Organization selection required', 'ORGANIZATION_SELECTION_REQUIRED', 300);
    this.name = 'OrganizationSelectionRequiredError';
    this.availableOrganizations = availableOrganizations;
  }
}

class CrossOrganizationAccessError extends OrganizationError {
  constructor(requestedOrganization = null, userOrganization = null) {
    super('Cannot access resources from different organizations', 'CROSS_ORGANIZATION_ACCESS', 403);
    this.name = 'CrossOrganizationAccessError';
    this.requestedOrganization = requestedOrganization;
    this.userOrganization = userOrganization;
  }
}

/**
 * Helper functions to throw organization errors
 */
const throwOrganizationAccessError = (resource = null) => {
  throw new OrganizationAccessError(undefined, resource);
};

const throwOrganizationNotFound = (organizationId = null) => {
  throw new OrganizationNotFoundError(organizationId);
};

const throwOrganizationInactive = (organizationId = null) => {
  throw new OrganizationInactiveError(organizationId);
};

const throwMissingOrganizationContext = () => {
  throw new MissingOrganizationContextError();
};

const throwInsufficientRole = (requiredRole, currentRole) => {
  throw new InsufficientOrganizationRoleError(requiredRole, currentRole);
};

const throwMissingPermissions = (missingPermissions, userPermissions) => {
  throw new MissingOrganizationPermissionsError(missingPermissions, userPermissions);
};

const throwOrganizationSelectionRequired = (availableOrganizations) => {
  throw new OrganizationSelectionRequiredError(availableOrganizations);
};

const throwCrossOrganizationAccess = (requestedOrganization, userOrganization) => {
  throw new CrossOrganizationAccessError(requestedOrganization, userOrganization);
};

/**
 * Validation helpers
 */
const validateOrganizationContext = (req) => {
  if (!req.organizationContext || !req.organizationContext.organizationId) {
    throwMissingOrganizationContext();
  }
  return req.organizationContext;
};

const validateOrganizationRole = (req, requiredRole) => {
  const context = validateOrganizationContext(req);
  const roleHierarchy = ['GUEST', 'MEMBER', 'MANAGER', 'ADMIN', 'OWNER'];
  const userRoleLevel = roleHierarchy.indexOf(context.organizationRole);
  const requiredRoleLevel = roleHierarchy.indexOf(requiredRole);

  if (userRoleLevel < requiredRoleLevel) {
    throwInsufficientRole(requiredRole, context.organizationRole);
  }
  
  return context;
};

const validateOrganizationPermissions = (req, requiredPermissions) => {
  const context = validateOrganizationContext(req);
  const userPermissions = req.tokenContext?.permissions || [];
  const missingPermissions = requiredPermissions.filter(
    permission => !userPermissions.includes(permission)
  );

  if (missingPermissions.length > 0) {
    throwMissingPermissions(missingPermissions, userPermissions);
  }

  return context;
};

module.exports = {
  // Error classes
  OrganizationError,
  OrganizationAccessError,
  OrganizationNotFoundError,
  OrganizationInactiveError,
  MissingOrganizationContextError,
  InsufficientOrganizationRoleError,
  MissingOrganizationPermissionsError,
  OrganizationSelectionRequiredError,
  CrossOrganizationAccessError,

  // Helper functions
  throwOrganizationAccessError,
  throwOrganizationNotFound,
  throwOrganizationInactive,
  throwMissingOrganizationContext,
  throwInsufficientRole,
  throwMissingPermissions,
  throwOrganizationSelectionRequired,
  throwCrossOrganizationAccess,

  // Validation helpers
  validateOrganizationContext,
  validateOrganizationRole,
  validateOrganizationPermissions,
}; 