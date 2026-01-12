require('dotenv').config();
const mongoose = require('mongoose');
const Document = require('./models/Document');

async function fixPdfUrls() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const documents = await Document.find({
      'files.pdf.pages': {
        $elemMatch: {
          url: { $regex: /fl_pg_/ }
        }
      }
    });

    console.log(`Found ${documents.length} documents to update`);

    for (const doc of documents) {
      let modified = false;

      if (doc.files?.pdf?.pages) {
        doc.files.pdf.pages = doc.files.pdf.pages.map(page => {
          const pageNum = page.page.toString();
          let modified = false;
          let newPage = { ...page };

          // Fix main URL
          if (page.url && page.url.includes('fl_pg_')) {
            const newUrl = page.url.replace(
              /c_limit,fl_pg_\d+,h_1600,q_85,w_1200/,
              `c_limit,h_1600,q_85,w_1200/pg_${pageNum}`
            );
            if (newUrl !== page.url) {
              console.log(`\nUpdating page ${pageNum} URL:`);
              console.log(`From: ${page.url}`);
              console.log(`To:   ${newUrl}`);
              newPage.url = newUrl;
              modified = true;
            }
          }

          // Fix thumbnail URL
          if (page.thumbnail && page.thumbnail.includes('fl_pg_')) {
            const newThumbnail = page.thumbnail.replace(
              /c_limit,fl_pg_\d+,h_260,q_70,w_200/,
              `c_limit,h_260,q_70,w_200/pg_${pageNum}`
            );
            if (newThumbnail !== page.thumbnail) {
              console.log(`\nUpdating page ${pageNum} thumbnail:`);
              console.log(`From: ${page.thumbnail}`);
              console.log(`To:   ${newThumbnail}`);
              newPage.thumbnail = newThumbnail;
              modified = true;
            }
          }

          return modified ? newPage : page;
        });

        // Save only if modifications were made
        if (modified) {
          await doc.save();
          console.log(`\nUpdated document: ${doc._id}`);
        }
      }
    }

    console.log('\nURL cleanup completed');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    process.exit(0);
  }
}

fixPdfUrls();