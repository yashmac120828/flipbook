require('dotenv').config();
const mongoose = require('mongoose');
const Document = require('./models/Document');

async function cleanupExtraPages() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const documents = await Document.find({
      'files.pdf.pages': { $exists: true, $ne: [] }
    });

    console.log(`Found ${documents.length} documents to check`);

    for (const doc of documents) {
      let modified = false;
      console.log('\nProcessing document:', doc._id);

      if (doc.files?.pdf?.pages) {
        // First, ensure pages are sorted by page number
        doc.files.pdf.pages.sort((a, b) => a.page - b.page);

        // Get actual page count
        const actualPageCount = doc.files.pdf.pages.length;
        console.log('Current page count:', actualPageCount);

        // Get the highest valid page number
        const maxPageNum = doc.fileInfo?.totalPages || Math.max(...doc.files.pdf.pages.map(p => p.page));
        console.log('Max valid page number:', maxPageNum);

        // Filter out any pages with numbers higher than the maximum valid page
        const validPages = doc.files.pdf.pages.filter(page => page.page <= maxPageNum);

        if (validPages.length !== doc.files.pdf.pages.length) {
          console.log(`Removing ${doc.files.pdf.pages.length - validPages.length} extra pages`);
          doc.files.pdf.pages = validPages;
          modified = true;
        }

        // Update fileInfo.totalPages if needed
        if (doc.fileInfo) {
          if (!doc.fileInfo.totalPages || doc.fileInfo.totalPages !== maxPageNum) {
            doc.fileInfo.totalPages = maxPageNum;
            modified = true;
            console.log('Updated total pages count:', maxPageNum);
          }
        }

        // Save if changes were made
        if (modified) {
          await doc.save();
          console.log('Saved document changes');
        } else {
          console.log('No changes needed');
        }
      }
    }

    console.log('\nCleanup completed');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    process.exit(0);
  }
}

cleanupExtraPages();