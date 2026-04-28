/**
 * ERPBUDDY - DEMO DATA SEED SCRIPT
 * Creates complete demo business flow for testing
 * 
 * Run: node backend/scripts/seedData.js
 * 
 * ⚠️ SECURITY: Only runs in development mode
 */

require('module-alias/register');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

// ============================================
// SECURITY CHECK - ONLY ALLOW IN DEVELOPMENT
// ============================================

if (process.env.NODE_ENV === 'production') {
  console.error('❌ ERROR: Seed script is disabled in production!');
  console.error('   This is a safety measure to prevent demo data in live systems.');
  console.error('   If you need to seed data in production, temporarily set NODE_ENV=development');
  process.exit(1);
}

console.log('🔒 Security check passed: Running in development mode');

// Models
const Tenant = mongoose.models.Tenant || mongoose.model('Tenant');
const Company = mongoose.models.Company || mongoose.model('Company');
const Account = mongoose.models.Account || require('../src/modules/accounting/accounts/account.model');
const Item = mongoose.models.Item || require('../src/modules/item/item.model');
const Warehouse = mongoose.models.Warehouse || require('../src/modules/inventory/warehouse.model');
const Customer = mongoose.models.Customer || require('../src/modules/accounting/customer.model');
const Supplier = mongoose.models.Supplier || require('../src/modules/accounting/supplier.model');

// Services
const { connectDB } = require('../src/loaders/mongodb.loader');

// ============================================
// CONFIGURATION
// ============================================

const DEMO_DATA = {
  tenant: {
    name: 'Demo Rice Trading Co.',
    code: 'DEMO',
    isActive: true
  },
  company: {
    name: 'Demo Rice Trading Co.',
    code: 'DEMO'
  },
  accounts: [
    { code: '1001', name: 'Cash', type: 'asset', allowPosting: true },
    { code: '1002', name: 'Inventory - Raw Materials', type: 'asset', allowPosting: true },
    { code: '1003', name: 'Inventory - Finished Goods', type: 'asset', allowPosting: true },
    { code: '1004', name: 'Inventory - Byproducts', type: 'asset', allowPosting: true },
    { code: '2001', name: 'Accounts Payable', type: 'liability', allowPosting: true },
    { code: '3001', name: 'Share Capital', type: 'equity', allowPosting: true },
    { code: '4001', name: 'Sales Revenue', type: 'income', allowPosting: true },
    { code: '5001', name: 'Cost of Goods Sold', type: 'expense', allowPosting: true },
    { code: '5002', name: 'Transport Expense', type: 'expense', allowPosting: true },
    { code: '5003', name: 'Packing Expense', type: 'expense', allowPosting: true },
    { code: '5004', name: 'Labour Expense', type: 'expense', allowPosting: true }
  ],
  items: [
    { name: 'Paddy', itemType: 'raw', unit: 'kg' },
    { name: 'Rice', itemType: 'finished', unit: 'kg' },
    { name: 'Broken Rice', itemType: 'byproduct', unit: 'kg' },
    { name: 'Rice Husk', itemType: 'byproduct', unit: 'kg' }
  ],
  warehouse: {
    name: 'Main Godown',
    code: 'MAIN'
  },
  customer: {
    name: 'Rice Traders Ltd.',
    email: 'buyer@ricetraders.com'
  },
  supplier: {
    name: 'Farmers Cooperative',
    email: 'sales@farmerscoop.com'
  }
};

// ============================================
// HELPER FUNCTIONS
// ============================================

async function getOrCreateTenant(data) {
  let tenant = await Tenant.findOne({ code: data.code });
  if (!tenant) {
    tenant = await Tenant.create(data);
    console.log(`✅ Tenant created: ${tenant.name}`);
  } else {
    console.log(`ℹ️  Tenant exists: ${tenant.name}`);
  }
  return tenant;
}

async function getOrCreateCompany(data, tenantId) {
  let company = await Company.findOne({ code: data.code, tenantId });
  if (!company) {
    company = await Company.create({ ...data, tenantId });
    console.log(`✅ Company created: ${company.name}`);
  } else {
    console.log(`ℹ️  Company exists: ${company.name}`);
  }
  return company;
}

async function getOrCreateAccount(data, tenantId) {
  let account = await Account.findOne({ code: data.code, tenantId });
  if (!account) {
    account = await Account.create({ ...data, tenantId, isActive: true });
    console.log(`  ✅ Account: ${account.name} (${account.code})`);
  }
  return account;
}

async function getOrCreateItem(data, tenantId) {
  let item = await Item.findOne({ name: data.name, tenantId });
  if (!item) {
    item = await Item.create({ ...data, tenantId, isActive: true });
    console.log(`  ✅ Item: ${item.name}`);
  }
  return item;
}

async function getOrCreateWarehouse(data, tenantId) {
  let warehouse = await Warehouse.findOne({ code: data.code, tenantId });
  if (!warehouse) {
    warehouse = await Warehouse.create({ ...data, tenantId, isActive: true });
    console.log(`✅ Warehouse created: ${warehouse.name}`);
  } else {
    console.log(`ℹ️  Warehouse exists: ${warehouse.name}`);
  }
  return warehouse;
}

async function getOrCreateCustomer(data, tenantId) {
  let customer = await Customer.findOne({ email: data.email, tenantId });
  if (!customer) {
    customer = await Customer.create({ ...data, tenantId, isActive: true });
    console.log(`✅ Customer created: ${customer.name}`);
  } else {
    console.log(`ℹ️  Customer exists: ${customer.name}`);
  }
  return customer;
}

async function getOrCreateSupplier(data, tenantId) {
  let supplier = await Supplier.findOne({ email: data.email, tenantId });
  if (!supplier) {
    supplier = await Supplier.create({ ...data, tenantId, isActive: true });
    console.log(`✅ Supplier created: ${supplier.name}`);
  } else {
    console.log(`ℹ️  Supplier exists: ${supplier.name}`);
  }
  return supplier;
}

// ============================================
// MAIN SEED FUNCTION
// ============================================

async function seedData() {
  console.log('='.repeat(60));
  console.log('🌱 ERPBUDDY DEMO DATA SEED');
  console.log('='.repeat(60));

  try {
    await connectDB();
    console.log('✅ MongoDB connected');

    // 1. Create Tenant
    console.log('\n📋 Creating Tenant...');
    const tenant = await getOrCreateTenant(DEMO_DATA.tenant);

    // 2. Create Company
    console.log('\n🏢 Creating Company...');
    const company = await getOrCreateCompany(DEMO_DATA.company, tenant._id);

    // 3. Create Accounts
    console.log('\n💰 Creating Accounts...');
    const accounts = {};
    for (const accData of DEMO_DATA.accounts) {
      const acc = await getOrCreateAccount(accData, tenant._id);
      accounts[acc.code] = acc;
    }

    // 4. Create Items
    console.log('\n📦 Creating Items...');
    const items = {};
    for (const itemData of DEMO_DATA.items) {
      const item = await getOrCreateItem(itemData, tenant._id);
      items[item.name.toLowerCase().replace(' ', '_')] = item;
    }

    // 5. Create Warehouse
    console.log('\n🏭 Creating Warehouse...');
    const warehouse = await getOrCreateWarehouse(DEMO_DATA.warehouse, tenant._id);

    // 6. Create Customer
    console.log('\n👤 Creating Customer...');
    const customer = await getOrCreateCustomer(DEMO_DATA.customer, tenant._id);

    // 7. Create Supplier
    console.log('\n🤝 Creating Supplier...');
    const supplier = await getOrCreateSupplier(DEMO_DATA.supplier, tenant._id);

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('✅ SEED DATA COMPLETE');
    console.log('='.repeat(60));
    console.log(`\n📊 Summary:`);
    console.log(`  Tenant: ${tenant.name} (${tenant._id})`);
    console.log(`  Company: ${company.name}`);
    console.log(`  Accounts: ${Object.keys(accounts).length}`);
    console.log(`  Items: ${Object.keys(items).length}`);
    console.log(`  Warehouses: 1`);
    console.log(`  Customers: 1`);
    console.log(`  Suppliers: 1`);

    console.log('\n🔑 Key IDs (save for API testing):');
    console.log(`  Tenant ID: ${tenant._id}`);
    console.log(`  Company ID: ${company._id}`);
    console.log(`  Warehouse ID: ${warehouse._id}`);
    console.log(`  Customer ID: ${customer._id}`);
    console.log(`  Supplier ID: ${supplier._id}`);
    console.log(`  Cash Account: ${accounts['1001']._id}`);
    console.log(`  Sales Account: ${accounts['4001']._id}`);
    console.log(`  COGS Account: ${accounts['5001']._id}`);
    console.log(`  Inventory Account: ${accounts['1003']._id}`);
    console.log(`  Transport Expense: ${accounts['5002']._id}`);
    console.log(`  Packing Expense: ${accounts['5003']._id}`);

    console.log('\n🚀 Next Steps:');
    console.log('  1. Start the server: npm start');
    console.log('  2. Login with admin@erpbuddy.com / password123');
    console.log('  3. Use the IDs above for API testing');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed Error:', error);
    process.exit(1);
  }
}

// ============================================
// RUN SEED
// ============================================

seedData();