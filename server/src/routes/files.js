import express from 'express';
const router = express.Router();
import { auth } from '../middleware/auth.js';
import { createMultiTenantMiddleware } from '../middleware/multiTenant.js';
import { organizationFileService } from '../services/organizationFileService.js';
import { 
  FileStorageError, 
  InvalidFileTypeError, 
  FileSizeExceededError, 
  OrganizationContextError 
} from '../services/fileStorageService.js';

// Apply authentication and organization middleware to all routes
router.use(auth);
router.use(createMultiTenantMiddleware());

/**
 * Upload single file
 * POST /api/files/upload
 */
router.post('/upload', async (req, res) => {
  try {
    // Get upload middleware configured for current environment
    const uploadMiddleware = organizationFileService.getUploadMiddleware();
    
    // Use multer middleware to handle the upload
    uploadMiddleware.single('file')(req, res, async (err) => {
      if (err) {
        if (err instanceof InvalidFileTypeError) {
          return res.status(400).json({
            success: false,
            error: 'INVALID_FILE_TYPE',
            message: err.message
          });
        }
        
        if (err instanceof FileSizeExceededError) {
          return res.status(400).json({
            success: false,
            error: 'FILE_SIZE_EXCEEDED',
            message: err.message
          });
        }
        
        if (err instanceof OrganizationContextError) {
          return res.status(400).json({
            success: false,
            error: 'MISSING_ORGANIZATION_CONTEXT',
            message: err.message
          });
        }
        
        return res.status(500).json({
          success: false,
          error: 'UPLOAD_ERROR',
          message: 'File upload failed'
        });
      }
      
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'NO_FILE_PROVIDED',
          message: 'No file was uploaded'
        });
      }
      
      try {
        const organizationId = req.organizationContext.organizationId;
        const { projectId } = req.body;
        
        // Process the uploaded file
        const result = await organizationFileService.uploadFile(
          req.file, 
          organizationId, 
          { projectId: projectId ? parseInt(projectId) : null }
        );
        
        res.status(201).json({
          success: true,
          message: 'File uploaded successfully',
          file: result
        });
      } catch (error) {
        console.error('File upload processing error:', error);
        res.status(500).json({
          success: false,
          error: 'PROCESSING_ERROR',
          message: 'Failed to process uploaded file'
        });
      }
    });
  } catch (error) {
    console.error('File upload route error:', error);
    res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Internal server error'
    });
  }
});

/**
 * Upload multiple files
 * POST /api/files/upload/batch
 */
router.post('/upload/batch', async (req, res) => {
  try {
    // Get upload middleware configured for current environment
    const uploadMiddleware = organizationFileService.getUploadMiddleware();
    
    // Use multer middleware to handle multiple file upload
    uploadMiddleware.array('files', 10)(req, res, async (err) => {
      if (err) {
        if (err instanceof InvalidFileTypeError) {
          return res.status(400).json({
            success: false,
            error: 'INVALID_FILE_TYPE',
            message: err.message
          });
        }
        
        if (err instanceof FileSizeExceededError) {
          return res.status(400).json({
            success: false,
            error: 'FILE_SIZE_EXCEEDED',
            message: err.message
          });
        }
        
        if (err instanceof OrganizationContextError) {
          return res.status(400).json({
            success: false,
            error: 'MISSING_ORGANIZATION_CONTEXT',
            message: err.message
          });
        }
        
        return res.status(500).json({
          success: false,
          error: 'UPLOAD_ERROR',
          message: 'File upload failed'
        });
      }
      
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'NO_FILES_PROVIDED',
          message: 'No files were uploaded'
        });
      }
      
      try {
        const organizationId = req.organizationContext.organizationId;
        const { projectId } = req.body;
        
        // Process the uploaded files
        const result = await organizationFileService.uploadFiles(
          req.files, 
          organizationId, 
          { projectId: projectId ? parseInt(projectId) : null }
        );
        
        res.status(201).json({
          success: true,
          message: `${result.totalFiles} files uploaded successfully`,
          ...result
        });
      } catch (error) {
        console.error('Batch file upload processing error:', error);
        res.status(500).json({
          success: false,
          error: 'PROCESSING_ERROR',
          message: 'Failed to process uploaded files'
        });
      }
    });
  } catch (error) {
    console.error('Batch file upload route error:', error);
    res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Internal server error'
    });
  }
});

/**
 * Get file statistics for organization
 * GET /api/files/statistics
 */
router.get('/statistics', async (req, res) => {
  try {
    const organizationId = req.organizationContext.organizationId;
    
    const statistics = await organizationFileService.getFileStatistics(organizationId);
    
    res.json({
      success: true,
      statistics
    });
  } catch (error) {
    console.error('Get file statistics error:', error);
    res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Failed to retrieve file statistics'
    });
  }
});

/**
 * Get file by ID
 * GET /api/files/:fileId
 */
router.get('/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;
    const organizationId = req.organizationContext.organizationId;
    
    const fileInfo = await organizationFileService.getFileUrl(fileId, organizationId);
    
    res.json({
      success: true,
      file: fileInfo
    });
  } catch (error) {
    if (error instanceof FileStorageError && error.code === 'FILE_NOT_FOUND') {
      return res.status(404).json({
        success: false,
        error: 'FILE_NOT_FOUND',
        message: 'File not found'
      });
    }
    
    console.error('Get file error:', error);
    res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Failed to retrieve file'
    });
  }
});

/**
 * Get multiple files by IDs
 * POST /api/files/batch
 */
router.post('/batch', async (req, res) => {
  try {
    const { fileIds } = req.body;
    const organizationId = req.organizationContext.organizationId;
    
    if (!Array.isArray(fileIds) || fileIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_REQUEST',
        message: 'fileIds must be a non-empty array'
      });
    }
    
    const files = await organizationFileService.getFileUrls(fileIds, organizationId);
    
    res.json({
      success: true,
      files: files,
      totalFiles: files.length
    });
  } catch (error) {
    console.error('Get multiple files error:', error);
    res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Failed to retrieve files'
    });
  }
});

/**
 * Delete file by ID
 * DELETE /api/files/:fileId
 */
router.delete('/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;
    const organizationId = req.organizationContext.organizationId;
    
    const result = await organizationFileService.deleteFile(fileId, organizationId);
    
    res.json({
      success: true,
      message: 'File deleted successfully',
      fileId: fileId
    });
  } catch (error) {
    if (error instanceof FileStorageError && error.code === 'FILE_NOT_FOUND') {
      return res.status(404).json({
        success: false,
        error: 'FILE_NOT_FOUND',
        message: 'File not found'
      });
    }
    
    console.error('Delete file error:', error);
    res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Failed to delete file'
    });
  }
});

/**
 * Delete multiple files by IDs
 * DELETE /api/files/batch
 */
router.delete('/batch', async (req, res) => {
  try {
    const { fileIds } = req.body;
    const organizationId = req.organizationContext.organizationId;
    
    if (!Array.isArray(fileIds) || fileIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_REQUEST',
        message: 'fileIds must be a non-empty array'
      });
    }
    
    const result = await organizationFileService.deleteFiles(fileIds, organizationId);
    
    res.json({
      success: result.success,
      message: `${result.totalDeleted} of ${result.totalRequested} files deleted successfully`,
      ...result
    });
  } catch (error) {
    console.error('Delete multiple files error:', error);
    res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Failed to delete files'
    });
  }
});

/**
 * Get organization files with pagination and filtering
 * GET /api/files
 */
router.get('/', async (req, res) => {
  try {
    const organizationId = req.organizationContext.organizationId;
    const {
      page = 1,
      limit = 20,
      projectId,
      type,
      sortBy = 'uploadedAt',
      sortOrder = 'desc'
    } = req.query;
    
    const options = {
      page: parseInt(page),
      limit: Math.min(100, parseInt(limit)), // Cap at 100 files per page
      projectId: projectId ? parseInt(projectId) : null,
      type,
      sortBy,
      sortOrder
    };
    
    const result = await organizationFileService.getOrganizationFiles(organizationId, options);
    
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Get organization files error:', error);
    res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Failed to retrieve organization files'
    });
  }
});

/**
 * Validate file before upload
 * POST /api/files/validate
 */
router.post('/validate', async (req, res) => {
  try {
    const { fileName, fileSize, mimeType } = req.body;
    
    if (!fileName || !fileSize || !mimeType) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_REQUEST',
        message: 'fileName, fileSize, and mimeType are required'
      });
    }
    
    // Create a mock file object for validation
    const mockFile = {
      originalname: fileName,
      size: parseInt(fileSize),
      mimetype: mimeType
    };
    
    try {
      organizationFileService.validateFile(mockFile);
      
      res.json({
        success: true,
        valid: true,
        message: 'File is valid for upload'
      });
    } catch (validationError) {
      res.status(400).json({
        success: false,
        valid: false,
        error: validationError.code || 'VALIDATION_ERROR',
        message: validationError.message
      });
    }
  } catch (error) {
    console.error('File validation error:', error);
    res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Failed to validate file'
    });
  }
});

export default router; 