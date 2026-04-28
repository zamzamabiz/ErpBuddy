/**
 * Script to fix the tenant admin user (delete old and create new with correct password)
 */

require('module-alias/register');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

dotenv.config();

const Tenant = require('./src/models/tenant.model');
const User = require('./src/modules/core/users/user.model');

async function fixTenantAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/erpbuddy');
    console.log('✅ MongoDB connected');

    const tenantEmail = 'test@tenant.com';
    const adminEmail = 'admin@test.com';
    const adminPassword = 'admin123';
    const adminName = 'Test Admin';

    const tenant = await Tenant.findOne({ email: tenantEmail });
    if (!tenant) {
      console.error('❌ Tenant not found');
      process.exit(1);
    }

    // Delete existing user
    await User.deleteOne({ email: adminEmail });
    console.log('🗑️ Deleted existing user');

    // Create new user with correct password (will be hashed by pre-save hook)
    const newUser = await User.create({
      name: adminName,
      email: adminEmail,
      password: adminPassword,
      tenantId: tenant._id,
      userRole: 'admin',
      role: null,
      company: 'Default'
    });

    console.log('✅ Admin user recreated successfully!');
    console.log(`   Email: ${adminEmail}`);
    console.log(`   Password: ${adminPassword}`);
    console.log(`   Tenant: ${tenant.name}`);
    console.log(`   User ID: ${newUser._id}`);

    await mongoose.connection.close();
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    await mongoose.connection.close();
    process.exit(1);
  }
}

fixTenantAdmin();