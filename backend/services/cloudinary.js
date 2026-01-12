const cloudinary = require('cloudinary').v2;
const { Readable } = require('stream');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

/**
 * Upload file buffer to Cloudinary
 * @param {Buffer} fileBuffer - File buffer to upload
 * @param {Object} options - Upload options
 * @returns {Promise<Object>} Upload result
 */
const uploadToCloudinary = (fileBuffer, options = {}) => {
  return new Promise((resolve, reject) => {
    const {
      folder = process.env.CLOUDINARY_FOLDER || 'flipbook',
      resourceType = 'auto',
      publicId,
      transformation,
      tags = ['flipbook']
    } = options;

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: resourceType,
        public_id: publicId,
        transformation,
        tags,
        overwrite: true,
        invalidate: true,
        // For PDFs, enable page extraction
        ...(resourceType === 'image' && { 
          format: 'jpg',
          quality: 90
        }),
        // For videos, enable adaptive streaming
        ...(resourceType === 'video' && {
          eager: [
            { width: 1280, height: 720, crop: 'limit', quality: 80, format: 'mp4' },
            { width: 854, height: 480, crop: 'limit', quality: 70, format: 'mp4' }
          ]
        })
      },
      (error, result) => {
        if (error) {
          console.error('Cloudinary upload error:', error);
          reject(error);
        } else {
          resolve(result);
        }
      }
    );

    // Convert buffer to stream and pipe to Cloudinary
    const bufferStream = new Readable();
    bufferStream.push(fileBuffer);
    bufferStream.push(null);
    bufferStream.pipe(uploadStream);
  });
};

/**
 * Upload PDF as raw file (preserves PDF format and hyperlinks)
 * @param {Buffer} pdfBuffer - PDF file buffer
 * @param {string} publicId - Base public ID for the upload
 * @returns {Promise<Object>} Upload result with PDF URL
 */
const uploadPDFWithPages = async (pdfBuffer, publicId) => {
  try {
    console.log('=== Starting PDF Upload (Raw Format) ===');
    console.log('Public ID:', publicId);
    console.log('Buffer size:', pdfBuffer.length, 'bytes');
    console.log('Cloudinary config:', {
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY ? 'Set' : 'Missing',
      api_secret: process.env.CLOUDINARY_API_SECRET ? 'Set' : 'Missing',
      folder: process.env.CLOUDINARY_FOLDER || 'flipbook'
    });

    // Upload PDF as raw file to preserve PDF format and hyperlinks
    console.log('Uploading PDF as raw file (preserves hyperlinks)...');
    const pdfResult = await uploadToCloudinary(pdfBuffer, {
      folder: `${process.env.CLOUDINARY_FOLDER || 'flipbook'}/pdfs`,
      resourceType: 'raw', // Use 'raw' to preserve PDF format and hyperlinks
      publicId: `${publicId}_original`,
      tags: ['flipbook', 'pdf', 'original']
    });

    console.log('PDF uploaded as raw file successfully!');
    console.log('Raw PDF URL:', pdfResult.secure_url);
    console.log('Raw PDF public_id:', pdfResult.public_id);

    // Return PDF URL for client-side rendering with PDF.js
    console.log('=== PDF Upload Complete ===');
    console.log('PDF will be rendered client-side with PDF.js');
    console.log('Hyperlinks will be preserved and clickable');
    
    return {
      original: {
        url: pdfResult.secure_url,
        publicId: pdfResult.public_id,
        resourceType: 'raw',
        format: 'pdf'
      },
      // No page URLs needed - PDF.js will render pages client-side
      pages: [],
      totalPages: 0 // Will be determined by PDF.js on client
    };
  } catch (error) {
    console.error('=== PDF Upload Error ===');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    if (error.http_code) {
      console.error('Cloudinary HTTP code:', error.http_code);
    }
    if (error.error) {
      console.error('Cloudinary error details:', error.error);
    }
    throw error;
  }
};

/**
 * Upload video with multiple formats
 * @param {Buffer} videoBuffer - Video file buffer
 * @param {string} publicId - Public ID for the upload
 * @returns {Promise<Object>} Upload result with multiple formats
 */
const uploadVideoWithFormats = async (videoBuffer, publicId) => {
  try {
    // Upload the original video
    const videoResult = await uploadToCloudinary(videoBuffer, {
      folder: `${process.env.CLOUDINARY_FOLDER || 'flipbook'}/videos`,
      resourceType: 'video',
      publicId: `${publicId}_original`,
      tags: ['flipbook', 'video', 'original']
    });

    // Generate different format URLs
    const formats = {
      original: videoResult.secure_url,
      mp4: cloudinary.url(`${videoResult.public_id}`, {
        resource_type: 'video',
        format: 'mp4',
        quality: 80
      }),
      webm: cloudinary.url(`${videoResult.public_id}`, {
        resource_type: 'video',
        format: 'webm',
        quality: 80
      }),
      thumbnail: cloudinary.url(`${videoResult.public_id}.jpg`, {
        resource_type: 'video',
        start_offset: 2,
        width: 400,
        height: 300,
        crop: 'limit',
        quality: 85
      }),
      // Mobile optimized version
      mobile: cloudinary.url(`${videoResult.public_id}`, {
        resource_type: 'video',
        width: 720,
        height: 480,
        crop: 'limit',
        quality: 60,
        format: 'mp4'
      })
    };

    return {
      original: videoResult,
      formats,
      duration: videoResult.duration,
      width: videoResult.width,
      height: videoResult.height
    };
  } catch (error) {
    console.error('Video upload error:', error);
    throw error;
  }
};

/**
 * Delete file from Cloudinary
 * @param {string} publicId - Public ID of the file to delete
 * @param {string} resourceType - Type of resource ('image', 'video', 'raw')
 * @returns {Promise<Object>} Deletion result
 */
const deleteFromCloudinary = (publicId, resourceType = 'image') => {
  return cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
};

/**
 * Delete multiple files from Cloudinary
 * @param {Array<string>} publicIds - Array of public IDs to delete
 * @param {string} resourceType - Type of resource ('image', 'video', 'raw')
 * @returns {Promise<Object>} Deletion result
 */
const deleteBulkFromCloudinary = (publicIds, resourceType = 'image') => {
  return cloudinary.api.delete_resources(publicIds, { resource_type: resourceType });
};

/**
 * Delete folder and all its contents from Cloudinary
 * @param {string} folderPath - Path of the folder to delete
 * @returns {Promise<Object>} Deletion result
 */
const deleteFolderFromCloudinary = async (folderPath) => {
  try {
    // First delete all resources in the folder
    const resources = await cloudinary.api.resources({
      type: 'upload',
      prefix: folderPath,
      max_results: 500
    });

    if (resources.resources.length > 0) {
      const publicIds = resources.resources.map(resource => resource.public_id);
      await cloudinary.api.delete_resources(publicIds);
    }

    // Then delete the folder itself
    return await cloudinary.api.delete_folder(folderPath);
  } catch (error) {
    console.error('Error deleting folder from Cloudinary:', error);
    throw error;
  }
};

/**
 * Cleanup all files associated with a document
 * @param {Object} documentFiles - Document files object from database
 * @param {string} documentId - Document ID for logging
 * @returns {Promise<Object>} Cleanup summary
 */
const cleanupDocumentFiles = async (documentFiles, documentId) => {
  const summary = {
    deletedFiles: [],
    failedFiles: [],
    totalAttempted: 0
  };

  try {
    const deletionPromises = [];

    // Delete original PDF (raw)
    if (documentFiles?.pdf?.original?.publicId) {
      summary.totalAttempted++;
      deletionPromises.push(
        deleteFromCloudinary(documentFiles.pdf.original.publicId, 'raw')
          .then((result) => {
            summary.deletedFiles.push(`PDF (raw): ${documentFiles.pdf.original.publicId}`);
            return result;
          })
          .catch((error) => {
            summary.failedFiles.push(`PDF (raw): ${documentFiles.pdf.original.publicId} - ${error.message}`);
            return error;
          })
      );
    }

    // Delete PDF page extraction version (image)
    if (documentFiles?.pdf?.pageExtraction?.publicId) {
      summary.totalAttempted++;
      deletionPromises.push(
        deleteFromCloudinary(documentFiles.pdf.pageExtraction.publicId, 'image')
          .then((result) => {
            summary.deletedFiles.push(`PDF pages: ${documentFiles.pdf.pageExtraction.publicId}`);
            return result;
          })
          .catch((error) => {
            summary.failedFiles.push(`PDF pages: ${documentFiles.pdf.pageExtraction.publicId} - ${error.message}`);
            return error;
          })
      );
    }

    // Delete video
    if (documentFiles?.video?.original?.publicId) {
      summary.totalAttempted++;
      deletionPromises.push(
        deleteFromCloudinary(documentFiles.video.original.publicId, 'video')
          .then((result) => {
            summary.deletedFiles.push(`Video: ${documentFiles.video.original.publicId}`);
            return result;
          })
          .catch((error) => {
            summary.failedFiles.push(`Video: ${documentFiles.video.original.publicId} - ${error.message}`);
            return error;
          })
      );
    }

    // Wait for all deletions to complete
    await Promise.allSettled(deletionPromises);

    console.log(`Cloudinary cleanup for document ${documentId}:`, {
      deleted: summary.deletedFiles.length,
      failed: summary.failedFiles.length,
      total: summary.totalAttempted
    });

    return summary;
  } catch (error) {
    console.error('Error during document files cleanup:', error);
    summary.failedFiles.push(`General error: ${error.message}`);
    return summary;
  }
};

/**
 * Get file info from Cloudinary
 * @param {string} publicId - Public ID of the file
 * @param {string} resourceType - Type of resource
 * @returns {Promise<Object>} File information
 */
const getCloudinaryFileInfo = (publicId, resourceType = 'image') => {
  return cloudinary.api.resource(publicId, { resource_type: resourceType });
};

/**
 * Generate transformation URL
 * @param {string} publicId - Public ID of the file
 * @param {Object} transformations - Transformation options
 * @returns {string} Transformed URL
 */
const generateTransformationUrl = (publicId, transformations = {}) => {
  return cloudinary.url(publicId, transformations);
};

module.exports = {
  cloudinary,
  uploadToCloudinary,
  uploadPDFWithPages,
  uploadVideoWithFormats,
  deleteFromCloudinary,
  deleteBulkFromCloudinary,
  deleteFolderFromCloudinary,
  cleanupDocumentFiles,
  getCloudinaryFileInfo,
  generateTransformationUrl
};