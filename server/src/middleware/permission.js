// Permission middleware for RBAC
export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    const user = req.user;
    if (!user || !allowedRoles.includes(user.role)) {
      return res.status(403).json({ error: 'Forbidden: insufficient role' });
    }
    next();
  };
}

// Permission middleware for RBAC
export function requirePermission(permission) {
  return (req, res, next) => {
    // Check permissions from JWT or multiTenant context
    const permissions =
      req.user?.permissions ||
      req.multiTenant?.tokenContext?.permissions ||
      [];
    if (!permissions.includes(permission)) {
      return res.status(403).json({ error: `Forbidden: missing permission ${permission}` });
    }
    next();
  };
}
// TODO: In future, fallback to DB lookup if permissions are not present in JWT. 