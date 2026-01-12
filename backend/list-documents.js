/**
 * List all documents in the database
 * Helpful for finding document IDs to test hyperlinks
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Document = require('./models/Document');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/flipbook';

async function listDocuments() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected!\n');

    const documents = await Document.find()
      .select('_id title publicSlug files.pdf.pages createdAt')
      .limit(20)
      .sort({ createdAt: -1 });

    console.log('Found', documents.length, 'documents:\n');

    documents.forEach((doc, index) => {
      const pageCount = doc.files?.pdf?.pages?.length || 0;
      console.log(`${index + 1}. ${doc.title}`);
      console.log(`   ID: ${doc._id}`);
      console.log(`   Slug: ${doc.publicSlug}`);
      console.log(`   Pages: ${pageCount}`);
      console.log(`   Created: ${doc.createdAt.toLocaleDateString()}`);
      console.log(`   URL: http://localhost:5173/document/${doc.publicSlug}\n`);
    });

    if (documents.length > 0) {
      console.log('\nTo add hyperlinks to a document, run:');
      console.log(`node add-hyperlinks-test.js ${documents[0]._id}`);
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

listDocuments();
