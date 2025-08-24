import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';

/**
 * Enhanced Cloudinary Service for JobBoard Application
 * Production-ready with comprehensive error handling, validation, and security features
 */

// Configuration constants
const CLOUDINARY_CONFIG = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_FORMATS: ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png', 'gif', 'webp'],
  FOLDERS: {
    RESUMES: 'jobboard/resumes',
    COMPANY_LOGOS: 'jobboard/company-logos',
    PROFILE_PICTURES: 'jobboard/profile-pictures',
    DOCUMENTS: 'jobboard/documents'
  },
  TRANSFORMATIONS: {
    COMPANY_LOGO: {
      width: 200,
      height: 200,
      crop: 'fill',
      gravity: 'center',
      quality: 'auto',
      format: 'webp'
    },
    PROFILE_PICTURE: {
      width: 150,
      height: 150,
      crop: 'fill',
      gravity: 'face',
      quality: 'auto',
      format: 'webp'
    }
  }
};

// Initialize Cloudinary configuration
let isConfigured = false;

/**
 * Configure Cloudinary with environment variables
 * @throws {Error} If required environment variables are missing
 */
const initializeCloudinary = () => {
  if (isConfigured) return;

  const requiredEnvVars = {
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  };

  // Check for missing environment variables
  const missingVars = Object.entries(requiredEnvVars)
    .filter(([key, value]) => !value)
    .map(([key]) => `CLOUDINARY_${key.toUpperCase()}`);

  if (missingVars.length > 0) {
    throw new Error(`Missing required Cloudinary environment variables: ${missingVars.join(', ')}`);
  }

  // Configure Cloudinary
  cloudinary.config(requiredEnvVars);
  isConfigured = true;

  console.log('☁️  Cloudinary initialized successfully');
};

/**
 * Validate file before upload
 * @param {Object} fileData - File data object
 * @param {Buffer|string} fileData.buffer - File buffer or base64 string
 * @param {string} fileData.originalName - Original filename
 * @param {string} fileData.mimetype - File MIME type
 * @param {number} fileData.size - File size in bytes
 * @returns {Object} Validation result
 */
const validateFile = (fileData) => {
  const errors = [];

  // Check file size
  if (fileData.size && fileData.size > CLOUDINARY_CONFIG.MAX_FILE_SIZE) {
    errors.push(`File size exceeds limit of ${CLOUDINARY_CONFIG.MAX_FILE_SIZE / (1024 * 1024)}MB`);
  }

  // Check file format
  if (fileData.originalName) {
    const extension = fileData.originalName.split('.').pop()?.toLowerCase();
    if (extension && !CLOUDINARY_CONFIG.ALLOWED_FORMATS.includes(extension)) {
      errors.push(`File format '${extension}' is not allowed. Allowed formats: ${CLOUDINARY_CONFIG.ALLOWED_FORMATS.join(', ')}`);
    }
  }

  // Check MIME type for additional security
  if (fileData.mimetype) {
    const allowedMimeTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp'
    ];
    
    if (!allowedMimeTypes.includes(fileData.mimetype)) {
      errors.push(`MIME type '${fileData.mimetype}' is not allowed`);
    }
  }

  // Check if buffer/data exists
  if (!fileData.buffer && !fileData.data) {
    errors.push('File data is required');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Generate secure public ID for uploads
 * @param {string} folder - Upload folder
 * @param {string} originalName - Original filename
 * @param {string} userId - User ID for uniqueness
 * @returns {string} Secure public ID
 */
const generateSecurePublicId = (folder, originalName, userId = '') => {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 8);
  const extension = originalName ? originalName.split('.').pop()?.toLowerCase() : '';
  const baseName = originalName ? originalName.split('.')[0].replace(/[^a-zA-Z0-9]/g, '_') : 'file';
  
  return `${folder}/${userId ? `${userId}_` : ''}${baseName}_${timestamp}_${randomString}`;
};

/**
 * Upload file to Cloudinary with enhanced error handling
 * @param {Buffer|string} file - File buffer or base64 string
 * @param {string} folder - Cloudinary folder path
 * @param {Object} options - Additional upload options
 * @returns {Promise<Object>} Cloudinary upload result
 */
const uploadToCloudinary = async (file, folder = CLOUDINARY_CONFIG.FOLDERS.DOCUMENTS, options = {}) => {
  try {
    // Initialize Cloudinary if not already done
    initializeCloudinary();

    // Validate file if validation data is provided
    if (options.originalName || options.mimetype || options.size) {
      const validation = validateFile({
        buffer: file,
        originalName: options.originalName,
        mimetype: options.mimetype,
        size: options.size
      });

      if (!validation.isValid) {
        return {
          success: false,
          error: validation.errors.join('; '),
          errors: validation.errors
        };
      }
    }

    // Generate secure public ID
    const publicId = options.publicId || generateSecurePublicId(
      folder, 
      options.originalName, 
      options.userId
    );

    // Prepare upload options
    const uploadOptions = {
      folder,
      public_id: publicId,
      resource_type: 'auto',
      use_filename: false, // Use our generated public_id instead
      unique_filename: false,
      overwrite: false, // Prevent accidental overwrites
      invalidate: true, // Invalidate CDN cache
      // Add transformation if specified
      ...(options.transformation && { transformation: options.transformation }),
      // Add tags for better organization
      tags: [
        'jobboard',
        options.userId ? `user_${options.userId}` : 'anonymous',
        folder.split('/').pop() // Add folder name as tag
      ],
      // Add context for metadata
      context: {
        uploaded_by: options.userId || 'system',
        upload_date: new Date().toISOString(),
        original_name: options.originalName || 'unknown'
      },
      ...options.cloudinaryOptions
    };

    let uploadResult;
    
    if (Buffer.isBuffer(file)) {
      // Upload from buffer using stream
      uploadResult = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          uploadOptions,
          (error, result) => {
            if (error) {
              console.error('☁️  Cloudinary upload stream error:', error);
              reject(error);
            } else {
              resolve(result);
            }
          }
        );

        const readableStream = Readable.from(file);
        readableStream.pipe(uploadStream);
      });
    } else if (typeof file === 'string') {
      // Upload from base64 string or URL
      uploadResult = await cloudinary.uploader.upload(file, uploadOptions);
    } else {
      throw new Error('Invalid file format. Expected Buffer or base64 string.');
    }

    console.log(`☁️  File uploaded successfully to Cloudinary: ${uploadResult.public_id}`);

    return {
      success: true,
      data: {
        public_id: uploadResult.public_id,
        secure_url: uploadResult.secure_url,
        url: uploadResult.url,
        format: uploadResult.format,
        resource_type: uploadResult.resource_type,
        bytes: uploadResult.bytes,
        width: uploadResult.width,
        height: uploadResult.height,
        created_at: uploadResult.created_at,
        version: uploadResult.version,
        signature: uploadResult.signature,
        tags: uploadResult.tags
      },
    };
  } catch (error) {
    console.error('☁️  Cloudinary upload error:', {
      error: error.message,
      folder,
      options: { ...options, file: '[REDACTED]' }
    });

    // Handle specific Cloudinary errors
    let errorMessage = 'Upload failed';
    if (error.message.includes('Invalid image file')) {
      errorMessage = 'Invalid image file format';
    } else if (error.message.includes('File size too large')) {
      errorMessage = 'File size exceeds the allowed limit';
    } else if (error.message.includes('Unauthorized')) {
      errorMessage = 'Cloudinary authentication failed';
    } else if (error.http_code === 400) {
      errorMessage = `Upload failed: ${error.message}`;
    }

    return {
      success: false,
      error: errorMessage,
      originalError: error.message
    };
  }
};

/**
 * Delete file from Cloudinary
 * @param {string} publicId - Cloudinary public ID
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} Deletion result
 */
const deleteFromCloudinary = async (publicId, options = {}) => {
  try {
    initializeCloudinary();

    if (!publicId) {
      throw new Error('Public ID is required for deletion');
    }

    const deleteOptions = {
      resource_type: options.resource_type || 'auto',
      invalidate: true, // Invalidate CDN cache
      ...options.cloudinaryOptions
    };

    const result = await cloudinary.uploader.destroy(publicId, deleteOptions);
    
    console.log(`☁️  File deleted from Cloudinary: ${publicId}`, result);

    return {
      success: result.result === 'ok',
      data: result,
      deleted: result.result === 'ok',
      message: result.result === 'ok' ? 'File deleted successfully' : 'File not found or already deleted'
    };
  } catch (error) {
    console.error('☁️  Cloudinary delete error:', error);
    return {
      success: false,
      error: error.message,
      deleted: false
    };
  }
};

/**
 * Delete multiple files from Cloudinary
 * @param {string[]} publicIds - Array of public IDs to delete
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} Bulk deletion result
 */
const bulkDeleteFromCloudinary = async (publicIds, options = {}) => {
  try {
    initializeCloudinary();

    if (!Array.isArray(publicIds) || publicIds.length === 0) {
      throw new Error('Array of public IDs is required for bulk deletion');
    }

    const result = await cloudinary.api.delete_resources(publicIds, {
      resource_type: options.resource_type || 'auto',
      ...options.cloudinaryOptions
    });

    const deletedCount = Object.values(result.deleted).filter(status => status === 'deleted').length;
    const notFoundCount = Object.values(result.deleted).filter(status => status === 'not_found').length;

    console.log(`☁️  Bulk delete completed: ${deletedCount} deleted, ${notFoundCount} not found`);

    return {
      success: true,
      data: result,
      deletedCount,
      notFoundCount,
      totalProcessed: publicIds.length
    };
  } catch (error) {
    console.error('☁️  Cloudinary bulk delete error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Generate Cloudinary URL with transformations
 * @param {string} publicId - Cloudinary public ID
 * @param {Object} transformations - Transformation options
 * @returns {string} Transformed URL
 */
const generateCloudinaryUrl = (publicId, transformations = {}) => {
  try {
    initializeCloudinary();

    if (!publicId) {
      throw new Error('Public ID is required to generate URL');
    }

    return cloudinary.url(publicId, {
      secure: true,
      sign_url: transformations.sign_url || false,
      ...transformations,
    });
  } catch (error) {
    console.error('☁️  Error generating Cloudinary URL:', error);
    return null;
  }
};

/**
 * Upload resume file with specific optimizations
 * @param {Buffer} fileBuffer - Resume file buffer
 * @param {string} originalName - Original filename
 * @param {string} userId - User ID
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} Upload result
 */
const uploadResume = async (fileBuffer, originalName, userId, options = {}) => {
  return uploadToCloudinary(fileBuffer, CLOUDINARY_CONFIG.FOLDERS.RESUMES, {
    originalName,
    userId,
    resource_type: 'raw', // Important for PDF/DOC files
    ...options
  });
};

/**
 * Upload company logo with automatic optimization
 * @param {Buffer|string} file - Logo file buffer or base64
 * @param {string} companyId - Company ID
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} Upload result
 */
const uploadCompanyLogo = async (file, companyId, options = {}) => {
  return uploadToCloudinary(file, CLOUDINARY_CONFIG.FOLDERS.COMPANY_LOGOS, {
    userId: companyId,
    transformation: CLOUDINARY_CONFIG.TRANSFORMATIONS.COMPANY_LOGO,
    ...options
  });
};

/**
 * Upload profile picture with automatic optimization
 * @param {Buffer|string} file - Profile picture file buffer or base64
 * @param {string} userId - User ID
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} Upload result
 */
const uploadProfilePicture = async (file, userId, options = {}) => {
  return uploadToCloudinary(file, CLOUDINARY_CONFIG.FOLDERS.PROFILE_PICTURES, {
    userId,
    transformation: CLOUDINARY_CONFIG.TRANSFORMATIONS.PROFILE_PICTURE,
    ...options
  });
};

/**
 * Get file information from Cloudinary
 * @param {string} publicId - Public ID of the file
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} File information
 */
const getFileInfo = async (publicId, options = {}) => {
  try {
    initializeCloudinary();

    const result = await cloudinary.api.resource(publicId, {
      resource_type: options.resource_type || 'auto',
      ...options.cloudinaryOptions
    });

    return {
      success: true,
      data: {
        public_id: result.public_id,
        format: result.format,
        version: result.version,
        resource_type: result.resource_type,
        type: result.type,
        created_at: result.created_at,
        bytes: result.bytes,
        width: result.width,
        height: result.height,
        url: result.url,
        secure_url: result.secure_url,
        tags: result.tags,
        context: result.context
      }
    };
  } catch (error) {
    console.error('☁️  Error getting file info:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Health check for Cloudinary service
 * @returns {Promise<Object>} Health check result
 */
const healthCheck = async () => {
  try {
    initializeCloudinary();
    
    // Try to get account details to verify connection
    const result = await cloudinary.api.ping();
    
    return {
      success: true,
      status: 'healthy',
      message: 'Cloudinary service is operational',
      data: result
    };
  } catch (error) {
    console.error('☁️  Cloudinary health check failed:', error);
    return {
      success: false,
      status: 'unhealthy',
      error: error.message
    };
  }
};

export { 
  uploadToCloudinary, 
  deleteFromCloudinary, 
  bulkDeleteFromCloudinary,
  generateCloudinaryUrl,
  uploadResume,
  uploadCompanyLogo,
  uploadProfilePicture,
  getFileInfo,
  healthCheck,
  validateFile,
  CLOUDINARY_CONFIG
};