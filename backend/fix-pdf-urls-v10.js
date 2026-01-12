require('dotenv').config();
const mongoose = require('mongoose');
const Document = require('./models/Document');

async function fixPdfUrls() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const documents = await Document.find({
      'pages.url': { 
        $regex: /pg_\d+,c_limit.*c_limit/ 
      }
    });

    console.log(`Found ${documents.length} documents to update`);

    for (const doc of documents) {
      let modified = false;
      
      doc.pages = doc.pages.map(page => {
        if (page.url && page.url.includes('pg_')) {
          // Extract the page number
          const match = page.url.match(/pg_(\d+)/);
          const pageNum = match ? match[1] : null;
          
          if (pageNum) {
            // Construct the clean URL
            const baseUrl = page.url.split('/upload/')[0] + '/upload/';
            const resourcePath = page.url.split('/v1/')[1];
            const transformations = 'c_limit,h_1600,q_85,w_1200';
            
            const newUrl = `${baseUrl}${transformations}/pg_${pageNum}/v1/${resourcePath}`;
            
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