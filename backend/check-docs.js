require('dotenv').config();
const mongoose = require('mongoose');
const Document = require('./models/Document');

async function checkDocs() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const docs = await Document.find({
      $or: [
        { 'files.pdf.original.publicId': { $exists: true } },
        { 'files.pdf.pages': { $exists: true, $not: { $size: 0 } } }
      ]
    });

    console.log(`Found ${docs.length} documents with PDFs`);
    
    for (const doc of docs) {
      console.log('\nDocument:', doc._id);
      console.log('PDF Files Structure:', JSON.stringify(doc.files?.pdf, null, 2));
      
      if (doc.files?.pdf?.pages?.length > 0) {
        console.log('First page URL:', doc.files.pdf.pages[0].url);
        console.log('Total pages:', doc.files.pdf.pages.length);
      }
      
      if (doc.files?.pdf?.original) {
        console.log('Original PDF:', doc.files.pdf.original);
      }
    }

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error:', error);
  }
}

checkDocs();