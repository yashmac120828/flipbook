const mongoose = require('mongoose');
require('dotenv').config();

// Import User model
const User = require('./models/User');

async function resetAdminUser() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/flipbook', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Connected to MongoDB');
    
    // Delete existing admin user
    await User.deleteOne({ email: 'admin@flipbook.com' });
    console.log('🗑️ Deleted existing admin user');
    
    // Create new admin user (let pre-save hook handle hashing)
    const adminUser = new User({
      email: 'admin@flipbook.com',
      passwordHash: 'admin123', // Will be hashed by pre-save hook
      role: 'admin'
    });
    
    await adminUser.save();
    console.log('✅ New admin user created successfully');
    
    // Test the password
    const testUser = await User.findOne({ email: 'admin@flipbook.com' });
    const isPasswordCorrect = await testUser.comparePassword('admin123');
    console.log('Password test result:', isPasswordCorrect);
    
    if (isPasswordCorrect) {
      console.log('🎉 Admin user is ready! Email: admin@flipbook.com, Password: admin123');
    } else {
      console.error('❌ Password test failed!');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.connection.close();
    process.exit(0);
  }
}

resetAdminUser();