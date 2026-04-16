// One-off script to migrate User data to Auth model
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const config = require('../src/config/db.config');

async function migrate() {
  try {
    await mongoose.connect(config.uri, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('✓ MongoDB connected');

    // Get collections
    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');
    const authCollection = db.collection('auths');

    // Get the admin user
    const adminUser = await usersCollection.findOne({ email: 'admin@demo.local' });
    if (!adminUser) {
      console.log('✗ Admin user not found. Please run seedData.js first.');
      await mongoose.disconnect();
      process.exit(1);
    }

    // Get the admin role
    const rolesCollection = db.collection('roles');
    const adminRole = await rolesCollection.findOne({ name: 'Admin' });
    if (!adminRole) {
      console.log('✗ Admin role not found.');
      await mongoose.disconnect();
      process.exit(1);
    }

    // Get the default company
    const companiesCollection = db.collection('companies');
    const defaultCompany = await companiesCollection.findOne({ name: 'Demo Company' });
    if (!defaultCompany) {
      console.log('✗ Default company not found.');
      await mongoose.disconnect();
      process.exit(1);
    }

    // Create Auth record
    const passwordHash = await bcrypt.hash('Admin@123', 10);
    const authRecord = {
      userId: adminUser._id,
      email: 'admin@demo.local',
      passwordHash,
      companyId: defaultCompany._id,
      roleId: adminRole._id,
      isActive: true,
      loginAttempts: 0,
      isLocked: false,
      companyId: defaultCompany._id,
      status: 'active',
      createdBy: adminUser._id,
      updatedBy: adminUser._id,
      createdAt: new Date(),
      updatedAt: new Date(),
      isDeleted: false
    };

    // Clear existing auth records and insert new one
    await authCollection.deleteMany({});
    const result = await authCollection.insertOne(authRecord);
    console.log('✓ Created auth record for admin user');
    console.log('  Auth ID:', result.insertedId);
    console.log('\nDefault Credentials:');
    console.log('  Email:    admin@demo.local');
    console.log('  Password: Admin@123');

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('✗ Error during migration:', err.message);
    process.exit(1);
  }
}

migrate();
