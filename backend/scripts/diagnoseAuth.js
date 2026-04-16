// Diagnostics script to check User and Auth records
const mongoose = require('mongoose');
const config = require('../src/config/db.config');

async function diagnose() {
  try {
    await mongoose.connect(config.uri, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('✓ MongoDB connected\n');

    // Get collections
    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');
    const authCollection = db.collection('auths');
    const rolesCollection = db.collection('roles');

    // Find admin user
    const adminUser = await usersCollection.findOne({ email: 'admin@demo.local' });
    console.log('Admin User:');
    console.log('  _id:', adminUser?._id);
    console.log('  email:', adminUser?.email);
    console.log('  role:', adminUser?.role);
    console.log('  company:', adminUser?.company);
    console.log('  isActive:', adminUser?.isActive);

    // Find admin role
    const adminRole = await rolesCollection.findOne({ name: 'Admin' });
    console.log('\nAdmin Role:');
    console.log('  _id:', adminRole?._id);
    console.log('  name:', adminRole?.name);

    // Find auth record
    const authRecord = await authCollection.findOne({ email: 'admin@demo.local' });
    console.log('\nAuth Record:');
    console.log('  _id:', authRecord?._id);
    console.log('  userId:', authRecord?.userId);
    console.log('  email:', authRecord?.email);
    console.log('  companyId:', authRecord?.companyId);
    console.log('  roleId:', authRecord?.roleId);
    console.log('  isActive:', authRecord?.isActive);

    // Check if userId in auth record matches the actual user _id
    if (adminUser && authRecord) {
      console.log('\n✓ Match Check:');
      console.log('  User _id matches Auth userId?', adminUser._id.toString() === authRecord.userId.toString());
    }

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('✗ Error:', err.message);
    process.exit(1);
  }
}

diagnose();
