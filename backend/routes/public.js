const express = require('express');
const Document = require('../models/Document');
const View = require('../models/View');
const { v4: uuidv4 } = require('uuid');
const mongoose = require('mongoose');

const router = express.Router();

// Get public document by slug or ID
router.get('/document/:identifier', async (req, res) => {
  try {
    const { identifier } = req.params;
    let document;

    // Check if identifier is a valid MongoDB ObjectId
    const isValidObjectId = mongoose.Types.ObjectId.isValid(identifier) && /^[0-9a-fA-F]{24}$/.test(identifier);
    
    if (isValidObjectId) {
      // Query by _id
      document = await Document.findById(identifier).select('-localPath');
    } else {
      // Query by publicSlug
      document = await Document.findOne({ publicSlug: identifier }).select('-localPath');
    }

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Check if document is accessible (not expired)
    const accessCheck = document.isAccessible();
    if (!accessCheck.accessible) {
      return res.status(410).json({ 
        error: accessCheck.reason || 'Document is no longer available' 
      });
    }

    // Transform document for frontend
    res.json({
      _id: document._id,
      title: document.title,
      description: document.description,
      isVideo: !!document.files?.video,
      files: document.files,
      allowDownload: document.allowDownload,
      requireContact: document.requireContact,
      publicSlug: document.publicSlug,
      metadata: document.metadata
    });
  } catch (error) {
    console.error('Error fetching public document:', error);
    res.status(500).json({ error: 'Error fetching document' });
  }
});

// Stream document content
router.get('/document/:slug/stream', async (req, res) => {
  try {
    const document = await Document.findOne({ publicSlug: req.params.slug });

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Check if document is accessible
    const accessCheck = document.isAccessible();
    if (!accessCheck.accessible) {
      return res.status(410).json({ error: accessCheck.reason });
    }

    // Handle video content
    if (document.files?.video?.original?.url) {
      return res.redirect(document.files.video.original.url);
    }

    // Handle PDF content
    if (document.files?.pdf?.original?.url) {
      return res.redirect(document.files.pdf.original.url);
    }

    // Handle legacy documents by redirecting to Cloudinary
    if (document.pdfUrl) {
      return res.redirect(document.pdfUrl);
    }

    res.status(404).json({ error: 'Document content not found' });
  } catch (error) {
    console.error('Error streaming document:', error);
    res.status(500).json({ error: 'Error streaming document' });
  }
});

// @route   POST /api/public/document/:identifier/view
// @desc    Track document view
// @access  Public
router.post('/document/:identifier/view', async (req, res) => {
  try {
    const { identifier } = req.params;
    console.log('Track view request for identifier:', identifier);
    
    let document;
    
    // Check if identifier is a valid MongoDB ObjectId
    const isValidObjectId = mongoose.Types.ObjectId.isValid(identifier) && /^[0-9a-fA-F]{24}$/.test(identifier);
    
    if (isValidObjectId) {
      // Query by _id
      document = await Document.findOne({
        _id: identifier,
        $or: [
          { status: 'active' },
          { 'metadata.status': 'active' }
        ]
      });
    } else {
      // Query by publicSlug
      document = await Document.findOne({
        publicSlug: identifier,
        $or: [
          { status: 'active' },
          { 'metadata.status': 'active' }
        ]
      });
    }

    console.log('Document found:', document ? `Yes (${document._id})` : 'No');
    
    if (!document) {
      console.log('Document not found for identifier:', identifier);
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    const accessCheck = document.isAccessible();
    if (!accessCheck.accessible) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    // Get client info
    let ipAddress = req.headers['x-forwarded-for'] || 
                   req.headers['x-real-ip'] ||
                   req.ip || 
                   req.connection.remoteAddress || 
                   req.socket.remoteAddress || 
                   'unknown';

    // Handle comma-separated IPs (from proxies)
    if (ipAddress.includes(',')) {
      ipAddress = ipAddress.split(',')[0].trim();
    }

    // Remove IPv6 prefix if present
    if (ipAddress.startsWith('::ffff:')) {
      ipAddress = ipAddress.substring(7);
    }

    const userAgent = req.headers['user-agent'] || '';
    const referrer = req.headers.referer || req.headers.referrer || '';
    
    // Generate or get session ID
    const sessionId = req.body.sessionId || uuidv4();

    // Check if this is a unique view (same IP + document in last 24 hours)
    // Note: Final uniqueness will be determined after contact submission
    const existingView = await View.findOne({
      documentId: document._id,
      ipAddress,
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    });

    // Initially assume unique (will be updated after contact submission if needed)
    const isUnique = !existingView;

    // Create view record with location data if provided
    const view = new View({
      documentId: document._id,
      sessionId,
      ipAddress,
      userAgent,
      referrer,
      isUnique,
      geo: req.body.location || undefined // Use browser-provided location if available
    });

    console.log('Saving view record:', { documentId: document._id, sessionId, isUnique });
    await view.save();
    console.log('View record saved successfully');

    // Update document stats
    console.log('Updating document stats...');
    await document.incrementViews(isUnique);
    console.log('Document stats updated');

    res.json({
      success: true,
      message: 'View tracked successfully',
      sessionId,
      requireContact: document.requireContact && !view.submittedName
    });
  } catch (error) {
    console.error('Track view error:', error);
    console.error('Error stack:', error.stack);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error tracking view',
      error: error.message
    });
  }
});

// @route   POST /api/public/document/:identifier/contact
// @desc    Submit contact information
// @access  Public
router.post('/document/:identifier/contact', async (req, res) => {
  try {
    const { sessionId, name, mobile } = req.body;
    const { identifier } = req.params;

    if (!sessionId || !name || !mobile) {
      return res.status(400).json({
        success: false,
        message: 'Session ID, name, and mobile are required'
      });
    }

    let document;
    
    // Check if identifier is a valid MongoDB ObjectId
    const isValidObjectId = mongoose.Types.ObjectId.isValid(identifier) && /^[0-9a-fA-F]{24}$/.test(identifier);
    
    if (isValidObjectId) {
      document = await Document.findOne({
        _id: identifier,
        status: 'active'
      });
    } else {
      document = await Document.findOne({
        publicSlug: identifier,
        status: 'active'
      });
    }

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    const accessCheck = document.isAccessible();
    if (!accessCheck.accessible) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    // Find the view record
    const view = await View.findOne({
      documentId: document._id,
      sessionId
    });

    if (!view) {
      return res.status(404).json({
        success: false,
        message: 'View session not found'
      });
    }

    // Check if this contact already exists for this document (case-insensitive)
    const existingContact = await View.contactExists(document._id, name.trim(), mobile.trim(), view._id);

    const isNewContact = !existingContact;
    const wasViewPreviouslyUnique = view.isUnique;

    // If contact exists, this view should not be counted as unique
    if (existingContact && view.isUnique) {
      view.isUnique = false;
      // Decrease document's unique view count if this was counted as unique
      if (document.stats.uniqueViews > 0) {
        document.stats.uniqueViews -= 1;
      }
    }

    // Update contact info
    await view.updateContact(name.trim(), mobile.trim());

    // Only increment contact count for truly new contacts
    if (isNewContact && !view.submittedName) {
      document.stats.contactsCollected += 1;
    }

    await document.save();

    console.log(`Contact submission: ${name.trim()} (${mobile.trim()}) - New: ${isNewContact}, View was unique: ${wasViewPreviouslyUnique}, View now unique: ${view.isUnique}`);

    res.json({
      success: true,
      message: 'Contact information saved successfully'
    });
  } catch (error) {
    console.error('Submit contact error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error saving contact information'
    });
  }
});

// @route   GET /api/public/document/:identifier/download
// @desc    Download document files
// @access  Public
router.get('/document/:identifier/download', async (req, res) => {
  try {
    const { identifier } = req.params;
    let document;
    
    // Check if identifier is a valid MongoDB ObjectId
    const isValidObjectId = mongoose.Types.ObjectId.isValid(identifier) && /^[0-9a-fA-F]{24}$/.test(identifier);
    
    if (isValidObjectId) {
      document = await Document.findOne({
        _id: identifier,
        status: 'active'
      });
    } else {
      document = await Document.findOne({
        publicSlug: identifier,
        status: 'active'
      });
    }

    if (!document || !document.isAccessible()) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    if (!document.allowDownload) {
      return res.status(403).json({
        success: false,
        message: 'Download not allowed for this document'
      });
    }

    // Track download event
    const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'] || '';
    
    // Find recent view to add download event
    const recentView = await View.findOne({
      documentId: document._id,
      ipAddress,
      createdAt: { $gte: new Date(Date.now() - 60 * 60 * 1000) } // Last hour
    }).sort({ createdAt: -1 });

    if (recentView) {
      await recentView.addEvent('download');
    }

    // Update document download stats
    document.stats.totalDownloads += 1;
    await document.save();

    // In production, you would generate a ZIP file or provide signed URLs
    // For now, return the file URLs
    res.json({
      success: true,
      message: 'Download links generated',
      files: {
        pdf: document.pdfUrl,
        video: document.videoUrl,
        // In production, you'd return a ZIP URL:
        // zipUrl: `https://your-cdn.com/downloads/${document.publicSlug}.zip`
      }
    });
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error generating download'
    });
  }
});

// @route   POST /api/public/unlock-video
// @desc    Unlock full video by capturing mobile number
// @access  Public
router.post('/unlock-video', async (req, res) => {
  try {
    const { flipbookId, mobile, sessionId } = req.body;

    console.log('Unlock video request:', { flipbookId, mobile: mobile ? '***' : 'empty', sessionId });

    if (!flipbookId) {
      return res.status(400).json({
        success: false,
        message: 'Flipbook ID is required'
      });
    }

    // Find document by ID
    const document = await Document.findById(flipbookId);
    
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'] || '';

    // Find or create view record
    let view;
    
    if (sessionId) {
      view = await View.findOne({ sessionId, documentId: document._id });
    }
    
    if (!view) {
      // Create new view if not found
      view = new View({
        documentId: document._id,
        sessionId: sessionId || uuidv4(),
        ipAddress,
        userAgent,
        referrer: req.headers.referer || ''
      });
    }

    // Update mobile and unlock status
    if (mobile && mobile.trim()) {
      view.submittedMobile = mobile.trim();
      view.contactSubmittedAt = new Date();
      await view.addEvent('video_unlocked', { mobile: mobile.trim() });
    } else {
      await view.addEvent('attempted_unlock');
    }

    view.videoUnlocked = true;
    view.videoUnlockedAt = new Date();
    
    await view.save();

    console.log('Video unlocked successfully for session:', view.sessionId);

    res.json({
      success: true,
      message: 'Video unlocked successfully',
      sessionId: view.sessionId
    });
  } catch (error) {
    console.error('Unlock video error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error unlocking video'
    });
  }
});

module.exports = router;