import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

/**
 * User Service for Multi-Tenant Organization Operations
 * Handles all user-related operations with organization context
 */

class UserService {
  
  /**
   * Get user by ID with organization context
   * @param {string} userId - User ID
   * @param {boolean} includeOrganizations - Include all accessible organizations
   * @returns {Object|null} User with organization data
   */
  static async getUserById(userId, includeOrganizations = true) {
    try {
      if (!userId) {
        return null;
      }

      const includeClause = {
        organization: {
          select: {
            id: true,
            name: true,
            code: true,
            logo: true,
            primaryColor: true,
            isActive: true
          }
        }
      };

      if (includeOrganizations) {
        includeClause.userOrganizations = {
          where: { isActive: true },
          include: {
            organization: {
              select: {
                id: true,
                name: true,
                code: true,
                logo: true,
                isActive: true
              }
            }
          }
        };
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: includeClause
      });

      return user;
    } catch (error) {
      console.error('Error getting user by ID:', error);
      return null; // Return null instead of throwing for invalid IDs
    }
  }

  /**
   * Get users by organization with role filtering
   * @param {string} organizationId - Organization ID
   * @param {string[]} roles - Optional role filter
   * @param {string[]} organizationRoles - Optional organization role filter
   * @returns {Array} Users in the organization
   */
  static async getUsersByOrganization(organizationId, roles = null, organizationRoles = null) {
    try {
      const whereClause = { organizationId };
      
      if (roles && roles.length > 0) {
        whereClause.role = { in: roles };
      }
      
      if (organizationRoles && organizationRoles.length > 0) {
        whereClause.organizationRole = { in: organizationRoles };
      }

      const users = await prisma.user.findMany({
        where: whereClause,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          avatar: true,
          role: true,
          organizationRole: true,
          isActive: true,
          lastLoginAt: true,
          createdAt: true,
          organization: {
            select: {
              id: true,
              name: true,
              code: true
            }
          }
        },
        orderBy: [
          { role: 'asc' },
          { firstName: 'asc' }
        ]
      });

      return users;
    } catch (error) {
      console.error('Error getting users by organization:', error);
      throw new Error('Failed to retrieve organization users');
    }
  }

  /**
   * Create a new user with organization context
   * @param {Object} userData - User data
   * @param {string} organizationId - Organization ID
   * @param {string} organizationRole - Organization role (default: MEMBER)
   * @returns {Object} Created user
   */
  static async createUser(userData, organizationId, organizationRole = 'MEMBER') {
    try {
      const { email, password, firstName, lastName, phone, role = 'USER' } = userData;

      // Check if user already exists in this organization
      const existingUser = await prisma.user.findFirst({
        where: { email, organizationId }
      });

      if (existingUser) {
        throw new Error('User already exists in this organization');
      }

      // Verify organization exists and is active
      const organization = await prisma.organization.findUnique({
        where: { id: organizationId }
      });

      if (!organization || !organization.isActive) {
        throw new Error('Invalid or inactive organization');
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Create user
      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          firstName,
          lastName,
          phone,
          role,
          organizationId,
          organizationRole
        },
        include: {
          organization: {
            select: {
              id: true,
              name: true,
              code: true,
              logo: true,
              primaryColor: true
            }
          }
        }
      });

      // Create UserOrganization record
      await prisma.userOrganization.create({
        data: {
          userId: user.id,
          organizationId,
          role: organizationRole,
          isActive: true,
          joinedAt: new Date()
        }
      });

      // Remove password from response
      const { password: _, ...userResponse } = user;
      return userResponse;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  /**
   * Update user information
   * @param {string} userId - User ID
   * @param {Object} updateData - Data to update
   * @param {string} requesterId - ID of user making the request
   * @returns {Object} Updated user
   */
  static async updateUser(userId, updateData, requesterId) {
    try {
      // Get the user being updated and the requester
      const [targetUser, requester] = await Promise.all([
        this.getUserById(userId, false),
        this.getUserById(requesterId, true)
      ]);

      if (!targetUser) {
        throw new Error('User not found');
      }

      // Check if requester has permission to update this user
      const canUpdate = await this.canManageUser(requester, targetUser);
      if (!canUpdate) {
        throw new Error('Insufficient permissions to update this user');
      }

      // Prepare update data (exclude sensitive fields)
      const allowedFields = ['firstName', 'lastName', 'phone', 'avatar', 'isActive'];
      const filteredData = {};
      
      for (const [key, value] of Object.entries(updateData)) {
        if (allowedFields.includes(key)) {
          filteredData[key] = value;
        }
      }

      // Update user
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: filteredData,
        include: {
          organization: {
            select: {
              id: true,
              name: true,
              code: true,
              logo: true,
              primaryColor: true
            }
          }
        }
      });

      // Remove password from response
      const { password: _, ...userResponse } = updatedUser;
      return userResponse;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  /**
   * Update user role within organization
   * @param {string} userId - User ID
   * @param {string} newRole - New UserRole
   * @param {string} newOrgRole - New OrganizationRole
   * @param {string} requesterId - ID of user making the request
   * @returns {Object} Updated user
   */
  static async updateUserRole(userId, newRole, newOrgRole, requesterId) {
    try {
      const [targetUser, requester] = await Promise.all([
        this.getUserById(userId, false),
        this.getUserById(requesterId, true)
      ]);

      if (!targetUser) {
        throw new Error('User not found');
      }

      // Check if requester has permission to change roles
      const canUpdateRoles = await this.canManageUserRoles(requester, targetUser);
      if (!canUpdateRoles) {
        throw new Error('Insufficient permissions to update user roles');
      }

      // Update user roles
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          role: newRole,
          organizationRole: newOrgRole
        },
        include: {
          organization: {
            select: {
              id: true,
              name: true,
              code: true
            }
          }
        }
      });

      // Update UserOrganization record
      await prisma.userOrganization.updateMany({
        where: {
          userId: userId,
          organizationId: targetUser.organizationId,
          isActive: true
        },
        data: {
          role: newOrgRole
        }
      });

      const { password: _, ...userResponse } = updatedUser;
      return userResponse;
    } catch (error) {
      console.error('Error updating user role:', error);
      throw error;
    }
  }

  /**
   * Grant user access to additional organization
   * @param {string} userId - User ID
   * @param {string} organizationId - Organization ID to grant access to
   * @param {string} organizationRole - Role in the new organization
   * @param {string} requesterId - ID of user making the request
   * @returns {Object} UserOrganization record
   */
  static async grantOrganizationAccess(userId, organizationId, organizationRole, requesterId) {
    try {
      // Verify requester has admin access to the target organization
      const requester = await this.getUserById(requesterId, true);
      const hasAdminAccess = requester.userOrganizations.some(
        uo => uo.organizationId === organizationId && 
              uo.isActive && 
              ['OWNER', 'ORG_ADMIN'].includes(uo.role)
      );

      if (!hasAdminAccess) {
        throw new Error('Insufficient permissions to grant organization access');
      }

      // Check if user already has access
      const existingAccess = await prisma.userOrganization.findFirst({
        where: {
          userId,
          organizationId,
          isActive: true
        }
      });

      if (existingAccess) {
        throw new Error('User already has access to this organization');
      }

      // Verify organization exists and is active
      const organization = await prisma.organization.findUnique({
        where: { id: organizationId }
      });

      if (!organization || !organization.isActive) {
        throw new Error('Invalid or inactive organization');
      }

      // Create UserOrganization record
      const userOrgAccess = await prisma.userOrganization.create({
        data: {
          userId,
          organizationId,
          role: organizationRole,
          isActive: true,
          joinedAt: new Date()
        },
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true
            }
          },
          organization: {
            select: {
              name: true,
              code: true
            }
          }
        }
      });

      return userOrgAccess;
    } catch (error) {
      console.error('Error granting organization access:', error);
      throw error;
    }
  }

  /**
   * Revoke user access from organization
   * @param {string} userId - User ID
   * @param {string} organizationId - Organization ID
   * @param {string} requesterId - ID of user making the request
   * @returns {boolean} Success status
   */
  static async revokeOrganizationAccess(userId, organizationId, requesterId) {
    try {
      // Verify requester has admin access to the organization
      const requester = await this.getUserById(requesterId, true);
      const hasAdminAccess = requester.userOrganizations.some(
        uo => uo.organizationId === organizationId && 
              uo.isActive && 
              ['OWNER', 'ORG_ADMIN'].includes(uo.role)
      );

      if (!hasAdminAccess) {
        throw new Error('Insufficient permissions to revoke organization access');
      }

      // Cannot revoke access from the user's primary organization
      const targetUser = await this.getUserById(userId, false);
      if (targetUser.organizationId === organizationId) {
        throw new Error('Cannot revoke access from user\'s primary organization');
      }

      // Deactivate UserOrganization record
      await prisma.userOrganization.updateMany({
        where: {
          userId,
          organizationId,
          isActive: true
        },
        data: {
          isActive: false,
          leftAt: new Date()
        }
      });

      return true;
    } catch (error) {
      console.error('Error revoking organization access:', error);
      throw error;
    }
  }

  /**
   * Check if a user can manage another user
   * @param {Object} manager - Manager user object
   * @param {Object} target - Target user object
   * @returns {boolean} Can manage status
   */
  static async canManageUser(manager, target) {
    // Same organization check
    if (manager.organizationId !== target.organizationId) {
      return false;
    }

    // Role hierarchy check
    const roleHierarchy = ['VIEWER', 'USER', 'ORG_ADMIN'];
    const managerLevel = roleHierarchy.indexOf(manager.role);
    const targetLevel = roleHierarchy.indexOf(target.role);

    // Managers can manage users at their level or below
    return managerLevel >= 2 && managerLevel >= targetLevel; // ORG_ADMIN
  }

  /**
   * Check if a user can manage roles of another user
   * @param {Object} manager - Manager user object
   * @param {Object} target - Target user object
   * @returns {boolean} Can manage roles status
   */
  static async canManageUserRoles(manager, target) {
    // Same organization check
    if (manager.organizationId !== target.organizationId) {
      return false;
    }

    // Only ORG_ADMIN and above can change roles
    return ['ORG_ADMIN'].includes(manager.role) && 
           ['ORG_ADMIN', 'OWNER'].includes(manager.organizationRole);
  }

  /**
   * Get user's accessible organizations
   * @param {string} userId - User ID
   * @returns {Array} Accessible organizations
   */
  static async getUserOrganizations(userId) {
    try {
      const userOrganizations = await prisma.userOrganization.findMany({
        where: {
          userId,
          isActive: true
        },
        include: {
          organization: {
            select: {
              id: true,
              name: true,
              code: true,
              logo: true,
              primaryColor: true,
              isActive: true
            }
          }
        },
        orderBy: { joinedAt: 'asc' }
      });

      return userOrganizations.map(uo => ({
        ...uo.organization,
        userRole: uo.role,
        joinedAt: uo.joinedAt,
        isPrimary: false // Will be set by calling function if needed
      }));
    } catch (error) {
      console.error('Error getting user organizations:', error);
      throw new Error('Failed to retrieve user organizations');
    }
  }

  /**
   * Validate user access to organization
   * @param {string} userId - User ID
   * @param {string} organizationId - Organization ID
   * @param {string} minimumRole - Minimum required role
   * @returns {Object|null} Access details or null if no access
   */
  static async validateOrganizationAccess(userId, organizationId, minimumRole = 'GUEST') {
    try {
      const userOrgAccess = await prisma.userOrganization.findFirst({
        where: {
          userId,
          organizationId,
          isActive: true
        },
        include: {
          organization: {
            select: {
              id: true,
              name: true,
              code: true,
              isActive: true
            }
          }
        }
      });

      if (!userOrgAccess || !userOrgAccess.organization.isActive) {
        return null;
      }

      // Check role hierarchy
      const roleHierarchy = ['GUEST', 'MEMBER', 'ORG_ADMIN', 'OWNER'];
      const userRoleLevel = roleHierarchy.indexOf(userOrgAccess.role);
      const minimumRoleLevel = roleHierarchy.indexOf(minimumRole);

      if (userRoleLevel < minimumRoleLevel) {
        return null;
      }

      return {
        organizationId: userOrgAccess.organizationId,
        role: userOrgAccess.role,
        organization: userOrgAccess.organization,
        joinedAt: userOrgAccess.joinedAt
      };
    } catch (error) {
      console.error('Error validating organization access:', error);
      throw new Error('Failed to validate organization access');
    }
  }
}

export default UserService; 