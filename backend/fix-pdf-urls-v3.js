require('dotenv').config();
const mongoose = require('mongoose');
const Document = require('./models/Document');

async function fixPdfUrls() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const documents = await Document.find({
      'files.pdf.pages': { $exists: true, $not: { $size: 0 } }
    });

    console.log(`Found ${documents.length} documents with PDF pages`);

    let updated = 0;
    let skipped = 0;

    for (const doc of documents) {
      if (!doc.files?.pdf?.pages?.length) {
        skipped++;
        continue;
      }

      // Extract base URL
      const baseUrl = `https://res.cloudinary.com/dhzqbwd3r/image/upload/v1/flipbook/pdfs/${doc._id}_pages.jpg`;
      console.log(`Processing document ${doc._id}`);
      
      // Generate new page URLs without transformations in base URL
      const pageUrls = doc.files.pdf.pages.map(page => ({
        page: page.page,
        url: baseUrl,
        thumbnail: baseUrl
      }));

      // Update document with new page URLs
      doc.files.pdf.pages = pageUrls;
      await doc.save();
      console.log(`Updated document ${doc._id} with ${pageUrls.length} pages`);
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