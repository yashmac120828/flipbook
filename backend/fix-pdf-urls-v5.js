require('dotenv').config();
const mongoose = require('mongoose');
const Document = require('./models/Document');

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

      // Base URL for pages
      const baseUrl = `https://res.cloudinary.com/dhzqbwd3r/image/upload/v1/flipbook/pdfs/${doc._id}_pages.jpg`;
      
      // Try to get the page count from the first successful page request
      let pageCount = 1;
      while (true) {
        try {
          const testUrl = `${baseUrl}?pg=${pageCount}&c_limit,h_1600,q_85,w_1200`;
          const response = await fetch(testUrl);
          if (!response.ok) {
            pageCount--; // Last successful page
            break;
          }
          pageCount++;
          if (pageCount > 100) { // Safety limit
            pageCount = 1;
            break;
          }
        } catch (error) {
          pageCount--;
          break;
        }
      }

      console.log(`Document ${doc._id} has ${pageCount} PDF pages`);

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