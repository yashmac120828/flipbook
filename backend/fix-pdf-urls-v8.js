require('dotenv').config();
const mongoose = require('mongoose');
const Document = require('./models/Document');

async function fixPdfUrls() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const documents = await Document.find({
      'files.pdf.pages': { $exists: true }
    });

    console.log(`Found ${documents.length} documents with PDF pages`);

    let updated = 0;
    let skipped = 0;

    for (const doc of documents) {
      if (!doc.files?.pdf) {
        skipped++;
        continue;
      }

      // The base URL should NOT include /v1/ - it will be added by transformations
      const baseUrl = `https://res.cloudinary.com/dhzqbwd3r/image/upload/flipbook/pdfs/${doc._id}_pages.jpg`;
      console.log(`Processing document ${doc._id}`);
      
      // Get the actual page count
      const pageCount = doc.files.pdf.pages.length;
      console.log(`Document has ${pageCount} pages`);

      // Generate page URLs without any transformations
      doc.files.pdf.pages = Array.from({ length: pageCount }, (_, i) => ({
        page: i + 1,
        url: baseUrl,
        thumbnail: baseUrl
      }));

      await doc.save();
      console.log(`Updated document ${doc._id}`);
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