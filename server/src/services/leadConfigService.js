import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Lead Configuration Service
 * Handles lead stages and lead source configurations
 */
class LeadConfigService {

  /**
   * Get all lead stages for an organization
   * @param {string} organizationId - Organization ID
   * @returns {Array} Lead stages ordered by sequence
   */
  static async getLeadStages(organizationId) {
    try {
      const stages = await prisma.leadStage.findMany({
        where: { organizationId },
        orderBy: { order: 'asc' }
      });

      return stages;
    } catch (error) {
      console.error('Error getting lead stages:', error);
      throw new Error('Failed to retrieve lead stages');
    }
  }

  /**
   * Create a new lead stage
   * @param {Object} stageData - Stage data
   * @param {string} organizationId - Organization ID
   * @returns {Object} Created stage
   */
  static async createLeadStage(stageData, organizationId) {
    try {
      const { name, description, color, order } = stageData;

      if (!name) {
        throw new Error('Stage name is required');
      }

      // Check if stage name already exists
      const existingStage = await prisma.leadStage.findFirst({
        where: { name, organizationId }
      });

      if (existingStage) {
        throw new Error('Stage with this name already exists');
      }

      // Get next order if not provided
      let finalOrder = order;
      if (!finalOrder) {
        const lastStage = await prisma.leadStage.findFirst({
          where: { organizationId },
          orderBy: { order: 'desc' }
        });
        finalOrder = (lastStage?.order || 0) + 1;
      }

      const stage = await prisma.leadStage.create({
        data: {
          name,
          description,
          color: color || '#3B82F6',
          order: finalOrder,
          organizationId
        }
      });

      return stage;
    } catch (error) {
      console.error('Error creating lead stage:', error);
      throw error;
    }
  }

  /**
   * Update lead stage
   * @param {string} stageId - Stage ID
   * @param {Object} updateData - Update data
   * @param {string} organizationId - Organization ID
   * @returns {Object} Updated stage
   */
  static async updateLeadStage(stageId, updateData, organizationId) {
    try {
      const existingStage = await prisma.leadStage.findFirst({
        where: { id: stageId, organizationId }
      });

      if (!existingStage) {
        throw new Error('Lead stage not found');
      }

      const updatedStage = await prisma.leadStage.update({
        where: { id: stageId },
        data: updateData
      });

      return updatedStage;
    } catch (error) {
      console.error('Error updating lead stage:', error);
      throw error;
    }
  }

  /**
   * Delete lead stage
   * @param {string} stageId - Stage ID
   * @param {string} organizationId - Organization ID
   * @returns {boolean} Success status
   */
  static async deleteLeadStage(stageId, organizationId) {
    try {
      const existingStage = await prisma.leadStage.findFirst({
        where: { id: stageId, organizationId }
      });

      if (!existingStage) {
        throw new Error('Lead stage not found');
      }

      // Check if any leads are using this stage
      const leadsCount = await prisma.client.count({
        where: { leadStage: existingStage.name, organizationId }
      });

      if (leadsCount > 0) {
        throw new Error(`Cannot delete stage: ${leadsCount} leads are currently in this stage`);
      }

      await prisma.leadStage.delete({
        where: { id: stageId }
      });

      return true;
    } catch (error) {
      console.error('Error deleting lead stage:', error);
      throw error;
    }
  }

  /**
   * Get all lead source configurations for an organization
   * @param {string} organizationId - Organization ID
   * @returns {Array} Lead source configurations
   */
  static async getLeadSources(organizationId) {
    try {
      const sources = await prisma.leadSourceConfig.findMany({
        where: { organizationId },
        orderBy: { name: 'asc' }
      });

      return sources;
    } catch (error) {
      console.error('Error getting lead sources:', error);
      throw new Error('Failed to retrieve lead sources');
    }
  }

  /**
   * Create a new lead source configuration
   * @param {Object} sourceData - Source data
   * @param {string} organizationId - Organization ID
   * @returns {Object} Created source
   */
  static async createLeadSource(sourceData, organizationId) {
    try {
      const { name, description, isActive = true } = sourceData;

      if (!name) {
        throw new Error('Source name is required');
      }

      // Check if source name already exists
      const existingSource = await prisma.leadSourceConfig.findFirst({
        where: { name, organizationId }
      });

      if (existingSource) {
        throw new Error('Lead source with this name already exists');
      }

      const source = await prisma.leadSourceConfig.create({
        data: {
          name,
          description,
          isActive,
          organizationId
        }
      });

      return source;
    } catch (error) {
      console.error('Error creating lead source:', error);
      throw error;
    }
  }

  /**
   * Update lead source configuration
   * @param {string} sourceId - Source ID
   * @param {Object} updateData - Update data
   * @param {string} organizationId - Organization ID
   * @returns {Object} Updated source
   */
  static async updateLeadSource(sourceId, updateData, organizationId) {
    try {
      const existingSource = await prisma.leadSourceConfig.findFirst({
        where: { id: sourceId, organizationId }
      });

      if (!existingSource) {
        throw new Error('Lead source not found');
      }

      const updatedSource = await prisma.leadSourceConfig.update({
        where: { id: sourceId },
        data: updateData
      });

      return updatedSource;
    } catch (error) {
      console.error('Error updating lead source:', error);
      throw error;
    }
  }

  /**
   * Delete lead source configuration
   * @param {string} sourceId - Source ID
   * @param {string} organizationId - Organization ID
   * @returns {boolean} Success status
   */
  static async deleteLeadSource(sourceId, organizationId) {
    try {
      const existingSource = await prisma.leadSourceConfig.findFirst({
        where: { id: sourceId, organizationId }
      });

      if (!existingSource) {
        throw new Error('Lead source not found');
      }

      await prisma.leadSourceConfig.delete({
        where: { id: sourceId }
      });

      return true;
    } catch (error) {
      console.error('Error deleting lead source:', error);
      throw error;
    }
  }

  /**
   * Reorder lead stages
   * @param {Array} stageOrders - Array of {id, order} objects
   * @param {string} organizationId - Organization ID
   * @returns {Array} Updated stages
   */
  static async reorderLeadStages(stageOrders, organizationId) {
    try {
      const updatePromises = stageOrders.map(({ id, order }) =>
        prisma.leadStage.update({
          where: { id },
          data: { order }
        })
      );

      const updatedStages = await Promise.all(updatePromises);
      return updatedStages;
    } catch (error) {
      console.error('Error reordering lead stages:', error);
      throw error;
    }
  }

}

export default LeadConfigService;
