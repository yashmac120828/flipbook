require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

async function createTestAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Generate password hash
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash('admin123', salt);

    // Check if admin exists
    const existingAdmin = await User.findOne({ email: 'admin@example.com' });
    
    if (existingAdmin) {
      console.log('Admin user already exists. Updating password...');
      existingAdmin.passwordHash = passwordHash;
      await existingAdmin.save();
      console.log('Password updated');
    } else {
      // Create new admin
      const admin = new User({
        email: 'admin@example.com',
        passwordHash: passwordHash,
        role: 'admin',
        isActive: true
      });
      
      await admin.save();
      console.log('Admin user created');
    }

    console.log('\nTest Admin Credentials:');
    console.log('Email: admin@example.com');
    console.log('Password: admin123');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
    process.exit(0);
  }
}

createTestAdmin();