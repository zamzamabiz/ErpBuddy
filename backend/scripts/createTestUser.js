// Bootstrap test user for authentication
require('module-alias/register');
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/erpbuddy';

async function main() {
  try {
    await mongoose.connect(MONGO_URI);

    const User = require('../src/modules/core/users/user.model');
    const db = mongoose.connection.db;

    // Get the default tenant/company
    let tenant = await db.collection('tenants').findOne({ name: 'Default Tenant' });
    let role = await db.collection('roles').findOne();
    
    if (!tenant) {
      console.log('❌ Default tenant not found. Run createDefaultCompany.js first.');
      process.exit(1);
    }

    if (!role) {
      console.log('⚠️  No roles found, creating a default Admin role...');
      const newRole = await db.collection('roles').insertOne({ name: 'Admin', permissions: [] });
      role = await db.collection('roles').findOne({ _id: newRole.insertedId });
    }

    // Check if test user already exists
    let testUser = await User.findOne({ email: 'user@company.local' });
    if (testUser) {
      console.log('✅ Test user already exists:', testUser.email);
      await mongoose.disconnect();
      return;
    }

    // Create test user
    testUser = await User.create({
      name: 'Test User',
      email: 'user@company.local',
      password: 'password123',  // Will be hashed by pre-save hook
      tenantId: tenant._id,
      role: role._id,
      userRole: 'admin',  // Set as admin
      company: 'Default Company'
    });

    console.log('✅ Test user created successfully:');
    console.log(`  Email: ${testUser.email}`);
    console.log(`  Password: password123`);
    console.log(`  Role: ${testUser.userRole}`);
    console.log(`  Tenant ID: ${testUser.tenantId}`);

    await mongoose.disconnect();
  } catch (err) {
    console.error('❌ Error creating test user:', err.message);
    process.exit(1);
  }
}

main();
