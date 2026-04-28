/**
 * 🔐 PASSWORD RESET SCRIPT
 * ========================
 * Use this script to reset user passwords in the ERP system.
 * 
 * Usage: node reset-password.js
 * 
 * Default credentials after reset:
 * - admin@erpbuddy.com / admin123 (Admin)
 * - staff@erpbuddy.com / staff123 (Staff)
 * - admin@test.com / test123 (Test Admin)
 */

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
require('dotenv').config({ path: '.env' });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/erpbuddy';

async function resetPasswords() {
  console.log('🔐 Password Reset Script');
  console.log('========================\n');
  
  try {
    // Connect to MongoDB
    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const users = [
      { email: 'admin@erpbuddy.com', password: 'admin123', role: 'admin', name: 'Admin User' },
      { email: 'staff@erpbuddy.com', password: 'staff123', role: 'staff', name: 'Staff User' },
      { email: 'admin@test.com', password: 'test123', role: 'admin', name: 'Test Admin' }
    ];

    // Get users collection
    const usersCollection = mongoose.connection.db.collection('users');

    // First, check existing users
    console.log('🔍 Checking existing users...');
    const existingUsers = await usersCollection.find({
      email: { $in: users.map(u => u.email) }
    }).toArray();

    if (existingUsers.length > 0) {
      console.log('\n📋 Existing users found:');
      existingUsers.forEach(u => {
        console.log(`   - ${u.email} (role: ${u.role || 'N/A'})`);
      });
    } else {
      console.log('   No existing users found with these emails.');
    }

    console.log('\n🔄 Resetting passwords...\n');

    // Reset or create users
    for (const user of users) {
      const hashedPassword = await bcrypt.hash(user.password, 10);
      
      const result = await usersCollection.updateOne(
        { email: user.email },
        { $set: { 
            password: hashedPassword,
            role: user.role,
            name: user.name,
            updatedAt: new Date()
          },
          $setOnInsert: {
            createdAt: new Date(),
            isActive: true,
            emailVerified: false
          }
        },
        { upsert: true }
      );

      const status = result.modifiedCount > 0 ? 'UPDATED' : 'CREATED';
      console.log(`✅ User ${status}: ${user.email} (password: ${user.password})`);
    }

    console.log('\n========================');
    console.log('✅ Password reset complete!');
    console.log('\n📝 Login Credentials:');
    console.log('   Email: admin@erpbuddy.com | Password: admin123');
    console.log('   Email: staff@erpbuddy.com | Password: staff123');
    console.log('   Email: admin@test.com | Password: test123');
    console.log('\n⚠️  Please change these passwords after logging in!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB');
  }
}

// Also list all users
async function listAllUsers() {
  console.log('\n📋 All users in the system:\n');
  
  try {
    await mongoose.connect(MONGODB_URI);
    const usersCollection = mongoose.connection.db.collection('users');
    const allUsers = await usersCollection.find({}).toArray();
    
    if (allUsers.length === 0) {
      console.log('   No users found in the database.');
    } else {
      allUsers.forEach(u => {
        console.log(`   - ${u.email} (role: ${u.role || 'N/A'}, name: ${u.name || 'N/A'})`);
      });
    }
  } catch (error) {
    console.error('❌ Error listing users:', error.message);
  }
}

// Run the script
resetPasswords().then(() => {
  // Also list all users after reset
  listAllUsers().then(() => process.exit(0));
});