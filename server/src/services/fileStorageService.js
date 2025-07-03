import multer from 'multer';
import multerS3 from 'multer-s3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import { S3Client, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { PrismaClient } from '@prisma/client';
import { createOrgContext } from './databaseService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();

/**
 * File Storage Service Configuration
 */
const DEFAULT_CONFIG = {
  // Maximum file size (10MB default)
  maxFileSize: 10 * 1024 * 1024,
  
  // Allowed file types
  allowedMimeTypes: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'text/plain',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/zip',
    'application/x-zip-compressed'
  ],
  
  // Upload directory for local storage
  uploadDir: path.join(__dirname, '../../uploads'),
  
  // File name length
  maxFileNameLength: 255,
  
  // Organization folder structure
  organizationFolderStructure: true
};

/**
 * Custom error classes
 */
class FileStorageError extends Error {
  constructor(message, code = 'FILE_STORAGE_ERROR', statusCode = 500) {
    super(message);
    this.name = 'FileStorageError';
    this.code = code;
    this.statusCode = statusCode;
  }
}

class InvalidFileTypeError extends FileStorageError {
  constructor(mimeType) {
    super(`File type not allowed: ${mimeType}`, 'INVALID_FILE_TYPE', 400);
  }
}

class FileSizeExceededError extends FileStorageError {
  constructor(size, maxSize) {
    super(`File size ${size} exceeds maximum allowed size ${maxSize}`, 'FILE_SIZE_EXCEEDED', 400);
  }
}

class OrganizationContextError extends FileStorageError {
  constructor() {
    super('Organization context is required for file operations', 'MISSING_ORGANIZATION_CONTEXT', 400);
  }
}

/**
 * Utility functions
 */
function sanitizeFileName(fileName) {
  // Remove or replace invalid characters
  return fileName
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .replace(/_{2,}/g, '_')
    .substring(0, DEFAULT_CONFIG.maxFileNameLength);
}

function generateUniqueFileName(originalName) {
  const ext = path.extname(originalName);
  const baseName = path.basename(originalName, ext);
  const sanitizedBaseName = sanitizeFileName(baseName);
  const uniqueId = uuidv4();
  
  return `${uniqueId}_${sanitizedBaseName}${ext}`;
}

function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * Local Storage Configuration
 */
function createLocalStorage(config = DEFAULT_CONFIG) {
  return multer.diskStorage({
    destination: (req, file, cb) => {
      try {
        // Extract organization ID from request
        const organizationId = req.organizationContext?.organizationId || 
                             req.multiTenant?.organizationId;
        
        if (!organizationId) {
          return cb(new OrganizationContextError());
        }
        
        // Create organization-specific directory
        const orgDir = path.join(config.uploadDir, organizationId);
        ensureDirectoryExists(orgDir);
        
        // Create subdirectories based on file type
        const fileType = file.mimetype.split('/')[0]; // 'image', 'application', etc.
        const typeDir = path.join(orgDir, fileType);
        ensureDirectoryExists(typeDir);
        
        cb(null, typeDir);
      } catch (error) {
        cb(error);
      }
    },
    
    filename: (req, file, cb) => {
      try {
        const uniqueFileName = generateUniqueFileName(file.originalname);
        cb(null, uniqueFileName);
      } catch (error) {
        cb(error);
      }
    }
  });
}

/**
 * File filter function
 */
function createFileFilter(config = DEFAULT_CONFIG) {
  return (req, file, cb) => {
    // Check file type
    if (!config.allowedMimeTypes.includes(file.mimetype)) {
      return cb(new InvalidFileTypeError(file.mimetype));
    }
    
    // Check organization context
    const organizationId = req.organizationContext?.organizationId || 
                         req.multiTenant?.organizationId;
    
    if (!organizationId) {
      return cb(new OrganizationContextError());
    }
    
    cb(null, true);
  };
}

/**
 * Create multer middleware for local storage
 */
function createLocalUploadMiddleware(config = DEFAULT_CONFIG) {
  return multer({
    storage: createLocalStorage(config),
    fileFilter: createFileFilter(config),
    limits: {
      fileSize: config.maxFileSize,
      files: 10 // Maximum 10 files per request
    }
  });
}

/**
 * S3 Storage Configuration
 */
function createS3Client() {
  const region = process.env.AWS_REGION || 'us-east-1';
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
  
  if (!accessKeyId || !secretAccessKey) {
    throw new FileStorageError(
      'AWS credentials not configured. Set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY environment variables.',
      'AWS_CREDENTIALS_MISSING',
      500
    );
  }
  
  return new S3Client({
    region,
    credentials: {
      accessKeyId,
      secretAccessKey
    }
  });
}

function createS3Storage(config = DEFAULT_CONFIG) {
  const s3Client = createS3Client();
  const bucketName = process.env.AWS_S3_BUCKET;
  
  if (!bucketName) {
    throw new FileStorageError(
      'AWS S3 bucket not configured. Set AWS_S3_BUCKET environment variable.',
      'AWS_S3_BUCKET_MISSING',
      500
    );
  }
  
  return multerS3({
    s3: s3Client,
    bucket: bucketName,
    key: (req, file, cb) => {
      try {
        // Extract organization ID from request
        const organizationId = req.organizationContext?.organizationId || 
                             req.multiTenant?.organizationId;
        
        if (!organizationId) {
          return cb(new OrganizationContextError());
        }
        
        // Create organization-specific key structure
        const fileType = file.mimetype.split('/')[0]; // 'image', 'application', etc.
        const uniqueFileName = generateUniqueFileName(file.originalname);
        const key = `organizations/${organizationId}/${fileType}/${uniqueFileName}`;
        
        cb(null, key);
      } catch (error) {
        cb(error);
      }
    },
    metadata: (req, file, cb) => {
      cb(null, {
        fieldName: file.fieldname,
        originalName: file.originalname,
        organizationId: req.organizationContext?.organizationId || req.multiTenant?.organizationId,
        uploadedAt: new Date().toISOString()
      });
    },
    contentType: multerS3.AUTO_CONTENT_TYPE
  });
}

/**
 * Create multer middleware for S3 storage
 */
function createS3UploadMiddleware(config = DEFAULT_CONFIG) {
  return multer({
    storage: createS3Storage(config),
    fileFilter: createFileFilter(config),
    limits: {
      fileSize: config.maxFileSize,
      files: 10 // Maximum 10 files per request
    }
  });
}

/**
 * Create upload middleware based on environment
 */
function createUploadMiddleware(config = DEFAULT_CONFIG) {
  const useS3 = process.env.NODE_ENV === 'production' || process.env.USE_S3 === 'true';
  
  if (useS3) {
    return createS3UploadMiddleware(config);
  } else {
    return createLocalUploadMiddleware(config);
  }
}

/**
 * File service operations
 */
class FileStorageService {
  constructor(config = DEFAULT_CONFIG) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }
  
  /**
   * Get file URL for local storage
   */
  getLocalFileUrl(fileName, organizationId, fileType = 'application') {
    return `/uploads/${organizationId}/${fileType}/${fileName}`;
  }
  
  /**
   * Get absolute file path for local storage
   */
  getLocalFilePath(fileName, organizationId, fileType = 'application') {
    return path.join(this.config.uploadDir, organizationId, fileType, fileName);
  }
  
  /**
   * Delete file from local storage
   */
  async deleteLocalFile(fileName, organizationId, fileType = 'application') {
    try {
      const filePath = this.getLocalFilePath(fileName, organizationId, fileType);
      
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        return true;
      }
      
      return false;
    } catch (error) {
      throw new FileStorageError(`Failed to delete file: ${error.message}`);
    }
  }
  
  /**
   * Save file metadata to database
   */
  async saveFileMetadata(fileData, organizationId, projectId = null) {
    try {
      const orgContext = createOrgContext(organizationId);
      
      const fileRecord = await orgContext.create('document', {
        data: {
          name: fileData.originalname,
          type: this.getDocumentType(fileData.mimetype),
          url: fileData.url,
          size: fileData.size,
          mimeType: fileData.mimetype,
          projectId: projectId,
          uploadedAt: new Date()
        }
      });
      
      return fileRecord;
    } catch (error) {
      throw new FileStorageError(`Failed to save file metadata: ${error.message}`);
    }
  }
  
  /**
   * Get document type based on MIME type
   */
  getDocumentType(mimeType) {
    if (mimeType.startsWith('image/')) {
      return 'PHOTO';
    } else if (mimeType === 'application/pdf') {
      return 'BLUEPRINT';
    } else if (mimeType.includes('word') || mimeType.includes('document')) {
      return 'CONTRACT';
    } else {
      return 'OTHER';
    }
  }
  
  /**
   * Process uploaded file and save metadata
   */
  async processUploadedFile(file, organizationId, projectId = null) {
    try {
      // Determine file type from path structure
      const pathParts = file.path.split(path.sep);
      const fileType = pathParts[pathParts.length - 2]; // Get the type directory
      
      // Create file URL
      const fileUrl = this.getLocalFileUrl(file.filename, organizationId, fileType);
      
      // Prepare file data
      const fileData = {
        originalname: file.originalname,
        url: fileUrl,
        size: file.size,
        mimetype: file.mimetype
      };
      
      // Save metadata to database
      const fileRecord = await this.saveFileMetadata(fileData, organizationId, projectId);
      
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
      // Clean up uploaded file if database save fails
      if (file.path && fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
      
      throw new FileStorageError(`Failed to process uploaded file: ${error.message}`);
    }
  }
  
  /**
   * Get files for organization
   */
  async getOrganizationFiles(organizationId, projectId = null, options = {}) {
    try {
      const orgContext = createOrgContext(organizationId);
      
      const whereClause = projectId ? { projectId } : {};
      
      const files = await orgContext.findMany('document', {
        where: whereClause,
        orderBy: { uploadedAt: 'desc' },
        ...options
      });
      
      return files;
    } catch (error) {
      throw new FileStorageError(`Failed to get organization files: ${error.message}`);
    }
  }
  
  /**
   * Delete file by ID
   */
  async deleteFileById(fileId, organizationId) {
    try {
      const orgContext = createOrgContext(organizationId);
      
      // Get file record
      const fileRecord = await orgContext.findUnique('document', {
        where: { id: fileId }
      });
      
      if (!fileRecord) {
        throw new FileStorageError('File not found', 'FILE_NOT_FOUND', 404);
      }
      
      // Determine if it's S3 or local storage
      const useS3 = process.env.NODE_ENV === 'production' || process.env.USE_S3 === 'true';
      
      if (useS3) {
        // For S3, extract the key from the URL
        const s3Key = this.extractS3KeyFromUrl(fileRecord.url);
        await this.deleteS3File(s3Key);
      } else {
        // For local storage, extract file info from URL
        const urlParts = fileRecord.url.split('/');
        const fileName = urlParts[urlParts.length - 1];
        const fileType = urlParts[urlParts.length - 2];
        await this.deleteLocalFile(fileName, organizationId, fileType);
      }
      
      // Delete database record
      await orgContext.delete('document', {
        where: { id: fileId }
      });
      
      return true;
    } catch (error) {
      throw new FileStorageError(`Failed to delete file: ${error.message}`);
    }
  }
  
  /**
   * S3-specific operations
   */
  
  /**
   * Delete file from S3
   */
  async deleteS3File(key) {
    try {
      const s3Client = createS3Client();
      const bucketName = process.env.AWS_S3_BUCKET;
      
      if (!bucketName) {
        throw new FileStorageError('AWS S3 bucket not configured', 'AWS_S3_BUCKET_MISSING', 500);
      }
      
      const command = new DeleteObjectCommand({
        Bucket: bucketName,
        Key: key
      });
      
      await s3Client.send(command);
      return true;
    } catch (error) {
      throw new FileStorageError(`Failed to delete S3 file: ${error.message}`);
    }
  }
  
  /**
   * Get S3 file URL
   */
  getS3FileUrl(key) {
    const bucketName = process.env.AWS_S3_BUCKET;
    const region = process.env.AWS_REGION || 'us-east-1';
    
    if (!bucketName) {
      throw new FileStorageError('AWS S3 bucket not configured', 'AWS_S3_BUCKET_MISSING', 500);
    }
    
    return `https://${bucketName}.s3.${region}.amazonaws.com/${key}`;
  }
  
  /**
   * Extract S3 key from URL
   */
  extractS3KeyFromUrl(url) {
    // Handle both CloudFront and direct S3 URLs
    if (url.includes('s3.amazonaws.com') || url.includes('s3.')) {
      const parts = url.split('/');
      return parts.slice(3).join('/'); // Remove protocol and domain
    } else if (url.includes('cloudfront.net') || url.includes('amazonaws.com')) {
      const parts = url.split('/');
      return parts.slice(3).join('/'); // Remove protocol and domain
    } else {
      throw new FileStorageError('Invalid S3 URL format', 'INVALID_S3_URL', 400);
    }
  }
  
  /**
   * Process uploaded file for both local and S3 storage
   */
  async processUploadedFileUniversal(file, organizationId, projectId = null) {
    try {
      const useS3 = process.env.NODE_ENV === 'production' || process.env.USE_S3 === 'true';
      
      let fileUrl;
      if (useS3) {
        // For S3, the URL is already provided by multer-s3
        fileUrl = file.location;
      } else {
        // For local storage, construct the URL
        const pathParts = file.path.split(path.sep);
        const fileType = pathParts[pathParts.length - 2];
        fileUrl = this.getLocalFileUrl(file.filename, organizationId, fileType);
      }
      
      // Prepare file data
      const fileData = {
        originalname: file.originalname,
        url: fileUrl,
        size: file.size,
        mimetype: file.mimetype
      };
      
      // Save metadata to database
      const fileRecord = await this.saveFileMetadata(fileData, organizationId, projectId);
      
      return {
        id: fileRecord.id,
        name: fileRecord.name,
        url: fileRecord.url,
        size: fileRecord.size,
        type: fileRecord.type,
        mimeType: fileRecord.mimeType,
        uploadedAt: fileRecord.uploadedAt,
        storageType: useS3 ? 'S3' : 'LOCAL'
      };
    } catch (error) {
      // Clean up uploaded file if database save fails
      const useS3 = process.env.NODE_ENV === 'production' || process.env.USE_S3 === 'true';
      
      if (useS3 && file.key) {
        // For S3, delete the uploaded object
        try {
          await this.deleteS3File(file.key);
        } catch (deleteError) {
          console.error('Failed to clean up S3 file after error:', deleteError);
        }
      } else if (file.path && fs.existsSync(file.path)) {
        // For local storage, delete the file
        fs.unlinkSync(file.path);
      }
      
      throw new FileStorageError(`Failed to process uploaded file: ${error.message}`);
    }
  }
}

// Create singleton instance
const fileStorageService = new FileStorageService();

export {
  FileStorageService,
  fileStorageService,
  createLocalUploadMiddleware,
  createS3UploadMiddleware,
  createUploadMiddleware,
  createLocalStorage,
  createS3Storage,
  createS3Client,
  createFileFilter,
  FileStorageError,
  InvalidFileTypeError,
  FileSizeExceededError,
  OrganizationContextError,
  DEFAULT_CONFIG
}; 