const mongoose = require('mongoose');
const Document = require('./models/Document');
const View = require('./models/View');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/flipbook', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

/**
 * Test unique tracking functionality
 */
async function testUniqueTracking() {
  console.log('🧪 Testing unique contact tracking functionality...\n');
  
  try {
    // Clean up any existing test data
    await Document.deleteMany({ title: /Test Document/ });
    await View.deleteMany({});
    
    // Create a test document
    const testDoc = new Document({
      title: 'Test Document for Unique Tracking',
      ownerId: new mongoose.Types.ObjectId(),
      publicSlug: 'test-unique-tracking-' + Date.now(),
      files: {
        pdf: {
          original: {
            url: 'https://example.com/test-file.pdf',
            publicId: 'test-file-id'
          }
        }
      },
      status: 'active'
    });
    await testDoc.save();
    console.log(`✅ Created test document: ${testDoc.title}`);
    console.log(`   ID: ${testDoc._id}`);
    console.log(`   Public URL: ${testDoc.publicSlug}\n`);
    
    // Test scenario 1: First view from John
    console.log('📊 Test Scenario 1: First view from John');
    const view1 = new View({
      documentId: testDoc._id,
      sessionId: 'session-john-1',
      ipAddress: '192.168.1.1',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Test Browser 1.0',
      submittedName: 'John Doe',
      submittedMobile: '+1234567890',
      isUnique: true
    });
    await view1.save();
    
    let stats = await View.recalculateDocumentStats(testDoc._id);
    console.log(`   Views: ${stats.totalViews}, Unique: ${stats.uniqueViews}, Contacts: ${stats.contactsCollected}\n`);
    
    // Test scenario 2: Second view from same John (should not increment unique counts)
    console.log('📊 Test Scenario 2: Second view from same John (duplicate)');
    const view2 = new View({
      documentId: testDoc._id,
      sessionId: 'session-john-2',
      ipAddress: '192.168.1.2', // Different IP
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) Test Browser 2.0', // Different browser
      submittedName: 'John Doe', // Same name
      submittedMobile: '+1234567890', // Same mobile
      isUnique: false // Should be marked as not unique
    });
    await view2.save();
    
    stats = await View.recalculateDocumentStats(testDoc._id);
    console.log(`   Views: ${stats.totalViews}, Unique: ${stats.uniqueViews}, Contacts: ${stats.contactsCollected}\n`);
    
    // Test scenario 3: View from Jane (new unique contact)
    console.log('📊 Test Scenario 3: View from Jane (new unique contact)');
    const view3 = new View({
      documentId: testDoc._id,
      sessionId: 'session-jane-1',
      ipAddress: '192.168.1.3',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Test Browser 3.0',
      submittedName: 'Jane Smith',
      submittedMobile: '+0987654321',
      isUnique: true
    });
    await view3.save();
    
    stats = await View.recalculateDocumentStats(testDoc._id);
    console.log(`   Views: ${stats.totalViews}, Unique: ${stats.uniqueViews}, Contacts: ${stats.contactsCollected}\n`);
    
    // Test scenario 4: Another view from John with case variation
    console.log('📊 Test Scenario 4: View from "john doe" (case variation - should be duplicate)');
    const view4 = new View({
      documentId: testDoc._id,
      sessionId: 'session-john-3',
      ipAddress: '192.168.1.4',
      userAgent: 'Mozilla/5.0 (Android 10; Mobile; rv:81.0) Test Browser 4.0',
      submittedName: 'john doe', // Different case
      submittedMobile: '+1234567890', // Same mobile
      isUnique: false
    });
    await view4.save();
    
    stats = await View.recalculateDocumentStats(testDoc._id);
    console.log(`   Views: ${stats.totalViews}, Unique: ${stats.uniqueViews}, Contacts: ${stats.contactsCollected}\n`);
    
    // Test the contactExists method
    console.log('🔍 Testing contactExists method:');
    const johnExists = await View.contactExists(testDoc._id, 'John Doe', '+1234567890');
    const janeExists = await View.contactExists(testDoc._id, 'Jane Smith', '+0987654321');
    const bobExists = await View.contactExists(testDoc._id, 'Bob Wilson', '+1111111111');
    
    console.log(`   John Doe exists: ${johnExists}`);
    console.log(`   Jane Smith exists: ${janeExists}`);
    console.log(`   Bob Wilson exists: ${bobExists}\n`);
    
    // Final statistics
    console.log('📈 Final Test Results:');
    console.log(`   Expected: 4 total views, 2 unique views, 2 unique contacts`);
    console.log(`   Actual: ${stats.totalViews} total views, ${stats.uniqueViews} unique views, ${stats.contactsCollected} unique contacts`);
    
    // Verify the results
    if (stats.totalViews === 4 && stats.uniqueViews === 2 && stats.contactsCollected === 2) {
      console.log('✅ Test PASSED: Unique tracking is working correctly!');
    } else {
      console.log('❌ Test FAILED: Unique tracking is not working as expected');
    }
    
    // Clean up test data
    await Document.findByIdAndDelete(testDoc._id);
    await View.deleteMany({ documentId: testDoc._id });
    console.log('\n🧹 Cleaned up test data');
    
  } catch (error) {
    console.error('❌ Error during testing:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Run the test
if (require.main === module) {
  testUniqueTracking();
}

module.exports = { testUniqueTracking };