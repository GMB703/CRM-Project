import jwt from 'jsonwebtoken';

export const isSuperAdmin = (req, res, next) => {
  // Debug log for troubleshooting
  console.log('[isSuperAdmin] req.user:', req.user);
  console.log('[isSuperAdmin] req.multiTenant:', req.multiTenant);
  const userRole = req.user?.role || req.multiTenant?.userRole;
  if (userRole !== 'SUPER_ADMIN') {
    return res.status(403).json({ error: 'Access denied. Super admin only.' });
  }
  next();
}; 