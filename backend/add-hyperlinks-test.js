/**
 * Test script to manually add hyperlinks to a document
 * Usage: node add-hyperlinks-test.js <documentId>
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Document = require('./models/Document');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/flipbook';

// Example hyperlinks - customize these for your PDF
const exampleHyperlinks = {
  page1: [
    {
      text: "Visit our website",
      url: "https://example.com",
      x: 100,
      y: 200,
      width: 200,
      height: 40,
      type: "url"
    },
    {
      text: "Contact email",
      url: "contact@example.com",
      x: 100,
      y: 300,
      width: 180,
      height: 35,
      type: "email"
    }
  ],
  page2: [
    {
      text: "Learn more button",
      url: "https://example.com/learn-more",
      x: 150,
      y: 400,
      width: 220,
      height: 50,
      type: "url"
    }
  ]
};

async function addHyperlinksToDocument(documentId) {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected!');

    // Find the document
    const doc = await Document.findById(documentId);
    if (!doc) {
      console.error('Document not found:', documentId);
      process.exit(1);
    }

    console.log('Found document:', doc.title);
    console.log('Total pages:', doc.files?.pdf?.pages?.length || 0);

    // Update hyperlinks for each page
    if (doc.files?.pdf?.pages) {
      // Page 1 (index 0)
      if (doc.files.pdf.pages[0]) {
        doc.files.pdf.pages[0].hyperlinks = exampleHyperlinks.page1;
        console.log('Added', exampleHyperlinks.page1.length, 'hyperlinks to page 1');
      }

      // Page 2 (index 1)
      if (doc.files.pdf.pages[1]) {
        doc.files.pdf.pages[1].hyperlinks = exampleHyperlinks.page2;
        console.log('Added', exampleHyperlinks.page2.length, 'hyperlinks to page 2');
      }

      // Mark the field as modified (Mongoose requirement for nested arrays)
      doc.markModified('files.pdf.pages');

      // Save the document
      await doc.save();
      console.log('✅ Document updated successfully!');
      console.log('View it at: /document/' + doc.publicSlug);
    } else {
      console.error('No PDF pages found in document');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Get document ID from command line
const documentId = process.argv[2];

if (!documentId) {
  console.error('Usage: node add-hyperlinks-test.js <documentId>');
  console.log('\nExample:');
  console.log('node add-hyperlinks-test.js 507f1f77bcf86cd799439011');
  console.log('\nOr find a document ID by running:');
  console.log('node backend/list-documents.js');
  process.exit(1);
}

addHyperlinksToDocument(documentId);
