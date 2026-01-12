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

      console.log(`Processing document ${doc._id}`);
      
      // Generate new page URLs
      const pageUrls = doc.files.pdf.pages.map(page => {
        const baseId = 'flipbook/pdfs/690393b6372ae250e6a597eb_pages';
        return {
          page: page.page,
          url: `https://res.cloudinary.com/dhzqbwd3r/image/upload/w_1200,h_1600,c_limit,pg_${page.page},q_85/v1/${baseId}.jpg`,
          thumbnail: `https://res.cloudinary.com/dhzqbwd3r/image/upload/w_200,h_260,c_limit,pg_${page.page},q_70/v1/${baseId}.jpg`
        };
      });

      // Update document with new page URLs
      doc.files.pdf.pages = pageUrls;
      await doc.save();
      console.log(`Updated document ${doc._id} with ${pageUrls.length} pages`);
      console.log('First page URL:', pageUrls[0].url);
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