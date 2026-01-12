const mongoose = require('mongoose');
const Document = require('./models/Document');
const View = require('./models/View');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/flipbook', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

/**
 * Fix existing data to ensure proper unique contact and view counting
 */
async function fixExistingData() {
  console.log('🔧 Starting data cleanup and uniqueness fix...\n');
  
  try {
    // Get all documents
    const documents = await Document.find({});
    console.log(`Found ${documents.length} documents to process\n`);
    
    for (const document of documents) {
      console.log(`📄 Processing document: ${document.title}`);
      console.log(`   ID: ${document._id}`);
      
      // Get all views for this document
      const views = await View.find({ documentId: document._id });
      console.log(`   Total views: ${views.length}`);
      
      // Track unique contacts by name+mobile combination
      const uniqueContacts = new Map();
      const duplicateViews = [];
      
      // Process each view to identify duplicates
      for (const view of views) {
        if (view.submittedName && view.submittedMobile) {
          const contactKey = `${view.submittedName.toLowerCase()}|${view.submittedMobile}`;
          
          if (uniqueContacts.has(contactKey)) {
            // This is a duplicate contact
            const firstView = uniqueContacts.get(contactKey);
            duplicateViews.push({
              viewId: view._id,
              contactKey,
              firstViewId: firstView.viewId,
              firstViewDate: firstView.date,
              currentViewDate: view.createdAt
            });
            
            // Mark this view as not unique if it was marked as unique
            if (view.isUnique) {
              view.isUnique = false;
              await view.save();
              console.log(`   ❌ Marked duplicate view as not unique: ${view.submittedName}`);
            }
          } else {
            // This is the first occurrence of this contact
            uniqueContacts.set(contactKey, {
              viewId: view._id,
              date: view.createdAt,
              name: view.submittedName,
              mobile: view.submittedMobile
            });
          }
        }
      }
      
      // Recalculate and update document stats
      const newStats = await View.recalculateDocumentStats(document._id);
      
      console.log(`   📊 Updated stats:`);
      console.log(`      Total views: ${document.stats.totalViews} → ${newStats.totalViews}`);
      console.log(`      Unique views: ${document.stats.uniqueViews} → ${newStats.uniqueViews}`);
      console.log(`      Downloads: ${document.stats.totalDownloads} → ${newStats.totalDownloads}`);
      console.log(`      Contacts: ${document.stats.contactsCollected} → ${newStats.contactsCollected}`);
      
      if (duplicateViews.length > 0) {
        console.log(`   🔍 Found ${duplicateViews.length} duplicate contact submissions:`);
        duplicateViews.forEach(dup => {
          console.log(`      - Contact: ${uniqueContacts.get(dup.contactKey).name}`);
          console.log(`        First: ${dup.firstViewDate.toISOString()}`);
          console.log(`        Duplicate: ${dup.currentViewDate.toISOString()}`);
        });
      }
      
      console.log('');
    }
    
    console.log('✅ Data cleanup completed successfully!');
    
    // Generate summary report
    const totalViews = await View.countDocuments();
    const totalUniqueViews = await View.countDocuments({ isUnique: true });
    const totalContactSubmissions = await View.countDocuments({ 
      submittedName: { $exists: true, $ne: null } 
    });
    
    // Count truly unique contacts across all documents
    const uniqueContactsGlobal = await View.aggregate([
      {
        $match: {
          submittedName: { $exists: true, $ne: null },
          submittedMobile: { $exists: true, $ne: null }
        }
      },
      {
        $group: {
          _id: {
            name: '$submittedName',
            mobile: '$submittedMobile'
          },
          count: { $sum: 1 },
          documents: { $addToSet: '$documentId' }
        }
      }
    ]);
    
    console.log('\n📈 Global Summary:');
    console.log(`   Total views: ${totalViews}`);
    console.log(`   Unique views: ${totalUniqueViews}`);
    console.log(`   Contact submissions: ${totalContactSubmissions}`);
    console.log(`   Truly unique contacts: ${uniqueContactsGlobal.length}`);
    
    const duplicateContacts = uniqueContactsGlobal.filter(c => c.count > 1);
    if (duplicateContacts.length > 0) {
      console.log(`   Contacts with multiple submissions: ${duplicateContacts.length}`);
    }
    
  } catch (error) {
    console.error('❌ Error during data cleanup:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Run the fix
if (require.main === module) {
  console.log('🚀 Starting unique contact and view tracking fix...');
  fixExistingData();
}

module.exports = { fixExistingData };