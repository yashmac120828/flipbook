const mongoose = require('mongoose');
const geoip = require('geoip-lite');
const useragent = require('useragent');

const viewSchema = new mongoose.Schema({
  documentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document',
    required: true
  },
  sessionId: {
    type: String,
    required: true
  },
  ipAddress: {
    type: String,
    required: true
  },
  userAgent: {
    type: String,
    required: true
  },
  referrer: {
    type: String,
    default: ''
  },
  geo: {
    country: String,
    region: String,
    city: String,
    timezone: String,
    coordinates: {
      lat: Number,
      lon: Number
    }
  },
  device: {
    browser: String,
    os: String,
    device: String,
    isMobile: {
      type: Boolean,
      default: false
    }
  },
  submittedName: {
    type: String,
    trim: true
  },
  submittedMobile: {
    type: String,
    trim: true
  },
  contactSubmittedAt: {
    type: Date
  },
  events: [{
    type: {
      type: String,
      enum: ['view', 'page_turn', 'video_play', 'download', 'contact_submit', 'video_unlocked', 'attempted_unlock'],
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    data: mongoose.Schema.Types.Mixed
  }],
  videoUnlocked: {
    type: Boolean,
    default: false
  },
  videoUnlockedAt: {
    type: Date
  },
  duration: {
    type: Number, // Duration in seconds
    default: 0
  },
  isUnique: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes for analytics queries
viewSchema.index({ documentId: 1, createdAt: -1 });
viewSchema.index({ ipAddress: 1, documentId: 1 });
viewSchema.index({ sessionId: 1 });
viewSchema.index({ submittedName: 1 }, { sparse: true });
viewSchema.index({ 'geo.country': 1 });
viewSchema.index({ 'device.browser': 1 });

// Pre-save middleware to parse user agent and IP
viewSchema.pre('save', function(next) {
  if (this.isNew) {
    // Parse user agent
    try {
      const agent = useragent.parse(this.userAgent);
      this.device = {
        browser: agent.toAgent(),
        os: agent.os.toString(),
        device: agent.device.toString(),
        isMobile: agent.device.family === 'iPhone' || 
                  agent.device.family === 'iPad' || 
                  agent.os.family === 'Android' ||
                  /Mobile|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(this.userAgent)
      };
    } catch (error) {
      console.error('Error parsing user agent:', error);
    }

    // Parse IP for geolocation
    try {
      const geo = geoip.lookup(this.ipAddress);
      if (geo) {
        this.geo = {
          country: geo.country,
          region: geo.region,
          city: geo.city,
          timezone: geo.timezone,
          coordinates: {
            lat: geo.ll[0],
            lon: geo.ll[1]
          }
        };
      }
    } catch (error) {
      console.error('Error parsing IP geolocation:', error);
    }
  }
  
  next();
});

// Method to add event
viewSchema.methods.addEvent = function(eventType, data = {}) {
  this.events.push({
    type: eventType,
    timestamp: new Date(),
    data
  });
  return this.save();
};

// Method to update contact info
viewSchema.methods.updateContact = function(name, mobile) {
  this.submittedName = name;
  this.submittedMobile = mobile;
  this.contactSubmittedAt = new Date();
  
  // Add contact submit event
  this.events.push({
    type: 'contact_submit',
    timestamp: new Date(),
    data: { name, mobile }
  });
  
  return this.save();
};

// Static method to check if contact exists for a document
viewSchema.statics.contactExists = async function(documentId, name, mobile, excludeViewId = null) {
  const query = {
    documentId,
    submittedName: { $regex: new RegExp(`^${name.trim()}$`, 'i') }, // Case-insensitive name match
    submittedMobile: mobile.trim()
  };
  
  if (excludeViewId) {
    query._id = { $ne: excludeViewId };
  }
  
  return await this.findOne(query);
};

// Static method to get unique contact count for a document
viewSchema.statics.getUniqueContactCount = async function(documentId) {
  const uniqueContacts = await this.aggregate([
    { 
      $match: { 
        documentId: new mongoose.Types.ObjectId(documentId),
        submittedName: { $exists: true, $ne: null },
        submittedMobile: { $exists: true, $ne: null }
      } 
    },
    {
      $group: {
        _id: {
          name: { $toLower: '$submittedName' }, // Case-insensitive grouping
          mobile: '$submittedMobile'
        }
      }
    },
    { $count: 'uniqueContacts' }
  ]);
  
  return uniqueContacts[0]?.uniqueContacts || 0;
};

// Static method to recalculate document stats
viewSchema.statics.recalculateDocumentStats = async function(documentId) {
  const Document = require('./Document');
  
  const stats = await this.aggregate([
    { $match: { documentId: new mongoose.Types.ObjectId(documentId) } },
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
        }
      }
    }
  ]);
  
  const uniqueContacts = await this.getUniqueContactCount(documentId);
  
  const finalStats = stats[0] || { totalViews: 0, uniqueViews: 0, totalDownloads: 0 };
  
  await Document.findByIdAndUpdate(documentId, {
    $set: {
      'stats.totalViews': finalStats.totalViews,
      'stats.uniqueViews': finalStats.uniqueViews,
      'stats.totalDownloads': finalStats.totalDownloads,
      'stats.contactsCollected': uniqueContacts,
      'stats.lastViewedAt': new Date()
    }
  });
  
  return {
    totalViews: finalStats.totalViews,
    uniqueViews: finalStats.uniqueViews,
    totalDownloads: finalStats.totalDownloads,
    contactsCollected: uniqueContacts
  };
};

// Static method to get analytics for a document
viewSchema.statics.getAnalytics = async function(documentId, options = {}) {
  const {
    startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
    endDate = new Date(),
    groupBy = 'day'
  } = options;

  const matchStage = {
    documentId: new mongoose.Types.ObjectId(documentId),
    createdAt: { $gte: startDate, $lte: endDate }
  };

  const pipeline = [
    { $match: matchStage },
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
        },
        countries: { $addToSet: '$geo.country' },
        browsers: { $addToSet: '$device.browser' },
        devices: { $addToSet: '$device.device' },
        mobileViews: { $sum: { $cond: ['$device.isMobile', 1, 0] } },
        desktopViews: { $sum: { $cond: [{ $not: '$device.isMobile' }, 1, 0] } }
      }
    }
  ];

  const [analytics] = await this.aggregate(pipeline);
  
  // Get top countries
  const topCountries = await this.aggregate([
    { $match: matchStage },
    { $group: { _id: '$geo.country', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 10 }
  ]);

  // Get top browsers
  const topBrowsers = await this.aggregate([
    { $match: matchStage },
    { $group: { _id: '$device.browser', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 10 }
  ]);

  // Get views over time
  let groupByFormat;
  switch (groupBy) {
    case 'hour':
      groupByFormat = { 
        $dateToString: { 
          format: '%Y-%m-%d %H:00', 
          date: '$createdAt',
          timezone: 'UTC'
        }
      };
      break;
    case 'day':
      groupByFormat = { 
        $dateToString: { 
          format: '%Y-%m-%d', 
          date: '$createdAt',
          timezone: 'UTC'
        }
      };
      break;
    case 'week':
      groupByFormat = {
        $dateToString: {
          format: '%Y-W%V',
          date: '$createdAt',
          timezone: 'UTC'
        }
      };
      break;
    default:
      groupByFormat = { 
        $dateToString: { 
          format: '%Y-%m-%d', 
          date: '$createdAt',
          timezone: 'UTC'
        }
      };
  }

  const viewsOverTime = await this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: groupByFormat,
        views: { $sum: 1 },
        uniqueViews: { $sum: { $cond: ['$isUnique', 1, 0] } }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  return {
    summary: analytics || {
      totalViews: 0,
      uniqueViews: 0,
      totalDownloads: 0,
      contactsCollected: 0,
      mobileViews: 0,
      desktopViews: 0
    },
    topCountries,
    topBrowsers,
    viewsOverTime
  };
};

module.exports = mongoose.model('View', viewSchema);