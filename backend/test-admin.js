const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import User model
const User = require('./models/User');

async function testAdminUser() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/flipbook', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Connected to MongoDB');
    
    // Check if admin user exists
    const existingAdmin = await User.findOne({ email: 'admin@flipbook.com' });
    console.log('Existing admin user:', existingAdmin);
    
    if (!existingAdmin) {
      console.log('Creating admin user...');
      
      // Create admin user manually
      const adminUser = new User({
        email: 'admin@flipbook.com',
        passwordHash: 'admin123', // Will be hashed by pre-save hook
        role: 'admin'
      });
      
      await adminUser.save();
      console.log('✅ Admin user created successfully');
      
      // Verify the user was created
      const createdUser = await User.findOne({ email: 'admin@flipbook.com' });
      console.log('Created user:', createdUser);
    } else {
      console.log('Admin user already exists');
      
      // Test password comparison
      const isPasswordCorrect = await existingAdmin.comparePassword('admin123');
      console.log('Password test result:', isPasswordCorrect);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.connection.close();
    process.exit(0);
  }
}

testAdminUser();