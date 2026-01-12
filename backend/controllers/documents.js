const cloudinary = require('../services/cloudinary');
const Document = require('../models/Document');
const { extractHyperlinks } = require('../utils/pdfLinkExtractor');

// Create a new document
async function createDocument(req, res) {
  try {
    console.log('=== CREATE DOCUMENT REQUEST ===');
    console.log('Request body:', req.body);
    console.log('Request files:', req.files);
    console.log('Files received:', {
      hasPdfFile: !!req.files?.pdfFile,
      hasVideoFile: !!req.files?.videoFile,
      pdfFileCount: req.files?.pdfFile?.length,
      videoFileCount: req.files?.videoFile?.length
    });
    
    const { title, description } = req.body;
    const files = req.files;

    if (!files || (!files.pdfFile && !files.videoFile)) {
      console.log('ERROR: No file uploaded');
      return res.status(400).json({ error: 'No file uploaded' });
    }

    let file;
    let isVideo = false;
    const hasPdf = files.pdfFile && files.pdfFile.length > 0;
    const hasVideo = files.videoFile && files.videoFile.length > 0;
    
    console.log('Upload type:', { hasPdf, hasVideo });
    
    // Determine primary file type (video takes precedence for metadata)
    if (hasVideo) {
      file = files.videoFile[0];
      isVideo = true;
    } else {
      file = files.pdfFile[0];
    }

    // Generate a unique public ID for Cloudinary
    const publicId = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
    
    let pdfUploadResult = null;
    let videoUploadResult = null;
    
    // Upload PDF if present
    if (hasPdf) {
      const pdfFile = files.pdfFile[0];
      console.log('Starting PDF upload to Cloudinary for:', publicId, 'Buffer size:', pdfFile.buffer.length);
      console.log('🔄 Using PDF.js rendering - No image conversion!');
      
      // Upload PDF as raw file (no image conversion)
      pdfUploadResult = await cloudinary.uploadPDFWithPages(pdfFile.buffer, publicId);
      console.log('✅ PDF uploaded as raw file:', pdfUploadResult.original.url);
      console.log('📄 PDF will be rendered client-side with PDF.js');
      console.log('🔗 Hyperlinks will be preserved and clickable');
      
      // No hyperlink extraction needed - PDF.js handles this automatically
      // No page image generation - PDF.js renders pages on-demand
    }
    
    // Upload video if present
    if (hasVideo) {
      const videoFile = files.videoFile[0];
      console.log('Starting video upload to Cloudinary for:', publicId);
      videoUploadResult = await cloudinary.uploadVideoWithFormats(videoFile.buffer, publicId);
      console.log('Video upload completed:', videoUploadResult);
    }

    const document = new Document({
      title,
      description,
      ownerId: req.user._id,
      metadata: {
        type: isVideo ? 'video' : 'pdf',
        uploadedAt: new Date(),
        lastModified: new Date(),
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        status: 'processing'
      }
    });

    // Add PDF data if uploaded
    if (pdfUploadResult) {
      document.files = document.files || {};
      document.files.pdf = {
        original: {
          url: pdfUploadResult.original.url,
          publicId: pdfUploadResult.original.publicId,
          resourceType: pdfUploadResult.original.resourceType,
          format: pdfUploadResult.original.format
        }
        // No pages array - PDF.js will render pages client-side
        // No pageExtraction - not needed for raw PDF files
      };
      document.fileInfo = document.fileInfo || {};
      document.fileInfo.pdfSize = files.pdfFile[0].size;
      document.fileInfo.pdfOriginalName = files.pdfFile[0].originalname;
      // totalPages will be determined by PDF.js on client-side
    }

    // Add video data if uploaded
    if (videoUploadResult) {
      document.files = document.files || {};
      document.files.video = {
        original: {
          url: videoUploadResult.original.secure_url,
          publicId: videoUploadResult.original.public_id,
          resourceType: 'video'
        },
        formats: {
          mp4: videoUploadResult.formats.mp4,
          webm: videoUploadResult.formats.webm,
          mobile: videoUploadResult.formats.mobile
        },
        thumbnail: videoUploadResult.formats.thumbnail,
        duration: videoUploadResult.duration,
        dimensions: {
          width: videoUploadResult.width,
          height: videoUploadResult.height
        }
      };
    }
    
    // Mark document active now that upload completed
    document.metadata = document.metadata || {};
    document.metadata.status = 'active';
    document.metadata.uploadedAt = document.metadata.uploadedAt || new Date();
    document.metadata.lastModified = new Date();
    // Keep top-level status in sync for public routes and legacy code
    document.status = 'active';

    await document.save();
    console.log('Document saved successfully with ID:', document._id, 'Status:', document.status, 'Type:', document.metadata.type);
    res.status(201).json({ success: true, document });
  } catch (error) {
    console.error('Error creating document:', error);
    console.error('Error stack:', error.stack);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      name: error.name
    });
    res.status(500).json({ error: 'Error creating document' });
  }
}

// Get all documents for a user
async function getDocuments(req, res) {
  try {
    console.log('Fetching documents for user:', req.user._id);
    // Query that handles both old and new schema
    const documents = await Document.find({
      $and: [
        // Match documents owned by the user
        { ownerId: req.user._id },
        // Only return active documents
        { 'metadata.status': { $ne: 'deleted' } }
      ]
    })
    .sort('-metadata.uploadedAt -createdAt'); // Sort by upload date, fallback to creation date

    console.log('Found documents:', documents); // Debug log

    res.json({ success: true, documents });
  } catch (error) {
    console.error('Error fetching documents:', error);
    res.status(500).json({ error: 'Error fetching documents' });
  }
}

// Get a single document
async function getDocument(req, res) {
  try {
    const document = await Document.findOne({
      _id: req.params.id,
      ownerId: req.user._id,
      'metadata.status': 'active'
    });

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    res.json({ success: true, document });
  } catch (error) {
    console.error('Error fetching document:', error);
    res.status(500).json({ error: 'Error fetching document' });
  }
}

// Stream a PDF document
async function streamDocument(req, res) {
  try {
    const document = await Document.findOne({
      _id: req.params.id,
      ownerId: req.user._id,
      'metadata.status': { $in: ['active', 'processing'] }
    });

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    if (document.metadata.type === 'video') {
      return res.redirect(document.files.video.formats.mp4);
    }

    // For PDFs, redirect to Cloudinary URL
    if (!document.files?.pdf?.original?.url) {
      return res.status(404).json({ error: 'PDF file not found' });
    }

    // Redirect to the Cloudinary URL
    return res.redirect(document.files.pdf.original.url);
  } catch (error) {
    console.error('Error streaming document:', error);
    res.status(500).json({ error: 'Error streaming document' });
  }
}

// Update a document
async function updateDocument(req, res) {
  try {
    const { title, description } = req.body;

    const document = await Document.findOneAndUpdate(
      { 
        _id: req.params.id, 
        ownerId: req.user._id,
        'metadata.status': 'active'
      },
      { 
        $set: {
          title,
          description,
          'metadata.lastModified': new Date()
        }
      },
      { new: true }
    );

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    res.json({ success: true, document });
  } catch (error) {
    console.error('Error updating document:', error);
    res.status(500).json({ error: 'Error updating document' });
  }
}

// Delete a document
async function deleteDocument(req, res) {
  try {
    // Validate id and auth
    const id = req.params.id;
    console.log('deleteDocument called for id:', id, 'by user:', req.user?._id);
    // Log request context for debugging
    console.log('Request headers (Authorization):', req.headers?.authorization);
    console.log('Request body:', req.body);
    const mongoose = require('mongoose');
    if (!req.user || !req.user._id) {
      console.error('Unauthorized delete attempt, missing req.user');
      return res.status(401).json({ error: 'Unauthorized' });
    }
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      console.error('Invalid document id:', id);
      return res.status(400).json({ error: 'Invalid document id' });
    }
    if (!id) return res.status(400).json({ error: 'Document id is required' });

    const document = await Document.findOne({
      _id: id,
      ownerId: req.user._id,
      'metadata.status': { $ne: 'deleted' }
    });

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Clean up files from Cloudinary (catch errors to avoid failing entire request)
    if (document.files) {
      try {
        console.log('Preparing to cleanup Cloudinary files for document:', document._id);
        console.log('Document.files preview:', {
          pdf: Boolean(document.files?.pdf),
          video: Boolean(document.files?.video)
        });
        const cleanupResult = await cloudinary.cleanupDocumentFiles(document.files, document._id);
        console.log('Cloudinary cleanup result:', cleanupResult);
      } catch (cleanupErr) {
        console.error('Cloudinary cleanup failed for document', document._id, 'error:', cleanupErr && (cleanupErr.stack || cleanupErr.message || cleanupErr));
        if (cleanupErr && cleanupErr.response) {
          try { console.error('Cloudinary response data:', JSON.stringify(cleanupErr.response.data)); } catch(e) { /* ignore */ }
        }
        // Continue to soft-delete record even if cleanup fails
      }
    }

    // Hard delete from database after Cloudinary cleanup
    try {
      console.log('Deleting document from database:', document._id);
      await Document.deleteOne({ _id: document._id });
      console.log('Document deleted from database successfully');
    } catch (deleteErr) {
      console.error('Failed to delete document from database', document._id, deleteErr && (deleteErr.stack || deleteErr.message || deleteErr));
      return res.status(500).json({ error: 'Failed to delete document from database' });
    }

    res.json({ success: true, message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Error deleting document:', error && (error.stack || error));
    // Provide more context when possible
    const message = error?.message || 'Error deleting document';
    // Include additional error details for debugging (avoid leaking secrets)
    const details = {};
    if (error && error.response) {
      details.response = {
        status: error.response.status,
        data: error.response.data
      };
    }
    console.error('Delete error details:', details);
    res.status(500).json({ error: message });
  }
}

// Bulk delete documents (accepts array of ids in body)
async function bulkDeleteDocuments(req, res) {
  try {
    const ids = Array.isArray(req.body.ids) ? req.body.ids : [];
    console.log('bulkDeleteDocuments called for ids:', ids, 'by user:', req.user?._id);
    // Debug context
    console.log('Request headers (Authorization):', req.headers?.authorization);
    console.log('Request body:', req.body);
    if (!req.user || !req.user._id) {
      console.error('Unauthorized bulk delete attempt, missing req.user');
      return res.status(401).json({ error: 'Unauthorized' });
    }
    if (!Array.isArray(ids) || ids.length === 0) {
      console.error('Invalid ids payload for bulk delete:', ids);
      return res.status(400).json({ error: 'Invalid ids' });
    }

    const mongoose = require('mongoose');
    const results = [];

    // Process sequentially to avoid hitting Cloudinary rate limits; could be parallelized if desired
    for (const id of ids) {
      try {
        console.log('Processing delete for id:', id);
        if (!mongoose.Types.ObjectId.isValid(id)) {
          console.warn('Skipping invalid id in bulk delete:', id);
          results.push({ id, success: false, error: 'Invalid id' });
          continue;
        }

        const doc = await Document.findById(id);
        if (!doc) {
          console.warn('Document not found for id:', id);
          results.push({ id, success: false, error: 'Not found' });
          continue;
        }

        if (doc.files) {
          try {
            console.log('Cleaning up Cloudinary files for doc:', doc._id, 'files preview:', {
              pdf: Boolean(doc.files?.pdf),
              video: Boolean(doc.files?.video)
            });
            await cloudinary.cleanupDocumentFiles(doc.files, doc._id);
          } catch (cleanupErr) {
            console.error('Cloudinary cleanup failed for document', doc._id, 'error:', cleanupErr && (cleanupErr.stack || cleanupErr.message || cleanupErr));
            if (cleanupErr && cleanupErr.response) {
              try { console.error('Cloudinary response data:', JSON.stringify(cleanupErr.response.data)); } catch(e) { /* ignore */ }
            }
            // continue; we'll still mark deleted
          }
        }

        // Hard delete from database
        await Document.deleteOne({ _id: doc._id });
        console.log('Deleted document from database:', id);
        results.push({ id, success: true });
      } catch (err) {
        console.error('Error deleting document id in bulk:', id, err && (err.stack || err.message || err));
        results.push({ id, success: false, error: err?.message || 'Error' });
      }
    }

    res.json({ success: true, results });
  } catch (error) {
    console.error('Error in bulkDeleteDocuments:', error && (error.stack || error));
    res.status(500).json({ success: false, error: 'Error deleting documents' });
  }
}

module.exports = {
  createDocument,
  getDocuments,
  getDocument,
  streamDocument,
  updateDocument,
  deleteDocument,
  bulkDeleteDocuments
};