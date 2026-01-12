require('dotenv').config();
const mongoose = require('mongoose');
const Document = require('./models/Document');
const cloudinary = require('./services/cloudinary');

async function getPdfPageCount(pdfUrl) {
  try {
    // Use Cloudinary API to get the page count
    const result = await cloudinary.api.resource(pdfUrl, { pages: true });
    return result.pages || 0;
  } catch (error) {
    console.error('Error getting PDF page count:', error);
    return 0;
  }
}

async function fixPdfUrls() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const documents = await Document.find({
      'files.pdf': { $exists: true }
    });

    console.log(`Found ${documents.length} documents with PDFs`);

    let updated = 0;
    let skipped = 0;

    for (const doc of documents) {
      if (!doc.files?.pdf) {
        skipped++;
        continue;
      }

      // Get the public ID from the PDF URL
      const pdfUrl = doc.files.pdf.original?.url || doc.files.pdf.url;
      if (!pdfUrl) {
        console.log(`Skipping document ${doc._id} - no PDF URL found`);
        skipped++;
        continue;
      }

      // Extract public ID from URL
      const publicId = pdfUrl.split('/upload/')[1];
      if (!publicId) {
        console.log(`Skipping document ${doc._id} - invalid PDF URL`);
        skipped++;
        continue;
      }

      // Get actual page count from PDF
      const pageCount = await getPdfPageCount(publicId);
      console.log(`Document ${doc._id} has ${pageCount} PDF pages`);

      if (pageCount === 0) {
        console.log(`Skipping document ${doc._id} - could not determine page count`);
        skipped++;
        continue;
      }

      // Generate base URL for pages
      const baseUrl = `https://res.cloudinary.com/dhzqbwd3r/image/upload/v1/flipbook/pdfs/${doc._id}_pages.jpg`;
      
      // Generate page URLs based on actual page count
      const pageUrls = Array.from({ length: pageCount }, (_, i) => ({
        page: i + 1,
        url: baseUrl,
        thumbnail: baseUrl
      }));

      // Update document with new page URLs
      doc.files.pdf.pages = pageUrls;
      await doc.save();
      console.log(`Updated document ${doc._id} with ${pageCount} pages`);
      console.log('Base URL:', baseUrl);
      updated++;
    }

    console.log('\nMigration complete:');
    console.log(`- Total documents processed: ${documents.length}`);
    console.log(`- Documents updated: ${updated}`);
    console.log(`- Documents skipped: ${skipped}`);

  } catch (error) {
    console.error('Migration error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
    process.exit(0);
  }
}

fixPdfUrls();