/**
 * Script to create admin user for a specific tenant
 * Usage: node create-tenant-admin.js <tenant-email> <admin-email> <admin-password>
 * Example: node create-tenant-admin.js test@tenant.com admin@test.com admin123
 */

require('module-alias/register');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

dotenv.config();

// Import models
const Tenant = require('./src/models/tenant.model');

// User model - use the core module
const User = require('./src/modules/core/users/user.model');

async function createTenantAdmin() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/erpbuddy');
    console.log('✅ MongoDB connected');

    // Get arguments
    const tenantEmail = process.argv[2] || 'test@tenant.com';
    const adminEmail = process.argv[3] || 'admin@tenant.com';
    const adminPassword = process.argv[4] || 'admin123';
    const adminName = process.argv[5] || 'Tenant Admin';

    // Find tenant
    const tenant = await Tenant.findOne({ email: tenantEmail });
    if (!tenant) {
      console.error(`❌ Tenant with email "${tenantEmail}" not found`);
      // List available tenants
      const tenants = await Tenant.find({ isActive: true }).select('name email _id');
      console.log('\nAvailable tenants:');
      tenants.forEach(t => console.log(`  - ${t.name} (${t.email}) - ID: ${t._id}`));
      process.exit(1);
    }

    console.log(`📌 Found tenant: ${tenant.name} (${tenant.email})`);

    // Check if admin user already exists
    const existingUser = await User.findOne({ email: adminEmail });
    if (existingUser) {
      console.log(`⚠️ User with email "${adminEmail}" already exists`);
      console.log(`   Current tenant: ${existingUser.tenantId}`);
      
      // Update existing user's tenantId if different
      if (existingUser.tenantId.toString() !== tenant._id.toString()) {
        existingUser.tenantId = tenant._id;
        existingUser.userRole = 'admin';
        await existingUser.save();
        console.log(`✅ Updated user to tenant: ${tenant.name}`);
      }
      process.exit(0);
    }

    // Create new admin user
    // Note: Don't hash password manually - the pre-save hook will handle it
    const newUser = await User.create({
      name: adminName,
      email: adminEmail,
      password: adminPassword,  // Will be hashed by pre-save hook
      tenantId: tenant._id,
      userRole: 'admin',
      role: null,
      company: 'Default'
    });

    console.log(`✅ Admin user created successfully!`);
    console.log(`   Email: ${adminEmail}`);
    console.log(`   Password: ${adminPassword}`);
    console.log(`   Tenant: ${tenant.name}`);
    console.log(`   User ID: ${newUser._id}`);

    await mongoose.connection.close();
    console.log('✅ Database connection closed');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    await mongoose.connection.close();
    process.exit(1);
  }
}

createTenantAdmin();