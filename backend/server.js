const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth.js');
const documentRoutes = require('./routes/documents.js');
const publicRoutes = require('./routes/public.js');
const analyticsRoutes = require('./routes/analytics.js');

// Import middleware
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 8000;

// Security middleware
app.use(helmet());
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});
app.use(limiter);

// CORS configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:3000', 'http://localhost:5173'];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, postman)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// Logging middleware
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API Documentation Landing Page
app.get('/', (req, res) => {
  const apiDocs = {
    title: 'Flipbook API Documentation',
    version: '1.0.0',
    description: 'Complete API documentation for the Flipbook Web Application',
    baseUrl: `${req.protocol}://${req.get('host')}`,
    timestamp: new Date().toISOString(),
    endpoints: {
      authentication: {
        base: '/api/auth',
        endpoints: [
          {
            method: 'POST',
            path: '/api/auth/register',
            description: 'Register a new user account',
            body: {
              email: 'user@example.com',
              password: 'password123'
            }
          },
          {
            method: 'POST',
            path: '/api/auth/login',
            description: 'Login with email and password',
            body: {
              email: 'user@example.com',
              password: 'password123'
            }
          },
          {
            method: 'POST',
            path: '/api/auth/logout',
            description: 'Logout current user',
            headers: {
              'Authorization': 'Bearer <jwt_token>'
            }
          },
          {
            method: 'GET',
            path: '/api/auth/me',
            description: 'Get current user profile',
            headers: {
              'Authorization': 'Bearer <jwt_token>'
            }
          }
        ]
      },
      documents: {
        base: '/api/documents',
        endpoints: [
          {
            method: 'GET',
            path: '/api/documents',
            description: 'Get all user documents with pagination',
            headers: {
              'Authorization': 'Bearer <jwt_token>'
            },
            query: {
              page: '1',
              limit: '10',
              search: 'optional search term'
            }
          },
          {
            method: 'POST',
            path: '/api/documents',
            description: 'Upload new document (PDF/Video)',
            headers: {
              'Authorization': 'Bearer <jwt_token>',
              'Content-Type': 'multipart/form-data'
            },
            body: 'FormData with file, title, description, requiresContact, contactMessage'
          },
          {
            method: 'GET',
            path: '/api/documents/:id',
            description: 'Get specific document details',
            headers: {
              'Authorization': 'Bearer <jwt_token>'
            }
          },
          {
            method: 'PUT',
            path: '/api/documents/:id',
            description: 'Update document details',
            headers: {
              'Authorization': 'Bearer <jwt_token>'
            }
          },
          {
            method: 'DELETE',
            path: '/api/documents/:id',
            description: 'Delete a document',
            headers: {
              'Authorization': 'Bearer <jwt_token>'
            }
          },
          {
            method: 'POST',
            path: '/api/documents/:id/toggle-public',
            description: 'Toggle document public visibility',
            headers: {
              'Authorization': 'Bearer <jwt_token>'
            }
          }
        ]
      },
      publicAccess: {
        base: '/api/public',
        endpoints: [
          {
            method: 'GET',
            path: '/api/public/document/:slug',
            description: 'Access public document by slug (tracks view)'
          },
          {
            method: 'POST',
            path: '/api/public/contact/:slug',
            description: 'Submit contact information for document access',
            body: {
              name: 'John Doe',
              mobile: '+1234567890'
            }
          },
          {
            method: 'GET',
            path: '/api/public/download/:slug',
            description: 'Download public document (tracks download)'
          }
        ]
      },
      analytics: {
        base: '/api/analytics',
        endpoints: [
          {
            method: 'GET',
            path: '/api/analytics/dashboard',
            description: 'Get dashboard analytics for all user documents',
            headers: {
              'Authorization': 'Bearer <jwt_token>'
            }
          },
          {
            method: 'GET',
            path: '/api/analytics/:documentId',
            description: 'Get detailed analytics for specific document',
            headers: {
              'Authorization': 'Bearer <jwt_token>'
            },
            query: {
              startDate: '2023-01-01',
              endDate: '2023-12-31',
              groupBy: 'day'
            }
          },
          {
            method: 'GET',
            path: '/api/analytics/:documentId/views',
            description: 'Get raw view data for document',
            headers: {
              'Authorization': 'Bearer <jwt_token>'
            }
          },
          {
            method: 'GET',
            path: '/api/analytics/:documentId/contacts',
            description: 'Get collected contacts for document',
            headers: {
              'Authorization': 'Bearer <jwt_token>'
            }
          },
          {
            method: 'GET',
            path: '/api/analytics/:documentId/export',
            description: 'Export analytics data as CSV',
            headers: {
              'Authorization': 'Bearer <jwt_token>'
            },
            query: {
              type: 'views or contacts'
            }
          }
        ]
      }
    },
    testingInstructions: [
      '1. First register/login to get JWT token',
      '2. Include "Authorization: Bearer <token>" header for protected routes',
      '3. Use tools like Postman, curl, or the browser for testing',
      '4. Check /health endpoint for server status',
      '5. File uploads require multipart/form-data content type'
    ],
    exampleRequests: {
      curl: {
        register: `curl -X POST ${req.protocol}://${req.get('host')}/api/auth/register \\
  -H "Content-Type: application/json" \\
  -d '{"email":"test@example.com","password":"password123"}'`,
        login: `curl -X POST ${req.protocol}://${req.get('host')}/api/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{"email":"test@example.com","password":"password123"}'`,
        getDocuments: `curl -X GET ${req.protocol}://${req.get('host')}/api/documents \\
  -H "Authorization: Bearer <your_jwt_token>"`
      }
    }
  };

  // Check if request accepts HTML (browser) or JSON (API client)
  if (req.headers.accept && req.headers.accept.includes('text/html')) {
    // Return HTML page for browsers
    res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Flipbook API Documentation</title>
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                line-height: 1.6; 
                color: #333; 
                background: #f5f7fa; 
            }
            .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
            .header { 
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                color: white; 
                padding: 40px 0; 
                text-align: center; 
                margin-bottom: 30px;
                border-radius: 10px;
            }
            .header h1 { font-size: 2.5rem; margin-bottom: 10px; }
            .header p { font-size: 1.1rem; opacity: 0.9; }
            .info-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin-bottom: 30px; }
            .info-card { background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .info-card h3 { color: #667eea; margin-bottom: 15px; }
            .endpoint-section { background: white; margin: 20px 0; padding: 20px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .endpoint-section h2 { color: #333; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 2px solid #667eea; }
            .endpoint { 
                background: #f8f9ff; 
                margin: 10px 0; 
                padding: 15px; 
                border-radius: 8px; 
                border-left: 4px solid #667eea; 
            }
            .method { 
                display: inline-block; 
                padding: 4px 8px; 
                border-radius: 4px; 
                font-weight: bold; 
                font-size: 0.8rem; 
                margin-right: 10px; 
            }
            .method.GET { background: #4CAF50; color: white; }
            .method.POST { background: #2196F3; color: white; }
            .method.PUT { background: #FF9800; color: white; }
            .method.DELETE { background: #f44336; color: white; }
            .path { font-family: 'Courier New', monospace; font-weight: bold; }
            .description { margin: 8px 0; color: #666; }
            pre { 
                background: #263238; 
                color: #eeffff; 
                padding: 15px; 
                border-radius: 5px; 
                overflow-x: auto; 
                font-size: 0.9rem;
                margin: 10px 0;
            }
            .test-section { 
                background: #e8f5e8; 
                padding: 20px; 
                border-radius: 10px; 
                margin: 20px 0;
                border-left: 4px solid #4CAF50;
            }
            .status-badge { 
                display: inline-block; 
                padding: 4px 12px; 
                background: #4CAF50; 
                color: white; 
                border-radius: 20px; 
                font-size: 0.8rem; 
                margin-left: 10px;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🚀 Flipbook API Documentation</h1>
                <p>Complete REST API for Flipbook Web Application</p>
                <span class="status-badge">Server Running</span>
            </div>

            <div class="info-grid">
                <div class="info-card">
                    <h3>📊 Server Info</h3>
                    <p><strong>Version:</strong> ${apiDocs.version}</p>
                    <p><strong>Environment:</strong> ${process.env.NODE_ENV || 'development'}</p>
                    <p><strong>Base URL:</strong> ${apiDocs.baseUrl}</p>
                    <p><strong>Timestamp:</strong> ${apiDocs.timestamp}</p>
                </div>
                <div class="info-card">
                    <h3>🔧 Quick Test</h3>
                    <p><strong>Health Check:</strong> <a href="/health" target="_blank">/health</a></p>
                    <p><strong>Default Admin:</strong> admin@flipbook.com</p>
                    <p><strong>Default Password:</strong> admin123</p>
                    <p><strong>Content-Type:</strong> application/json</p>
                </div>
            </div>

            ${Object.entries(apiDocs.endpoints).map(([category, data]) => `
                <div class="endpoint-section">
                    <h2>${category.charAt(0).toUpperCase() + category.slice(1).replace(/([A-Z])/g, ' $1')}</h2>
                    <p><strong>Base Path:</strong> <code>${data.base}</code></p>
                    ${data.endpoints.map(endpoint => `
                        <div class="endpoint">
                            <div>
                                <span class="method ${endpoint.method}">${endpoint.method}</span>
                                <span class="path">${endpoint.path}</span>
                            </div>
                            <div class="description">${endpoint.description}</div>
                            ${endpoint.headers ? `<p><strong>Headers:</strong> <code>${JSON.stringify(endpoint.headers, null, 2).replace(/[{}",]/g, '').trim()}</code></p>` : ''}
                            ${endpoint.query ? `<p><strong>Query Params:</strong> <code>${JSON.stringify(endpoint.query, null, 2).replace(/[{}",]/g, '').trim()}</code></p>` : ''}
                            ${endpoint.body ? `<p><strong>Request Body:</strong> <code>${typeof endpoint.body === 'string' ? endpoint.body : JSON.stringify(endpoint.body, null, 2)}</code></p>` : ''}
                        </div>
                    `).join('')}
                </div>
            `).join('')}

            <div class="test-section">
                <h2>🧪 Testing Instructions</h2>
                <ol>
                    ${apiDocs.testingInstructions.map(instruction => `<li>${instruction}</li>`).join('')}
                </ol>
                
                <h3>Example cURL Commands:</h3>
                <pre>${apiDocs.exampleRequests.curl.register}</pre>
                <pre>${apiDocs.exampleRequests.curl.login}</pre>
                <pre>${apiDocs.exampleRequests.curl.getDocuments}</pre>
            </div>
        </div>
    </body>
    </html>
    `);
  } else {
    // Return JSON for API clients
    res.json(apiDocs);
  }
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/analytics', analyticsRoutes);

// 404 handler for undefined routes
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Global error handling middleware
app.use(errorHandler);

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/flipbook', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('✅ Connected to MongoDB');
  
  // Create default admin user if it doesn't exist
  const User = require('./models/User');
  const bcrypt = require('bcryptjs');
  
  User.findOne({ email: 'admin@flipbook.com' })
    .then(async (user) => {
      if (!user) {
        const adminUser = new User({
          email: 'admin@flipbook.com',
          passwordHash: 'admin123', // Will be hashed by pre-save hook
          role: 'admin'
        });
        await adminUser.save();
        console.log('✅ Default admin user created: admin@flipbook.com / admin123');
      }
    })
    .catch(err => console.error('❌ Error creating admin user:', err));
})
.catch((error) => {
  console.error('❌ MongoDB connection error:', error);
  process.exit(1);
});

// Graceful shutdown
const gracefulShutdown = async () => {
  console.log('\n🔄 Received shutdown signal, closing server...');
  try {
    await mongoose.connection.close();
    console.log('✅ MongoDB connection closed');
    process.exit(0);
  } catch (error) {
    console.error('Error closing MongoDB connection:', error);
    process.exit(1);
  }
};

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Flipbook API server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
});

module.exports = app;