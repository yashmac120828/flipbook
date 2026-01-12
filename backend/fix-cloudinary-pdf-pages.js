require('dotenv').config();
const mongoose = require('mongoose');
const Document = require('./models/Document');
const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

async function fixPdfPageUrls() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const documents = await Document.find({
      $or: [
        { 'files.pdf.original.publicId': { $exists: true } },
        { 'files.pdf.pages': { $exists: true, $not: { $size: 0 } } },
        { pdfUrl: { $exists: true } }
      ]
    });

    console.log(`Found ${documents.length} documents with PDF pages`);

    for (const doc of documents) {
      if (!doc.files?.pdf?.pageExtraction?.publicId) continue;

      const baseId = doc.files.pdf.pageExtraction.publicId;
      const totalPages = doc.files.pdf.pages?.length || 0;

      console.log(`Processing document ${doc._id} with ${totalPages} pages`);

      // Generate new page URLs
      const pageUrls = [];
      for (let i = 1; i <= totalPages; i++) {
        const pageUrl = cloudinary.url(baseId, {
          resource_type: 'image',
          flags: `pg_${i}`,
          transformation: [
            { width: 1200, height: 1600, crop: 'limit', quality: 85 }
          ]
        });

        pageUrls.push({
          page: i,
          url: pageUrl,
          thumbnail: cloudinary.url(baseId, {
            resource_type: 'image',
            flags: `pg_${i}`,
            transformation: [
              { width: 200, height: 260, crop: 'limit', quality: 70 }
            ]
          })
        });
      }

      // Update document with new page URLs
      doc.files.pdf.pages = pageUrls;
      await doc.save();
      console.log(`Updated document ${doc._id}`);
    }

    console.log('Finished updating all documents');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

fixPdfPageUrls();