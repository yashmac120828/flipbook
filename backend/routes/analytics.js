const express = require('express');
const { auth } = require('../middleware/auth');
const Document = require('../models/Document');
const View = require('../models/View');

const router = express.Router();

// @route   GET /api/analytics/dashboard
// @desc    Get dashboard analytics for all user documents
// @access  Private
router.get('/dashboard', auth, async (req, res) => {
  try {
    const { timeRange = '7d' } = req.query;
    
    // Calculate date range
    let startDate = new Date();
    switch (timeRange) {
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(startDate.getDate() - 90);
        break;
      default:
        startDate.setDate(startDate.getDate() - 7);
    }

    // Get user's documents
    const documents = await Document.find({ ownerId: req.user._id });
    const documentIds = documents.map(doc => doc._id);

    if (documentIds.length === 0) {
      return res.json({
        success: true,
        dashboard: {
          totalDocuments: 0,
          totalViews: 0,
          totalUniqueViews: 0,
          totalDownloads: 0,
          totalContacts: 0,
          recentViews: [],
          topDocuments: [],
          chartData: {
            viewsOverTime: [],
            deviceBreakdown: [],
            locationStats: [],
            documentsPerformance: []
          }
        }
      });
    }

    // Aggregate total stats
    const totalStats = await View.aggregate([
      { $match: { documentId: { $in: documentIds } } },
      {
        $group: {
          _id: null,
          totalViews: { $sum: 1 },
          uniqueViews: { $sum: { $cond: ['$isUnique', 1, 0] } },
          totalDownloads: {
            $sum: {
              $size: {
                $filter: {
                  input: '$events',
                  cond: { $eq: ['$$this.type', 'download'] }
                }
              }
            }
          },
          contactsCollected: {
            $sum: { $cond: [{ $ne: ['$submittedName', null] }, 1, 0] }
          }
        }
      }
    ]);

    // Get views over time for the selected time range
    const viewsOverTime = await View.aggregate([
      { 
        $match: { 
          documentId: { $in: documentIds },
          createdAt: { $gte: startDate }
        } 
      },
      {
        $group: {
          _id: {
            $dateToString: { 
              format: '%Y-%m-%d', 
              date: '$createdAt',
              timezone: 'UTC'
            }
          },
          views: { $sum: 1 },
          unique: { $sum: { $cond: ['$isUnique', 1, 0] } },
          downloads: {
            $sum: {
              $size: {
                $filter: {
                  input: '$events',
                  cond: { $eq: ['$$this.type', 'download'] }
                }
              }
            }
          }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Get device breakdown - simplified approach
    const allViews = await View.find({ documentId: { $in: documentIds } }, 'device.isMobile userAgent');
    
    let desktop = 0, mobile = 0, tablet = 0;
    
    allViews.forEach(view => {
      const userAgent = (view.userAgent || '').toLowerCase();
      if (userAgent.includes('ipad') || userAgent.includes('tablet')) {
        tablet++;
      } else if (view.device?.isMobile) {
        mobile++;
      } else {
        desktop++;
      }
    });
    
    const total = allViews.length || 1;
    const deviceStats = [{ desktop, mobile, tablet, total }];

    // Get location stats
    const locationStats = await View.aggregate([
      { 
        $match: { 
          documentId: { $in: documentIds },
          'geo.country': { $exists: true, $ne: null }
        } 
      },
      {
        $group: {
          _id: '$geo.country',
          views: { $sum: 1 }
        }
      },
      { $sort: { views: -1 } },
      { $limit: 6 }
    ]);

    // Get recent views
    const recentViews = await View.find({ documentId: { $in: documentIds } })
      .populate('documentId', 'title publicSlug')
      .sort({ createdAt: -1 })
      .limit(10)
      .select('documentId createdAt geo.country device.browser submittedName');

    // Get top documents by views
    const topDocuments = await View.aggregate([
      { $match: { documentId: { $in: documentIds } } },
      {
        $group: {
          _id: '$documentId',
          views: { $sum: 1 },
          uniqueViews: { $sum: { $cond: ['$isUnique', 1, 0] } },
          downloads: {
            $sum: {
              $size: {
                $filter: {
                  input: '$events',
                  cond: { $eq: ['$$this.type', 'download'] }
                }
              }
            }
          },
          contacts: { $sum: { $cond: [{ $ne: ['$submittedName', null] }, 1, 0] } }
        }
      },
      { $sort: { views: -1 } },
      { $limit: 6 }
    ]);

    // Populate document details for top documents
    for (let i = 0; i < topDocuments.length; i++) {
      const doc = await Document.findById(topDocuments[i]._id).select('title publicSlug createdAt');
      topDocuments[i].document = doc;
    }

    const stats = totalStats[0] || {
      totalViews: 0,
      uniqueViews: 0,
      totalDownloads: 0,
      contactsCollected: 0
    };

    // Format views over time data
    const formattedViewsOverTime = viewsOverTime.map(item => ({
      date: new Date(item._id).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      views: item.views,
      unique: item.unique,
      downloads: item.downloads
    }));

    // Format device breakdown
    const deviceData = deviceStats[0] || { desktop: 0, mobile: 0, tablet: 0, total: 1 };
    const deviceBreakdown = [
      { 
        name: 'Desktop', 
        value: Math.round((deviceData.desktop / deviceData.total) * 100) || 0,
        color: '#3B82F6'
      },
      { 
        name: 'Mobile', 
        value: Math.round((deviceData.mobile / deviceData.total) * 100) || 0,
        color: '#10B981'
      },
      { 
        name: 'Tablet', 
        value: Math.round((deviceData.tablet / deviceData.total) * 100) || 0,
        color: '#F59E0B'
      }
    ];

    // Format location stats
    const totalLocationViews = locationStats.reduce((sum, loc) => sum + loc.views, 0);
    const formattedLocationStats = locationStats.map(item => ({
      country: item._id || 'Unknown',
      views: item.views,
      percentage: Math.round((item.views / totalLocationViews) * 100) || 0
    }));

    // Format documents performance
    const documentsPerformance = topDocuments.map(doc => ({
      name: doc.document?.title?.length > 12 
        ? doc.document.title.substring(0, 12) + '...' 
        : doc.document?.title || 'Unknown Document',
      views: doc.views,
      downloads: doc.downloads,
      contacts: doc.contacts
    }));

    res.json({
      success: true,
      dashboard: {
        totalDocuments: documents.length,
        totalViews: stats.totalViews,
        totalUniqueViews: stats.uniqueViews,
        totalDownloads: stats.totalDownloads,
        totalContacts: stats.contactsCollected,
        recentViews,
        topDocuments,
        chartData: {
          viewsOverTime: formattedViewsOverTime,
          deviceBreakdown,
          locationStats: formattedLocationStats,
          documentsPerformance
        }
      }
    });
  } catch (error) {
    console.error('Get dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting dashboard data'
    });
  }
});

// @route   GET /api/analytics/:documentId
// @desc    Get detailed analytics for a document
// @access  Private
router.get('/:documentId', auth, async (req, res) => {
  try {
    const document = await Document.findOne({
      _id: req.params.documentId,
      ownerId: req.user._id
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    const {
      startDate,
      endDate,
      groupBy = 'day'
    } = req.query;

    const options = {};
    if (startDate) options.startDate = new Date(startDate);
    if (endDate) options.endDate = new Date(endDate);
    options.groupBy = groupBy;

    const analytics = await View.getAnalytics(req.params.documentId, options);

    res.json({
      success: true,
      document: {
        id: document._id,
        title: document.title,
        publicSlug: document.publicSlug,
        createdAt: document.createdAt,
        stats: document.stats
      },
      analytics
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting analytics'
    });
  }
});

// @route   GET /api/analytics/:documentId/views
// @desc    Get raw view data for a document
// @access  Private
router.get('/:documentId/views', auth, async (req, res) => {
  try {
    const document = await Document.findOne({
      _id: req.params.documentId,
      ownerId: req.user._id
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const query = { documentId: document._id };
    
    // Add date filters if provided
    if (req.query.startDate || req.query.endDate) {
      query.createdAt = {};
      if (req.query.startDate) query.createdAt.$gte = new Date(req.query.startDate);
      if (req.query.endDate) query.createdAt.$lte = new Date(req.query.endDate);
    }

    const views = await View.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await View.countDocuments(query);

    res.json({
      success: true,
      views,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get views error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting views'
    });
  }
});

// @route   GET /api/analytics/:documentId/contacts
// @desc    Get collected contacts for a document
// @access  Private
router.get('/:documentId/contacts', auth, async (req, res) => {
  try {
    const document = await Document.findOne({
      _id: req.params.documentId,
      ownerId: req.user._id
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const contacts = await View.find({
      documentId: document._id,
      submittedName: { $exists: true, $ne: null }
    })
    .select('submittedName submittedMobile contactSubmittedAt geo device createdAt')
    .sort({ contactSubmittedAt: -1 })
    .skip(skip)
    .limit(limit);

    const total = await View.countDocuments({
      documentId: document._id,
      submittedName: { $exists: true, $ne: null }
    });

    res.json({
      success: true,
      contacts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get contacts error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting contacts'
    });
  }
});

// @route   GET /api/analytics/:documentId/export
// @desc    Export analytics data as CSV
// @access  Private
router.get('/:documentId/export', auth, async (req, res) => {
  try {
    const document = await Document.findOne({
      _id: req.params.documentId,
      ownerId: req.user._id
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    const { type = 'views' } = req.query;

    let data;
    let filename;

    if (type === 'contacts') {
      data = await View.find({
        documentId: document._id,
        submittedName: { $exists: true, $ne: null }
      })
      .select('submittedName submittedMobile contactSubmittedAt geo.country geo.city device.browser device.os device.isMobile')
      .sort({ contactSubmittedAt: -1 });

      filename = `${document.publicSlug}-contacts.csv`;
    } else {
      data = await View.find({ documentId: document._id })
        .select('createdAt ipAddress geo.country geo.city device.browser device.os device.isMobile referrer submittedName submittedMobile')
        .sort({ createdAt: -1 });

      filename = `${document.publicSlug}-views.csv`;
    }

    // Convert to CSV format
    if (data.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No data to export'
      });
    }

    let csv = '';
    
    if (type === 'contacts') {
      csv = 'Name,Mobile,Submitted At,Country,City,Browser,OS,Mobile Device\n';
      data.forEach(item => {
        csv += `"${item.submittedName || ''}","${item.submittedMobile || ''}","${item.contactSubmittedAt || ''}","${item.geo?.country || ''}","${item.geo?.city || ''}","${item.device?.browser || ''}","${item.device?.os || ''}","${item.device?.isMobile || false}"\n`;
      });
    } else {
      csv = 'Date,IP Address,Country,City,Browser,OS,Mobile Device,Referrer,Name,Mobile\n';
      data.forEach(item => {
        csv += `"${item.createdAt || ''}","${item.ipAddress || ''}","${item.geo?.country || ''}","${item.geo?.city || ''}","${item.device?.browser || ''}","${item.device?.os || ''}","${item.device?.isMobile || false}","${item.referrer || ''}","${item.submittedName || ''}","${item.submittedMobile || ''}"\n`;
      });
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error exporting data'
    });
  }
});

module.exports = router;
