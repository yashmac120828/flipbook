# Architecture Diagram - PDF.js Flipbook

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER INTERACTION                          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      FRONTEND (React)                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐ │
│  │  Upload Page     │  │  FlipbookViewer  │  │ Admin Panel  │ │
│  │                  │  │                  │  │              │ │
│  │ - Select PDF     │  │ - Load PDF       │  │ - Manage     │ │
│  │ - Select Video   │  │ - Render Pages   │  │ - Analytics  │ │
│  │ - Upload Both    │  │ - Show Video     │  │              │ │
│  └──────────────────┘  └──────────────────┘  └──────────────┘ │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              NEW COMPONENTS                               │  │
│  │                                                           │  │
│  │  ┌────────────────────┐    ┌──────────────────────┐    │  │
│  │  │ PDFPageRenderer    │    │  LoopingVideo        │    │  │
│  │  │                    │    │                      │    │  │
│  │  │ - Canvas Layer     │    │ - Autoplay          │    │  │
│  │  │ - Text Layer       │    │ - Loop              │    │  │
│  │  │ - Annotation Layer │    │ - Muted             │    │  │
│  │  │ - Hyperlinks ✓     │    │ - No Controls       │    │  │
│  │  └────────────────────┘    └──────────────────────┘    │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       BACKEND API (Express)                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  Document Controller                                    │    │
│  │                                                         │    │
│  │  - Upload PDF + Video                                  │    │
│  │  - Store as RAW files (no conversion) ⭐               │    │
│  │  - Save metadata to MongoDB                            │    │
│  │  - Return document info                                │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  Cloudinary Service (UPDATED)                          │    │
│  │                                                         │    │
│  │  uploadPDFWithPages()                                  │    │
│  │  ├─ Upload as 'raw' resource type                      │    │
│  │  ├─ Preserve PDF format                                │    │
│  │  ├─ Return Cloudinary URL                              │    │
│  │  └─ No image conversion ⭐                             │    │
│  └────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    EXTERNAL SERVICES                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────┐         ┌──────────────────┐            │
│  │   Cloudinary     │         │   MongoDB Atlas   │            │
│  │                  │         │                   │            │
│  │ PDF Storage      │         │ Document Data     │            │
│  │ (Raw Files) ⭐   │         │ - Metadata        │            │
│  │                  │         │ - User Info       │            │
│  │ Video Storage    │         │ - Analytics       │            │
│  │ - MP4 Format     │         │                   │            │
│  └──────────────────┘         └──────────────────┘            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow - Upload

```
┌──────────┐
│  User    │
│ Selects  │
│ Files    │
└────┬─────┘
     │
     ▼
┌──────────────────────────────┐
│  Upload Form                 │
│  - PDF File                  │
│  - Video File (optional)     │
│  - Title, Description        │
└────┬─────────────────────────┘
     │ FormData
     ▼
┌──────────────────────────────┐
│  Backend API                 │
│  POST /api/documents         │
└────┬─────────────────────────┘
     │
     ├─── PDF Buffer ──────────┐
     │                          │
     │                          ▼
     │                    ┌────────────────┐
     │                    │  Cloudinary    │
     │                    │  Upload as RAW │
     │                    └────────────────┘
     │                          │
     │                          │ PDF URL
     │                          │
     │                          ▼
     ├─── Video Buffer ────────┐
     │                          │
     │                          ▼
     │                    ┌────────────────┐
     │                    │  Cloudinary    │
     │                    │  Upload Video  │
     │                    └────────────────┘
     │                          │
     │                          │ Video URL
     │                          │
     │◄─────────────────────────┘
     │
     │ Document Object
     │ - PDF URL
     │ - Video URL
     │ - Metadata
     │
     ▼
┌──────────────────────────────┐
│  MongoDB                     │
│  Save Document               │
└────┬─────────────────────────┘
     │
     │ Document ID, Slug
     │
     ▼
┌──────────────────────────────┐
│  Response to User            │
│  - Success                   │
│  - Document Link             │
└──────────────────────────────┘
```

## Data Flow - Viewing

```
┌──────────┐
│  User    │
│ Clicks   │
│ Link     │
└────┬─────┘
     │
     ▼
┌──────────────────────────────┐
│  /view/:slug                 │
│  FlipbookViewer Page         │
└────┬─────────────────────────┘
     │
     ▼
┌──────────────────────────────┐
│  Fetch Document Data         │
│  GET /api/public/:slug       │
└────┬─────────────────────────┘
     │
     │ Document Data
     │ - PDF URL
     │ - Video URL
     │ - Settings
     │
     ▼
┌──────────────────────────────┐
│  Load PDF with PDF.js        │
│  - Fetch from Cloudinary     │
│  - Parse PDF                 │
│  - Get page count            │
└────┬─────────────────────────┘
     │
     │ PDF Document Object
     │
     ▼
┌──────────────────────────────┐
│  Render Each Page            │
│                              │
│  For each page:              │
│  ├─ PDFPageRenderer          │
│  │  ├─ Canvas (visual)       │
│  │  ├─ Text Layer            │
│  │  └─ Annotation Layer      │
│  │     └─ Hyperlinks ✓       │
│  │                           │
│  └─ Video (if last page)     │
│     └─ LoopingVideo          │
│        ├─ Autoplay           │
│        ├─ Loop               │
│        └─ No controls        │
└──────────────────────────────┘
```

## Component Hierarchy

```
FlipbookViewer
│
├─ Header
│  ├─ Back Button
│  ├─ Title
│  ├─ Page Counter
│  └─ Download Button
│
├─ Main Content
│  │
│  └─ HTMLFlipBook (react-pageflip)
│     │
│     ├─ PDF Pages (Array)
│     │  │
│     │  └─ PDFPageRenderer (for each page)
│     │     │
│     │     ├─ Canvas Layer
│     │     │  └─ PDF Visual Content
│     │     │
│     │     ├─ Text Layer
│     │     │  └─ Selectable Text
│     │     │
│     │     └─ Annotation Layer
│     │        └─ Clickable Hyperlinks ✓
│     │
│     └─ Video Page (if present)
│        │
│        └─ LoopingVideo
│           ├─ Video Element
│           │  ├─ autoplay
│           │  ├─ loop
│           │  ├─ muted
│           │  └─ no controls
│           │
│           └─ Interaction Blocker
│
├─ Navigation
│  ├─ Previous Button
│  ├─ Next Button
│  └─ Page Thumbnails
│
└─ Contact Modal (optional)
   └─ Contact Form
```

## Key Differences from Old Architecture

### OLD (Image Conversion)
```
PDF Upload
    ↓
Convert to Images
    ↓
Upload Images to Cloudinary
    ↓
Display Images in Viewer
    ↓
❌ Hyperlinks Lost
❌ Text Not Selectable
```

### NEW (PDF.js)
```
PDF Upload
    ↓
Store as Raw File
    ↓
Upload to Cloudinary (raw)
    ↓
Render with PDF.js
    ↓
✅ Hyperlinks Preserved
✅ Text Selectable
✅ Better Quality
```

## Technology Integration

```
┌─────────────────────────────────────────┐
│           Frontend Stack                │
├─────────────────────────────────────────┤
│                                         │
│  React 18                               │
│    │                                    │
│    ├─ React Router                     │
│    │  └─ Page Navigation                │
│    │                                    │
│    ├─ PDF.js ⭐                         │
│    │  └─ PDF Rendering                 │
│    │                                    │
│    ├─ react-pageflip ⭐                 │
│    │  └─ Flipbook Animations            │
│    │                                    │
│    └─ Tailwind CSS                     │
│       └─ Styling                        │
│                                         │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│           Backend Stack                 │
├─────────────────────────────────────────┤
│                                         │
│  Express.js                             │
│    │                                    │
│    ├─ Multer                            │
│    │  └─ File Upload                    │
│    │                                    │
│    ├─ Cloudinary SDK                   │
│    │  └─ Storage Management             │
│    │                                    │
│    └─ Mongoose                          │
│       └─ MongoDB ODM                    │
│                                         │
└─────────────────────────────────────────┘
```
