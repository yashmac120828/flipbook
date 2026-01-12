# Flipbook Web App

A complete web application for creating interactive flipbook documents from PDF and video files with analytics tracking.

## 🎯 Latest Updates - PDF.js Implementation

**NEW!** PDFs are now rendered directly using PDF.js (no image conversion):
- ✅ **Hyperlinks preserved and clickable**
- ✅ **Text selection enabled**
- ✅ **Better quality** (vector rendering)
- ✅ **Faster uploads** (no conversion needed)
- ✅ **Auto-looping videos** with no controls

📚 **See Documentation:**
- [Quick Start Guide](QUICK_START.md) - Get started in 5 minutes
- [Implementation Details](PDF_JS_IMPLEMENTATION.md) - Technical overview
- [Complete Summary](IMPLEMENTATION_SUMMARY.md) - Full implementation guide
- [CORS Setup](CLOUDINARY_CORS.md) - Cloudinary configuration

## Features

- **PDF + Video Upload**: Upload PDF documents and videos to create interactive flipbooks
- **Direct PDF Rendering**: PDFs rendered with PDF.js - preserves hyperlinks and interactivity
- **Flipbook Viewer**: Mobile-friendly viewer with smooth page flip animations
- **Auto-Playing Videos**: Videos loop continuously with no user controls
- **Public Sharing**: Generate shareable links and QR codes for each flipbook
- **Analytics Dashboard**: Track views, devices, referrers, and collect viewer contact information
- **Download Options**: Allow viewers to download PDF+video packages
- **Admin Portal**: Secure admin interface for managing documents and viewing analytics

## Tech Stack

### Frontend
- React 18 with Vite
- Tailwind CSS for styling
- React Router for navigation
- **PDF.js for PDF rendering** ⭐ NEW
- **react-pageflip for flipbook animations** ⭐ NEW
- QR code generation

### Backend
- Node.js with Express.js
- MongoDB with Mongoose ODM
- JWT authentication
- Multer for file uploads
- **Cloudinary for file storage** (PDFs stored as raw files)
- Bull Queue for background jobs

### Infrastructure
- MongoDB Atlas (Database)
- **Cloudinary (File Storage & CDN)** ⭐
- Redis (Queue Management)

## Project Structure

```
flipbook-web-app/
├── frontend/                 # React frontend application
│   ├── components/          # Reusable React components
│   │   ├── PDFPageRenderer.jsx    # NEW: PDF.js page renderer
│   │   ├── LoopingVideo.jsx       # NEW: Auto-looping video
│   │   └── ...
│   ├── pages/              # React pages
│   │   ├── FlipbookViewer.jsx     # UPDATED: PDF.js integration
│   │   └── ...
│   ├── styles/             # CSS and Tailwind styles
│   ├── utils/              # Utility functions
│   └── public/             # Static assets
├── backend/                 # Express.js backend API
│   ├── controllers/        # API controllers
│   ├── models/             # MongoDB models
│   ├── services/           
│   │   └── cloudinary.js        # UPDATED: Raw PDF upload
│   ├── middleware/         # Express middleware
│   ├── routes/             # API routes
│   ├── services/           # Business logic services
│   └── utils/              # Backend utilities
├── shared/                  # Shared types and utilities
└── docs/                   # Documentation
```

## Quick Start

### Prerequisites
- Node.js 18+ and npm
- MongoDB (local or Atlas)
- AWS account with S3 access
- Redis (for background jobs)

### Installation

1. Clone and install dependencies:
```bash
npm run install:all
```

2. Set up environment variables:
```bash
# Copy environment templates
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local

# Edit the files with your configuration
```

3. Configure AWS S3:
   - Create S3 buckets for originals and processed files
   - Set up IAM user with S3 permissions
   - Configure CloudFront distribution

4. Set up MongoDB:
   - Create MongoDB Atlas cluster or local instance
   - Update connection string in backend/.env

5. Start the development servers:
```bash
npm run dev
```

The frontend will be available at `http://localhost:3000` and the backend at `http://localhost:8000`.

### Environment Variables

#### Backend (.env)
```env
NODE_ENV=development
PORT=8000
MONGODB_URI=mongodb://localhost:27017/flipbook
JWT_SECRET=your-jwt-secret
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=us-east-1
S3_BUCKET_ORIGINALS=flipbook-originals
S3_BUCKET_ASSETS=flipbook-assets
CLOUDFRONT_DOMAIN=your-cloudfront-domain.cloudfront.net
REDIS_URL=redis://localhost:6379
```

#### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Usage

### For Administrators

1. **Login**: Access the admin portal at `/admin/login`
2. **Upload**: Create new flipbooks by uploading PDF + video files
3. **Configure**: Set title, description, download permissions, and contact requirements
4. **Share**: Get public links and QR codes for sharing
5. **Analytics**: Monitor views, downloads, and collected contact information

### For Viewers

1. **Access**: Open shared link or scan QR code
2. **Contact Form**: Provide name and mobile (if required)
3. **View**: Browse the flipbook with integrated video
4. **Download**: Download PDF+video package (if enabled)

## API Documentation

### Authentication
- `POST /api/auth/login` - Admin login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user

### Documents
- `POST /api/documents` - Upload and create new document
- `GET /api/documents` - List user's documents
- `GET /api/documents/:id` - Get document details
- `DELETE /api/documents/:id` - Delete document

### Public Access
- `GET /api/public/:slug` - Get public document
- `POST /api/public/:slug/view` - Track document view
- `POST /api/public/:slug/contact` - Submit viewer contact
- `GET /api/public/:slug/download` - Download document package

### Analytics
- `GET /api/analytics/:documentId` - Get document analytics
- `GET /api/analytics/:documentId/export` - Export analytics to CSV

## Development

### Running Tests
```bash
npm test
```

### Building for Production
```bash
npm run build
```

### Database Migrations
```bash
cd backend && npm run migrate
```

## Deployment

### Production Environment

1. **Backend Deployment**:
   - Deploy to AWS ECS, Railway, or Heroku
   - Configure production environment variables
   - Set up MongoDB Atlas connection
   - Configure Redis instance

2. **Frontend Deployment**:
   - Deploy to Vercel, Netlify, or AWS S3/CloudFront
   - Configure API endpoints
   - Set up custom domain

3. **Infrastructure**:
   - Set up AWS S3 buckets with proper CORS
   - Configure CloudFront distribution
   - Set up monitoring and logging

### Docker Deployment

Build and run with Docker:
```bash
docker-compose up -d
```

## Security Considerations

- All file uploads are scanned for malware
- PII (names/mobile numbers) are encrypted at rest
- JWT tokens for admin authentication
- Rate limiting on all endpoints
- CORS configured for frontend domain only
- Input validation and sanitization

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
- Create an issue in the GitHub repository
- Check the documentation in `/docs`
- Review the API documentation

---

**Note**: This application handles personal data (names and mobile numbers). Ensure compliance with local privacy laws (GDPR, CCPA, etc.) before deployment.