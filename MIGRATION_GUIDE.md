# Migration Guide - From Image-based to PDF.js

## Overview

This guide helps migrate existing documents from the old image-based system to the new PDF.js implementation.

---

## ⚠️ Important Notes

### Data Compatibility
- ✅ **Existing documents will continue to work** (backward compatible)
- ✅ **New uploads use PDF.js** automatically
- ⚠️ **Old documents won't have hyperlinks** (images don't support links)
- 💡 **Re-upload old documents** to get hyperlink support

### Breaking Changes
- None! The system is backward compatible
- Old documents render images as before
- New documents use PDF.js

---

## 🔄 Migration Options

### Option 1: Keep Both Systems (Recommended)
**Best for:** Existing production systems

✅ **Pros:**
- No downtime
- No data migration needed
- Gradual transition

❌ **Cons:**
- Two rendering systems to maintain
- Old documents lack hyperlinks

**Implementation:**
```javascript
// In FlipbookViewer.jsx
if (document.files?.pdf?.pages?.length > 0) {
  // Old system - render images
  return <ImageViewer pages={document.files.pdf.pages} />;
} else if (document.files?.pdf?.original?.url) {
  // New system - use PDF.js
  return <PDFViewer pdfUrl={document.files.pdf.original.url} />;
}
```

### Option 2: Re-upload All Documents
**Best for:** Small document collections

✅ **Pros:**
- All documents get hyperlinks
- Single rendering system
- Clean codebase

❌ **Cons:**
- Manual work required
- Temporary duplicate storage

**Steps:**
1. Download all existing PDFs
2. Delete old documents
3. Re-upload using new system
4. Verify hyperlinks work

### Option 3: Automatic Migration Script
**Best for:** Large document collections

✅ **Pros:**
- Automated process
- Preserves metadata
- Batch processing

❌ **Cons:**
- Requires original PDF files
- Complex script needed

**Script outline:**
```javascript
// migration-script.js
const documents = await Document.find({
  'files.pdf.pages': { $exists: true }
});

for (const doc of documents) {
  // 1. Download original PDF from Cloudinary
  // 2. Re-upload as raw file
  // 3. Update document record
  // 4. Delete old page images
}
```

---

## 📊 Backward Compatibility Implementation

### Current Implementation
The FlipbookViewer already handles both:

```javascript
// Checks for new format (PDF.js)
if (document?.files?.pdf?.original?.url) {
  loadPDF(); // Use PDF.js
}

// Falls back to old format (images)
else if (document?.files?.pdf?.pages?.length > 0) {
  setPages(document.files.pdf.pages); // Use images
}
```

### Database Schema
**Old documents have:**
```javascript
{
  files: {
    pdf: {
      pages: [
        { page: 1, url: "cloudinary-image-url" },
        { page: 2, url: "cloudinary-image-url" }
      ]
    }
  }
}
```

**New documents have:**
```javascript
{
  files: {
    pdf: {
      original: {
        url: "cloudinary-raw-pdf-url",
        publicId: "...",
        resourceType: "raw"
      },
      pages: [] // Empty for PDF.js rendering
    }
  }
}
```

---

## 🛠️ Manual Re-upload Process

### Step 1: Export Document List
```javascript
// In MongoDB or admin panel
const docs = await Document.find({}).select('title publicSlug files.pdf');
console.log(docs);
```

### Step 2: Download Original PDFs
For each document:
1. Get PDF URL from Cloudinary
2. Download to local folder
3. Organize by title/slug

### Step 3: Delete Old Documents
⚠️ **Backup first!**
```javascript
// Mark as deleted (don't actually delete)
await Document.updateMany(
  { 'files.pdf.pages': { $exists: true } },
  { $set: { 'metadata.status': 'archived' } }
);
```

### Step 4: Re-upload via Admin Panel
1. Login to admin panel
2. Upload each PDF
3. Add same title and metadata
4. Note new slug/URL

### Step 5: Update Links
If you shared old links:
1. Create redirect from old slug to new
2. Or update links in your marketing materials

---

## 🔧 Migration Script Example

```javascript
// scripts/migrate-to-pdfjs.js
const Document = require('../models/Document');
const cloudinary = require('../services/cloudinary');
const axios = require('axios');

async function migrateSingleDocument(docId) {
  const doc = await Document.findById(docId);
  
  // Skip if already migrated
  if (doc.files?.pdf?.original?.url) {
    console.log(`Document ${doc.title} already migrated`);
    return;
  }
  
  // Get original PDF URL from legacy field
  const pdfUrl = doc.pdfUrl || doc.files?.pdf?.pageExtraction?.url;
  
  if (!pdfUrl) {
    console.error(`No PDF URL found for ${doc.title}`);
    return;
  }
  
  try {
    // Download PDF
    const response = await axios.get(pdfUrl, {
      responseType: 'arraybuffer'
    });
    const pdfBuffer = Buffer.from(response.data);
    
    // Re-upload as raw file
    const publicId = `migrated-${Date.now()}`;
    const result = await cloudinary.uploadPDFWithPages(pdfBuffer, publicId);
    
    // Update document
    doc.files = doc.files || {};
    doc.files.pdf = {
      original: result.original,
      pages: [], // Will be rendered by PDF.js
    };
    
    await doc.save();
    console.log(`✅ Migrated: ${doc.title}`);
    
  } catch (error) {
    console.error(`❌ Failed to migrate ${doc.title}:`, error.message);
  }
}

async function migrateAllDocuments() {
  const documents = await Document.find({
    'files.pdf.pages': { $exists: true, $ne: [] }
  });
  
  console.log(`Found ${documents.length} documents to migrate`);
  
  for (const doc of documents) {
    await migrateSingleDocument(doc._id);
    
    // Delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('Migration complete!');
}

// Run migration
migrateAllDocuments().catch(console.error);
```

**Usage:**
```bash
node scripts/migrate-to-pdfjs.js
```

---

## 🎯 Migration Checklist

### Pre-Migration
- [ ] Backup MongoDB database
- [ ] Export all document metadata
- [ ] Download all original PDFs
- [ ] Note all public URLs/slugs
- [ ] Test migration script on staging

### During Migration
- [ ] Run migration script
- [ ] Monitor for errors
- [ ] Verify uploads to Cloudinary
- [ ] Check database updates
- [ ] Test random samples

### Post-Migration
- [ ] Verify all documents viewable
- [ ] Test hyperlinks work
- [ ] Check analytics still tracking
- [ ] Update documentation
- [ ] Notify users of improvements

---

## 📈 Gradual Rollout Plan

### Week 1: Testing
- Deploy to staging
- Test with sample documents
- Verify all features work
- Fix any issues

### Week 2: Soft Launch
- Deploy to production
- New uploads use PDF.js
- Old documents use images
- Monitor for issues

### Week 3: Migration
- Begin re-uploading important documents
- Focus on frequently viewed ones
- Test hyperlink functionality

### Week 4: Cleanup
- Archive old image-based documents
- Clean up Cloudinary storage
- Update all documentation

---

## 💾 Storage Optimization

### Before Migration
Estimate current storage:
```javascript
const oldDocs = await Document.find({
  'files.pdf.pages': { $exists: true }
});

let totalPages = 0;
oldDocs.forEach(doc => {
  totalPages += doc.files.pdf.pages.length;
});

console.log(`${totalPages} pages × ~500KB = ${(totalPages * 0.5).toFixed(2)} MB`);
```

### After Migration
Estimate new storage:
```javascript
const newDocs = await Document.find({
  'files.pdf.original': { $exists: true }
});

let totalPDFs = newDocs.length;
let avgPdfSize = 5; // MB per PDF (estimate)

console.log(`${totalPDFs} PDFs × ${avgPdfSize}MB = ${totalPDFs * avgPdfSize} MB`);
```

### Cleanup Old Images
```javascript
// Delete old page images from Cloudinary
for (const doc of oldDocs) {
  if (doc.files?.pdf?.pageExtraction?.publicId) {
    await cloudinary.uploader.destroy(
      doc.files.pdf.pageExtraction.publicId,
      { resource_type: 'image' }
    );
  }
}
```

---

## 🔍 Verification Steps

After migration, verify:

### 1. Document Counts Match
```javascript
const oldCount = await Document.countDocuments({
  'metadata.status': 'archived'
});
const newCount = await Document.countDocuments({
  'metadata.status': 'active',
  'files.pdf.original': { $exists: true }
});

console.log(`Old: ${oldCount}, New: ${newCount}`);
```

### 2. All PDFs Accessible
```javascript
const docs = await Document.find({
  'files.pdf.original.url': { $exists: true }
});

for (const doc of docs) {
  const response = await fetch(doc.files.pdf.original.url, {
    method: 'HEAD'
  });
  
  if (response.status !== 200) {
    console.error(`❌ ${doc.title}: ${response.status}`);
  } else {
    console.log(`✅ ${doc.title}`);
  }
}
```

### 3. Hyperlinks Working
- Manually test sample documents
- Click hyperlinks
- Verify they open correctly

---

## 🆘 Rollback Plan

If issues occur:

### Immediate Rollback
```bash
# Checkout previous commit
git checkout <previous-commit-hash>

# Rebuild and redeploy
npm run build
pm2 restart all
```

### Database Rollback
```javascript
// Restore from backup
mongorestore --uri="mongodb://..." --archive=backup.archive
```

### Gradual Rollback
```javascript
// Switch back to image rendering
// In FlipbookViewer.jsx
const USE_PDFJS = false; // Toggle flag
```

---

## 📞 Support During Migration

**Monitor:**
- Server logs
- Error tracking (Sentry, etc.)
- User feedback
- Analytics

**Communicate:**
- Notify users of improvements
- Explain new features
- Provide help documentation

---

**Last Updated:** January 5, 2026  
**Migration Status:** Ready for Testing
