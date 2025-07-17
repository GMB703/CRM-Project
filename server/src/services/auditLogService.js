import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

/**
 * Log an audit event
 * @param {Object} params
 * @param {string} params.userId
 * @param {string} params.organizationId
 * @param {string} params.action
 * @param {string} [params.targetType]
 * @param {string} [params.targetId]
 * @param {Object} [params.details]
 * @param {string} [params.ipAddress]
 * @param {string} [params.userAgent]
 */
export async function logEvent({ userId, organizationId, action, targetType, targetId, details, ipAddress, userAgent }) {
  return prisma.auditLog.create({
    data: {
      userId,
      organizationId,
      action,
      targetType,
      targetId,
      details,
      ipAddress,
      userAgent,
    },
  });
}

/**
 * Fetch audit logs with optional filters and pagination
 * @param {Object} params
 * @param {Object} [params.filters]
 * @param {number} [params.skip]
 * @param {number} [params.take]
 */
export async function getAuditLogs({ filters = {}, skip = 0, take = 50 } = {}) {
  return prisma.auditLog.findMany({
    where: filters,
    orderBy: { createdAt: 'desc' },
    skip,
    take,
    include: {
      user: true,
      organization: true,
    },
  });
} 