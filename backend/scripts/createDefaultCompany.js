// Bootstrap script to create default Tenant, Company, and System User
require('module-alias/register');
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/erpbuddy';

async function main() {
  try {
    await mongoose.connect(MONGO_URI);

    const db = mongoose.connection.db;

    // Step 1: Create or find default Tenant
    let tenant = await db.collection('tenants').findOne({ name: 'Default Tenant' });
    if (!tenant) {
      const tenantResult = await db.collection('tenants').insertOne({
        name: 'Default Tenant',
        email: 'admin@erpbuddy.local',
        subscriptionStatus: 'active',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      tenant = await db.collection('tenants').findOne({ _id: tenantResult.insertedId });
      console.log('✅ Created default tenant:', tenant._id.toString());
    } else {
      console.log('✅ Default tenant already exists:', tenant._id.toString());
    }

    // Step 2: Create or find system User
    let user = await db.collection('users').findOne({ email: 'system@erpbuddy.local' });
    if (!user) {
      const userResult = await db.collection('users').insertOne({
        name: 'System Admin',
        email: 'system@erpbuddy.local',
        companyId: null, // Will be set after company creation
        createdAt: new Date()
      });
      user = await db.collection('users').findOne({ _id: userResult.insertedId });
      console.log('✅ Created system user:', user._id.toString());
    } else {
      console.log('✅ System user already exists:', user._id.toString());
    }

    // Step 3: Create or find default Company
    let company = await db.collection('companies').findOne({ name: 'Default Company' });
    if (!company) {
      const companyResult = await db.collection('companies').insertOne({
        tenantId: tenant._id,
        name: 'Default Company',
        email: 'company@erpbuddy.local',
        status: 'active',
        createdBy: user._id,
        createdAt: new Date(),
        updatedAt: new Date(),
        isDeleted: false
      });
      company = await db.collection('companies').findOne({ _id: companyResult.insertedId });
      console.log('✅ Created default company:', company._id.toString());

      // Step 4: Update user with company ID
      await db.collection('users').updateOne({ _id: user._id }, { $set: { companyId: company._id } });
      console.log('✅ Updated system user with company ID');
    } else {
      console.log('✅ Default company already exists:', company._id.toString());
    }

    console.log('\n📋 Bootstrap Summary:');
    console.log(`  Tenant ID:   ${tenant._id.toString()}`);
    console.log(`  Company ID:  ${company._id.toString()}`);
    console.log(`  User ID:     ${user._id.toString()}`);
    console.log('\n✅ Bootstrap complete! Use Company ID in service layers.');

    await mongoose.disconnect();
  } catch (err) {
    console.error('❌ Bootstrap failed:', err.message);
    process.exit(1);
  }
}

main();
