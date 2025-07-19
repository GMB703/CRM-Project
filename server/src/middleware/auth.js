import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const isAuthenticated = async (req, res, next) => {
  try {
    console.log('Auth header:', req.headers.authorization);
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('Decoded JWT:', decoded);
    } catch (err) {
      console.error('JWT verification error:', err);
      return res.status(401).json({ error: 'Invalid token' });
    }
    // IMPORTANT: The JWT payload uses 'id', not 'userId'.
    // Always use 'decoded.id' to match the token structure and prevent authentication failures.
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: {
        organization: true,
      },
    });
    console.log('User from DB:', user);

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId,
      isSuperAdmin: user.role === 'SUPER_ADMIN',
      organization: user.organization
    };

    next();
  } catch (error) {
    console.error('Auth error:', error);
    return res.status(401).json({ error: 'Invalid token' });
  }
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    next();
  };
};

/* [STABLE COMPONENT - DO NOT MODIFY]
 * This authentication middleware is complete and stable.
 * It handles:
 * - Token validation
 * - User verification
 * - Organization context
 * - Role verification
 * 
 * Any changes to this file may affect core authentication functionality.
 * Modify only if absolutely necessary and after thorough testing.
 */ 