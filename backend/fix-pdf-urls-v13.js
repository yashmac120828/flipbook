require('dotenv').config();
const mongoose = require('mongoose');
const Document = require('./models/Document');

async function fixPdfUrls() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const documents = await Document.find({
      'files.pdf.pages': { $exists: true, $ne: [] }
    });

    console.log(`Found ${documents.length} documents to update`);

    for (const doc of documents) {
      console.log('\nProcessing document:', doc._id);
      let modified = false;

      if (doc.files?.pdf?.pages) {
        doc.files.pdf.pages = doc.files.pdf.pages.map(page => {
          let newPage = { ...page };
          let changes = [];

          // Fix main URL
          if (page.url) {
            const newUrl = page.url
              .replace('http://', 'https://') // Use HTTPS
              .replace(
                /c_limit,fl_pg_(\d+),h_1600,q_85,w_1200\/v1\//,
                'c_limit,h_1600,q_85,w_1200/pg_$1/v1/'
              );

            if (newUrl !== page.url) {
              changes.push('main URL');
              newPage.url = newUrl;
              console.log(`\nPage ${page.page} - URL:\nFrom: ${page.url}\nTo: ${newUrl}`);
            }
          }

          // Fix thumbnail URL
          if (page.thumbnail) {
            const newThumbnail = page.thumbnail
              .replace('http://', 'https://') // Use HTTPS
              .replace(
                /c_limit,fl_pg_(\d+),h_260,q_70,w_200\/v1\//,
                'c_limit,h_260,q_70,w_200/pg_$1/v1/'
              );

            if (newThumbnail !== page.thumbnail) {
              changes.push('thumbnail');
              newPage.thumbnail = newThumbnail;
              console.log(`\nPage ${page.page} - Thumbnail:\nFrom: ${page.thumbnail}\nTo: ${newThumbnail}`);
            }
          }

          if (changes.length > 0) {
            modified = true;
            console.log(`Updated ${changes.join(' and ')} for page ${page.page}`);
          }

          return newPage;
        });

        if (modified) {
          await doc.save();
          console.log(`\nSaved changes to document ${doc._id}`);
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