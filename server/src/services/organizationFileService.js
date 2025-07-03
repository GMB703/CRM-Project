import { 
  fileStorageService, 
  createUploadMiddleware,
  FileStorageError,
  InvalidFileTypeError,
  FileSizeExceededError,
  OrganizationContextError 
} from './fileStorageService.js';
import { createOrgContext } from './databaseService.js';

/**
 * Organization File Service
 * Provides organization-specific file operations with a clean API
 */
class OrganizationFileService {
  constructor() {
    this.fileStorageService = fileStorageService;
  }

  /**
   * Get upload middleware configured for the current environment
   */
  getUploadMiddleware(config = {}) {
    return createUploadMiddleware(config);
  }

  /**
   * Upload single file
   */
  async uploadFile(file, organizationId, options = {}) {
    const { projectId = null } = options;
    
    if (!organizationId) {
      throw new OrganizationContextError();
    }

    try {
      return await this.fileStorageService.processUploadedFileUniversal(
        file, 
        organizationId, 
        projectId
      );
    } catch (error) {
      throw new FileStorageError(`Failed to upload file: ${error.message}`);
    }
  }

  /**
   * Upload multiple files
   */
  async uploadFiles(files, organizationId, options = {}) {
    const { projectId = null } = options;
    
    if (!organizationId) {
      throw new OrganizationContextError();
    }

    if (!Array.isArray(files) || files.length === 0) {
      throw new FileStorageError('No files provided for upload', 'NO_FILES_PROVIDED', 400);
    }

    try {
      const uploadPromises = files.map(file => 
        this.fileStorageService.processUploadedFileUniversal(file, organizationId, projectId)
      );

      const results = await Promise.all(uploadPromises);
      
      return {
        success: true,
        uploadedFiles: results,
        totalFiles: results.length
      };
    } catch (error) {
      throw new FileStorageError(`Failed to upload files: ${error.message}`);
    }
  }

  /**
   * Get file URL by file ID
   */
  async getFileUrl(fileId, organizationId) {
    if (!organizationId) {
      throw new OrganizationContextError();
    }

    try {
      const orgContext = createOrgContext(organizationId);
      
      const fileRecord = await orgContext.findUnique('document', {
        where: { id: fileId }
      });

      if (!fileRecord) {
        throw new FileStorageError('File not found', 'FILE_NOT_FOUND', 404);
      }

      return {
        id: fileRecord.id,
        name: fileRecord.name,
        url: fileRecord.url,
        size: fileRecord.size,
        type: fileRecord.type,
        mimeType: fileRecord.mimeType,
        uploadedAt: fileRecord.uploadedAt
      };
    } catch (error) {
      if (error instanceof FileStorageError) {
        throw error;
      }
      throw new FileStorageError(`Failed to get file URL: ${error.message}`);
    }
  }

  /**
   * Get multiple file URLs by IDs
   */
  async getFileUrls(fileIds, organizationId) {
    if (!organizationId) {
      throw new OrganizationContextError();
    }

    if (!Array.isArray(fileIds) || fileIds.length === 0) {
      throw new FileStorageError('No file IDs provided', 'NO_FILE_IDS_PROVIDED', 400);
    }

    try {
      const orgContext = createOrgContext(organizationId);
      
      const fileRecords = await orgContext.findMany('document', {
        where: {
          id: {
            in: fileIds
          }
        }
      });

      return fileRecords.map(fileRecord => ({
        id: fileRecord.id,
        name: fileRecord.name,
        url: fileRecord.url,
        size: fileRecord.size,
        type: fileRecord.type,
        mimeType: fileRecord.mimeType,
        uploadedAt: fileRecord.uploadedAt
      }));
    } catch (error) {
      throw new FileStorageError(`Failed to get file URLs: ${error.message}`);
    }
  }

  /**
   * Delete file by ID
   */
  async deleteFile(fileId, organizationId) {
    if (!organizationId) {
      throw new OrganizationContextError();
    }

    try {
      const result = await this.fileStorageService.deleteFileById(fileId, organizationId);
      
      return {
        success: result,
        fileId: fileId,
        message: 'File deleted successfully'
      };
    } catch (error) {
      if (error instanceof FileStorageError) {
        throw error;
      }
      throw new FileStorageError(`Failed to delete file: ${error.message}`);
    }
  }

  /**
   * Delete multiple files by IDs
   */
  async deleteFiles(fileIds, organizationId) {
    if (!organizationId) {
      throw new OrganizationContextError();
    }

    if (!Array.isArray(fileIds) || fileIds.length === 0) {
      throw new FileStorageError('No file IDs provided', 'NO_FILE_IDS_PROVIDED', 400);
    }

    try {
      const deletePromises = fileIds.map(fileId => 
        this.fileStorageService.deleteFileById(fileId, organizationId)
      );

      const results = await Promise.allSettled(deletePromises);
      
      const successful = [];
      const failed = [];

      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          successful.push(fileIds[index]);
        } else {
          failed.push({
            fileId: fileIds[index],
            error: result.reason.message
          });
        }
      });

      return {
        success: failed.length === 0,
        deletedFiles: successful,
        failedFiles: failed,
        totalRequested: fileIds.length,
        totalDeleted: successful.length,
        totalFailed: failed.length
      };
    } catch (error) {
      throw new FileStorageError(`Failed to delete files: ${error.message}`);
    }
  }

  /**
   * Get organization files with pagination and filtering
   */
  async getOrganizationFiles(organizationId, options = {}) {
    if (!organizationId) {
      throw new OrganizationContextError();
    }

    const {
      projectId = null,
      page = 1,
      limit = 20,
      type = null,
      sortBy = 'uploadedAt',
      sortOrder = 'desc'
    } = options;

    try {
      const orgContext = createOrgContext(organizationId);
      
      // Build where clause
      const whereClause = {};
      if (projectId) {
        whereClause.projectId = projectId;
      }
      if (type) {
        whereClause.type = type;
      }

      // Calculate pagination
      const skip = (page - 1) * limit;

      // Get files with pagination
      const [files, totalCount] = await Promise.all([
        orgContext.findMany('document', {
          where: whereClause,
          orderBy: { [sortBy]: sortOrder },
          skip: skip,
          take: limit
        }),
        orgContext.count('document', {
          where: whereClause
        })
      ]);

      return {
        files: files.map(file => ({
          id: file.id,
          name: file.name,
          url: file.url,
          size: file.size,
          type: file.type,
          mimeType: file.mimeType,
          uploadedAt: file.uploadedAt,
          projectId: file.projectId
        })),
        pagination: {
          page: page,
          limit: limit,
          total: totalCount,
          pages: Math.ceil(totalCount / limit),
          hasNext: page < Math.ceil(totalCount / limit),
          hasPrev: page > 1
        }
      };
    } catch (error) {
      throw new FileStorageError(`Failed to get organization files: ${error.message}`);
    }
  }

  /**
   * Get file statistics for organization
   */
  async getFileStatistics(organizationId) {
    if (!organizationId) {
      throw new OrganizationContextError();
    }

    try {
      const orgContext = createOrgContext(organizationId);
      
      const [
        totalFiles,
        totalSize,
        filesByType,
        recentFiles
      ] = await Promise.all([
        // Total file count
        orgContext.count('document'),
        
        // Total size (aggregate)
        orgContext.aggregate('document', {
          _sum: {
            size: true
          }
        }).then(result => result._sum.size || 0),
        
        // Files by type
        orgContext.groupBy('document', {
          by: ['type'],
          _count: {
            type: true
          }
        }),
        
        // Recent files (last 7 days)
        orgContext.count('document', {
          where: {
            uploadedAt: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
            }
          }
        })
      ]);

      return {
        totalFiles,
        totalSize,
        totalSizeFormatted: this.formatFileSize(totalSize),
        filesByType: filesByType.reduce((acc, item) => {
          acc[item.type] = item._count.type;
          return acc;
        }, {}),
        recentFiles
      };
    } catch (error) {
      throw new FileStorageError(`Failed to get file statistics: ${error.message}`);
    }
  }

  /**
   * Format file size in human readable format
   */
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Validate file before upload
   */
  validateFile(file, config = {}) {
    const {
      maxSize = 10 * 1024 * 1024, // 10MB default
      allowedTypes = [
        'image/jpeg', 'image/png', 'image/gif', 'image/webp',
        'application/pdf', 'text/plain',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/zip', 'application/x-zip-compressed'
      ]
    } = config;

    if (!file) {
      throw new FileStorageError('No file provided', 'NO_FILE_PROVIDED', 400);
    }

    if (file.size > maxSize) {
      throw new FileSizeExceededError(file.size, maxSize);
    }

    if (!allowedTypes.includes(file.mimetype)) {
      throw new InvalidFileTypeError(file.mimetype);
    }

    return true;
  }
}

// Create singleton instance
const organizationFileService = new OrganizationFileService();

export {
  OrganizationFileService,
  organizationFileService
}; 