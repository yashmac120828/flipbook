require('dotenv').config();
const mongoose = require('mongoose');
const Document = require('./models/Document');

async function validatePdfUrls() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const documents = await Document.find({
      'files.pdf.pages': { $exists: true, $ne: [] }
    });

    console.log(`Found ${documents.length} documents to check`);

    for (const doc of documents) {
      console.log('\nDocument:', doc._id);
      
      if (doc.files?.pdf?.pages) {
        doc.files.pdf.pages.forEach(page => {
          console.log(`\nPage ${page.page}:`);
          console.log('URL:', page.url);
          console.log('Thumbnail:', page.thumbnail);
          
          // Validate URL structure
          if (page.url) {
            const isValid = page.url.includes('/upload/c_limit,h_1600,q_85,w_1200/pg_') 
                          && page.url.includes('/v1/');
            console.log('URL format valid:', isValid);
          }

          // Validate thumbnail structure
          if (page.thumbnail) {
            const isValid = page.thumbnail.includes('/upload/c_limit,h_260,q_70,w_200/pg_') 
                          && page.thumbnail.includes('/v1/');
            console.log('Thumbnail format valid:', isValid);
          }
        });

        // Check if URLs start with https
        const hasHttp = doc.files.pdf.pages.some(page => 
          page.url.startsWith('http://') || 
          page.thumbnail.startsWith('http://')
        );

        if (hasHttp) {
          console.log('\n⚠️ Found http:// URLs - should be using https://');
        }
      }
    }

    console.log('\nValidation completed');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    process.exit(0);
  }
}

validatePdfUrls();