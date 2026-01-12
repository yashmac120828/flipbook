const mongoose = require('mongoose');
const { nanoid } = require('nanoid');

const documentSchema = new mongoose.Schema({
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxLength: 200
  },
  description: {
    type: String,
    trim: true,
    maxLength: 1000
  },
  // File storage info
  files: {
    pdf: {
      original: {
        localPath: String,  // Local file path for PDF (legacy)
        fileName: String,   // Original file name
        fileSize: Number,   // File size in bytes
        mimeType: String,   // File MIME type
        // Cloudinary fields
        url: String,        // Cloudinary URL for raw PDF
        publicId: String,   // Cloudinary public ID
        resourceType: String, // Resource type (raw)
        format: String      // File format (pdf)
      },
      pages: [{            // Array of page image URLs
        page: Number,
        url: String,
        thumbnail: String,
        // Hyperlink metadata for this page
        hyperlinks: [{
          text: String,          // Link text or area identifier
          url: String,           // Target URL
          x: Number,             // X coordinate (percentage or pixels)
          y: Number,             // Y coordinate (percentage or pixels)
          width: Number,         // Link area width
          height: Number,        // Link area height
          type: { type: String, enum: ['url', 'email', 'internal'], default: 'url' }
        }]
      }],
      pageExtraction: {    // Info about page extraction upload
        url: String,
        publicId: String,
        resourceType: String
      }
    },
    video: {
      original: {
        url: String,
        publicId: String,
        resourceType: { type: String, default: 'video' }
      },
      formats: {
        mp4: String,
        webm: String,
        mobile: String
      },
      thumbnail: String,
      duration: Number,
      dimensions: {
        width: Number,
        height: Number
      }
    }
  },
  
  // Legacy fields (for backward compatibility)
  pdfUrl: String,
  videoUrl: String,
  thumbnailUrl: String,
  publicSlug: {
    type: String,
    unique: true,
    default: () => nanoid(10)
  },
  allowDownload: {
    type: Boolean,
    default: true
  },
  requireContact: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['processing', 'active', 'inactive', 'error'],
    default: 'processing'
  },
  metadata: {
    type: {
      type: String,
      enum: ['pdf', 'video']
    },
    uploadedAt: Date,
    lastModified: Date,
    originalName: String,
    mimeType: String,
    size: Number,
    status: {
      type: String,
      enum: ['processing', 'active', 'inactive', 'error', 'deleted'],
      default: 'processing'
    }
  },
  fileInfo: {
    pdfSize: Number,
    videoSize: Number,
    pdfOriginalName: String,
    videoOriginalName: String,
    totalPages: Number
  },
  settings: {
    expiresAt: Date,
    passwordProtected: {
      type: Boolean,
      default: false
    },
    password: String
  },
  stats: {
    totalViews: {
      type: Number,
      default: 0
    },
    uniqueViews: {
      type: Number,
      default: 0
    },
    totalDownloads: {
      type: Number,
      default: 0
    },
    contactsCollected: {
      type: Number,
      default: 0
    },
    lastViewedAt: Date
  }
}, {
  timestamps: true
});

// Indexes for better performance
documentSchema.index({ ownerId: 1, createdAt: -1 });
documentSchema.index({ status: 1 });
documentSchema.index({ 'settings.expiresAt': 1 }, { 
  expireAfterSeconds: 0,
  partialFilterExpression: { 'settings.expiresAt': { $exists: true } }
});

// Generate QR code data URL
documentSchema.methods.getQRCodeData = async function() {
  const QRCode = require('qrcode');
  const url = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/viewer/${this.publicSlug}`;
  
  try {
    return await QRCode.toDataURL(url, {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      quality: 0.92,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
  } catch (error) {
    console.error('QR Code generation error:', error);
    return null;
  }
};

// Get public URL for viewing
documentSchema.methods.getPublicUrl = function() {
  return `${process.env.FRONTEND_URL || 'http://localhost:3000'}/viewer/${this.publicSlug}`;
};

// Get download URL
documentSchema.methods.getDownloadUrl = function() {
  return `${process.env.API_BASE_URL || 'http://localhost:8001'}/api/public/download/${this.publicSlug}`;
};

// Helper method to get primary PDF URL (backward compatibility)
documentSchema.methods.getPdfUrl = function() {
  if (this.files?.pdf?.original?.url) {
    return this.files.pdf.original.url;
  }
  return this.pdfUrl; // Fallback to legacy field
};

// Helper method to get primary video URL (backward compatibility)
documentSchema.methods.getVideoUrl = function() {
  if (this.files?.video?.formats?.mp4) {
    return this.files.video.formats.mp4;
  }
  if (this.files?.video?.original?.url) {
    return this.files.video.original.url;
  }
  return this.videoUrl; // Fallback to legacy field
};

// Helper method to get thumbnail URL
documentSchema.methods.getThumbnailUrl = function() {
  // Priority: video thumbnail -> first PDF page -> legacy thumbnail
  if (this.files?.video?.thumbnail) {
    return this.files.video.thumbnail;
  }
  if (this.files?.pdf?.pages?.length > 0) {
    return this.files.pdf.pages[0].thumbnail;
  }
  return this.thumbnailUrl; // Fallback to legacy field
};

// Check if document is accessible
documentSchema.methods.isAccessible = function() {
  // Check both top-level status and metadata.status for compatibility
  const docStatus = this.status || this.metadata?.status;
  
  if (docStatus !== 'active') {
    return { accessible: false, reason: 'Document is not active' };
  }
  
  if (this.settings?.expiresAt && new Date() > this.settings.expiresAt) {
    return { accessible: false, reason: 'Document has expired' };
  }
  
  return { accessible: true };
};

// Increment view count (using atomic update to avoid version conflicts)
documentSchema.methods.incrementViews = async function(isUnique = false) {
  const update = {
    $inc: {
      'stats.totalViews': 1
    },
    $set: {
      'stats.lastViewedAt': new Date()
    }
  };
  
  if (isUnique) {
    update.$inc['stats.uniqueViews'] = 1;
  }
  
  // Use findByIdAndUpdate with atomic operations to avoid version conflicts
  return await this.constructor.findByIdAndUpdate(
    this._id,
    update,
    { new: true }
  );
};

module.exports = mongoose.model('Document', documentSchema);