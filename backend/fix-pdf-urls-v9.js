require('dotenv').config();
const mongoose = require('mongoose');
const Document = require('./models/Document');

async function fixPdfUrls() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const documents = await Document.find({
      'pages.url': { 
        $regex: /c_limit,fl_pg_\d+,h_1600,q_85,w_1200\/c_limit/ 
      }
    });

    console.log(`Found ${documents.length} documents with duplicate parameters`);

    for (const doc of documents) {
      let modified = false;
      
      doc.pages = doc.pages.map(page => {
        if (page.url && page.url.includes('c_limit,fl_pg_')) {
          // Extract the page number from the URL
          const match = page.url.match(/pg_(\d+)/);
          const pageNum = match ? match[1] : null;
          
          if (pageNum) {
            // Clean up the URL by removing duplicate parameters
            const newUrl = page.url
              .replace(/pg_\d+,c_limit/, 'c_limit') // Remove first pg_X
              .replace(/c_limit,fl_pg_\d+,h_1600,q_85,w_1200\/c_limit/, 'c_limit') // Remove duplicate parameters
              .replace(/\/v1\//, `/pg_${pageNum}/v1/`); // Add pg_X in correct position
            
            if (newUrl !== page.url) {
              modified = true;
              console.log(`\nOriginal URL: ${page.url}`);
              console.log(`New URL: ${newUrl}`);
              return { ...page, url: newUrl };
            }
          }
        }
        return page;
      });

      if (modified) {
        await doc.save();
        console.log(`Updated document: ${doc._id}`);
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