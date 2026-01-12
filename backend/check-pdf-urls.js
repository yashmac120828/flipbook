require('dotenv').config();
const mongoose = require('mongoose');
const Document = require('./models/Document');

async function checkAndFixUrls() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const doc = await Document.findOne({
      'files.pdf.pages': { $exists: true, $not: { $size: 0 } }
    });

    if (!doc) {
      console.log('No documents with PDF pages found');
      return;
    }

    console.log('Document structure:', JSON.stringify(doc.files, null, 2));

    // Add your public ID from the frontend errors
    const publicId = '690393b6372ae250e6a597eb';
    const baseId = `v1/flipbook/pdfs/${publicId}_pages`;

    // Test both URL formats
    console.log('\nTesting URL formats:');
    console.log('Current format:', doc.files.pdf.pages[0].url);
    console.log('New format 1:', `https://res.cloudinary.com/dhzqbwd3r/image/upload/c_limit,h_1600,pg_1,q_85,w_1200/${baseId}`);
    console.log('New format 2:', `https://res.cloudinary.com/dhzqbwd3r/image/upload/pg_1/w_1200,h_1600,c_limit,q_85/${baseId}`);
    console.log('New format 3:', `https://res.cloudinary.com/dhzqbwd3r/image/upload/fl_pg_1/w_1200,h_1600,c_limit,q_85/${baseId}`);
    console.log('New format 4:', `https://res.cloudinary.com/dhzqbwd3r/image/upload/pg_1,w_1200,h_1600,c_limit,q_85/${baseId}`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

checkAndFixUrls();