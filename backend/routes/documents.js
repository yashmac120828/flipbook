const express = require('express');
const { auth } = require('../middleware/auth');
const documentsController = require('../controllers/documents');
const upload = require('../middleware/upload');

const router = express.Router();

// Create a new document
router.post('/', auth, upload.fields([
  { name: 'pdfFile', maxCount: 1 },
  { name: 'videoFile', maxCount: 1 }
]), documentsController.createDocument);

// Get all documents
router.get('/', auth, documentsController.getDocuments);

// Get a single document
router.get('/:id', auth, documentsController.getDocument);

// Stream document
router.get('/:id/stream', auth, documentsController.streamDocument);

// Update document
router.put('/:id', auth, documentsController.updateDocument);

// Delete document
router.delete('/:id', auth, documentsController.deleteDocument);

// Bulk delete documents
router.post('/bulk-delete', auth, documentsController.bulkDeleteDocuments);

// Analytics
router.get('/:id/analytics', auth, async (req, res) => {
  try {
    const document = await Document.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const View = require('../models/View');
    const analytics = await View.getAnalytics(req.params.id, req.query);

    res.json({
      document: {
        id: document._id,
        title: document.title,
        stats: document.stats
      },
      analytics
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: 'Error getting analytics' });
  }
});

module.exports = router;