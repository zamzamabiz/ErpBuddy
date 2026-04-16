// Script to add tenantId to existing Auth documents
require('module-alias/register');
const mongoose = require('mongoose');
const config = require('@config/db.config');
const Auth = require('../src/modules/core/auth/auth.model');
const Company = require('../src/modules/core/companies/company.model');

async function migrate() {
  try {
    console.log('Starting Auth tenantId migration...\n');
    
    await mongoose.connect(config.uri, config.options);
    console.log('✓ MongoDB connected');

    // Find all Auth records without tenantId
    const authRecords = await Auth.find({ tenantId: { $exists: false } }).lean();
    console.log(`Found ${authRecords.length} Auth records without tenantId\n`);

    let updated = 0;
    for (const authRecord of authRecords) {
      // Get company and extract tenantId
      const company = await Company.findById(authRecord.companyId);
      if (company && company.tenantId) {
        await Auth.updateOne(
          { _id: authRecord._id },
          { $set: { tenantId: company.tenantId } }
        );
        updated++;
        console.log(`✓ Updated Auth record ${authRecord.email}`);
      } else {
        console.log(`⚠ Warning: Could not find tenantId for company ${authRecord.companyId}`);
      }
    }

    console.log(`\n✓ Migration complete - ${updated} records updated`);
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('✗ Migration error:', err.message);
    process.exit(1);
  }
}

migrate();
