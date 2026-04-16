/**
 * CREATE TEST SALE - FIXED FOR MULTI-TENANCY
 * 
 * FIXES APPLIED:
 * 1. ✅ Fetches real tenant from master DB
 * 2. ✅ Fetches real company under tenant
 * 3. ✅ Fetches real customer, warehouse, currency from tenant DB
 * 4. ✅ Creates sale with ALL required fields:
 *    - tenantId, company, salesNumber, salesDate, customer, warehouse, currency, items, totalAmount, netAmount
 * 5. ✅ Verifies creation with proper query
 * 6. ✅ Reports tenant ID, company ID, and result
 */

const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/erpbuddy';

async function createTestSale() {
  try {
    console.log('\n========================================');
    console.log('CREATE TEST SALE - MULTI-TENANT FIX'.padEnd(40));
    console.log('========================================\n');

    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // ─────────────────────────────────────────────────
    // STEP 1: Get Real Tenant from Master DB
    // ─────────────────────────────────────────────────
    const Tenant = require('./src/modules/core/tenants/tenant.model');
    const tenant = await Tenant.findOne({});
    
    if (!tenant) {
      console.log('❌ No tenant found in master database.');
      process.exit(1);
    }

    console.log(`📋 TENANT ID:         ${tenant._id}`);
    console.log(`   Name:             ${tenant.name}`);

    // ─────────────────────────────────────────────────
    // STEP 2: Get Real Company for This Tenant
    // ─────────────────────────────────────────────────
    const Company = require('./src/modules/core/companies/company.model');
    const company = await Company.findOne({ tenantId: tenant._id });
    
    if (!company) {
      console.log('❌ No company found for this tenant.');
      process.exit(1);
    }

    console.log(`\n📋 COMPANY ID:        ${company._id}`);
    console.log(`   Name:             ${company.name}`);

    // ─────────────────────────────────────────────────
    // STEP 3: Switch to Tenant DB & Fetch Master Data
    // ─────────────────────────────────────────────────
    const tenantDB = mongoose.connection.useDb(tenant._id.toString());
    
    // Load models from tenant database
    const salesSchema = new mongoose.Schema({
      tenantId: { type: mongoose.Schema.Types.ObjectId, required: true },
      company: { type: mongoose.Schema.Types.ObjectId, required: true },
      salesNumber: { type: String, required: true },
      salesDate: { type: Date, required: true },
      customer: { type: mongoose.Schema.Types.ObjectId, required: true },
      warehouse: { type: mongoose.Schema.Types.ObjectId, required: true },
      currency: { type: mongoose.Schema.Types.ObjectId, required: true },
      commodity: { type: String, default: "" },
      broker: { type: mongoose.Schema.Types.ObjectId, default: null },
      brokerCommission: { type: Number, default: 0 },
      items: [{
        item: mongoose.Schema.Types.ObjectId,
        quantity: Number,
        unitPrice: Number,
        totalPrice: Number,
        bags: { type: Number, default: 0 },
        weightPerBag: { type: Number, default: 0 }
      }],
      totalAmount: { type: Number, required: true },
      taxAmount: { type: Number, default: 0 },
      netAmount: { type: Number, required: true },
      status: { type: String, enum: ['Draft', 'Posted', 'Cancelled'], default: 'Draft' },
      createdBy: mongoose.Schema.Types.ObjectId,
      createdAt: { type: Date, default: Date.now },
      updatedAt: { type: Date, default: Date.now }
    }, { timestamps: true });

    const customerSchema = new mongoose.Schema({
      tenantId: mongoose.Schema.Types.ObjectId,
      companyId: mongoose.Schema.Types.ObjectId,
      customerCode: String,
      name: String,
      displayName: String,
      email: String,
      phone: String,
      mobile: String,
      address: String,
      city: String,
      country: String,
      taxNumber: String,
      creditLimit: Number,
      paymentTerms: String,
      currency: String,
      status: { type: String, default: 'active' },
      notes: String,
      createdBy: mongoose.Schema.Types.ObjectId,
      updatedBy: mongoose.Schema.Types.ObjectId,
      createdAt: { type: Date, default: Date.now },
      updatedAt: Date,
      isDeleted: { type: Boolean, default: false }
    });

    const warehouseSchema = new mongoose.Schema({
      companyId: mongoose.Schema.Types.ObjectId,
      warehouseCode: String,
      name: String,
      location: String,
      address: String,
      city: String,
      country: String,
      manager: mongoose.Schema.Types.ObjectId,
      phone: String,
      status: { type: String, default: 'active' },
      notes: String,
      createdBy: mongoose.Schema.Types.ObjectId,
      updatedBy: mongoose.Schema.Types.ObjectId,
      createdAt: { type: Date, default: Date.now },
      updatedAt: { type: Date, default: Date.now },
      isDeleted: { type: Boolean, default: false }
    });

    const currencySchema = new mongoose.Schema({
      company: mongoose.Schema.Types.ObjectId,
      currencyCode: String,
      currencyName: String,
      symbol: String,
      exchangeRate: { type: Number, default: 1 },
      isBaseCurrency: { type: Boolean, default: false },
      decimalPlaces: { type: Number, default: 2 },
      isActive: { type: Boolean, default: true },
      createdBy: mongoose.Schema.Types.ObjectId,
      updatedBy: mongoose.Schema.Types.ObjectId,
      createdAt: Date,
      updatedAt: Date
    }, { timestamps: true });

    const itemSchema = new mongoose.Schema({
      companyId: mongoose.Schema.Types.ObjectId,
      tenantId: mongoose.Schema.Types.ObjectId,
      itemCode: String,
      name: String,
      description: String,
      itemType: String,
      unit: String,
      rate: Number,
      status: String,
      createdBy: mongoose.Schema.Types.ObjectId,
      updatedBy: mongoose.Schema.Types.ObjectId,
      createdAt: { type: Date, default: Date.now },
      updatedAt: { type: Date, default: Date.now }
    });

    const Sale = tenantDB.model('Sales', salesSchema);
    const Customer = tenantDB.model('Customer', customerSchema);
    const Warehouse = tenantDB.model('Warehouse', warehouseSchema);
    const Currency = tenantDB.model('Currency', currencySchema);
    const Item = tenantDB.model('Item', itemSchema);

    // Fetch master data
    console.log('\n🔍 Fetching master data from tenant DB...');
    
    let customer = await Customer.findOne({ companyId: company._id });
    if (!customer) {
      console.log('   ⚠️  No customer found. Creating test customer...');
      customer = await Customer.create({
        companyId: company._id,
        tenantId: tenant._id,
        customerCode: `CUST-${Date.now()}`,
        name: 'Test Customer',
        email: 'test@customer.com',
        phone: '+1-555-0100',
        address: '123 Main Street',
        city: 'Test City',
        country: 'USA',
        status: 'active'
      });
      console.log(`   ✅ Created Customer: ${customer._id}`);
    }
    console.log(`   ✅ Customer: ${customer._id} (${customer.name || customer.customerCode})`);

    let warehouse = await Warehouse.findOne({ companyId: company._id });
    if (!warehouse) {
      console.log('   ⚠️  No warehouse found. Creating test warehouse...');
      warehouse = await Warehouse.create({
        companyId: company._id,
        warehouseCode: `WH-${Date.now()}`,
        name: 'Test Warehouse',
        location: 'Test Location',
        address: '456 Warehouse St',
        city: 'Test City',
        country: 'USA',
        status: 'active'
      });
      console.log(`   ✅ Created Warehouse: ${warehouse._id}`);
    }
    console.log(`   ✅ Warehouse: ${warehouse._id} (${warehouse.name})`);

    let currency = await Currency.findOne({});
    if (!currency) {
      console.log('   ⚠️  No currency found. Creating test currency...');
      currency = await Currency.create({
        company: company._id,
        currencyCode: 'USD',
        currencyName: 'US Dollar',
        symbol: '$',
        exchangeRate: 1,
        isBaseCurrency: true,
        decimalPlaces: 2
      });
      console.log(`   ✅ Created Currency: ${currency._id}`);
    }
    console.log(`   ✅ Currency: ${currency._id} (${currency.currencyCode})`);

    let item = await Item.findOne({ companyId: company._id });
    if (!item) {
      console.log('   ⚠️  No item found. Creating test item...');
      item = await Item.create({
        companyId: company._id,
        tenantId: tenant._id,
        itemCode: `ITEM-${Date.now()}`,
        name: 'Test Item - Basmati Rice',
        description: 'Premium Basmati Rice 1121',
        itemType: 'product',
        unit: 'KG',
        rate: 150,
        status: 'active'
      });
      console.log(`   ✅ Created Item: ${item._id}`);
    }
    console.log(`   ✅ Item: ${item._id} (${item.name || item.itemCode})`);


    // ─────────────────────────────────────────────────
    // STEP 4: Create Sale with ALL Required Fields
    // ─────────────────────────────────────────────────
    console.log('\n🔧 Creating test sale...');

    const saleData = {
      tenantId: tenant._id,
      company: company._id,           // ✅ CRITICAL: Use 'company' not 'companyId'
      salesNumber: `SI-TEST-${Date.now()}`,
      salesDate: new Date(),
      customer: customer._id,         // ✅ CRITICAL: Required
      warehouse: warehouse._id,       // ✅ CRITICAL: Required
      currency: currency._id,         // ✅ CRITICAL: Required
      commodity: 'Basmati Rice - Premium Grade',
      broker: customer._id,           // Using customer as broker for test
      brokerCommission: 500,
      items: [
        {
          item: item._id,
          quantity: 1000,
          unitPrice: 150,
          totalPrice: 150000,
          bags: 20,
          weightPerBag: 50
        }
      ],
      totalAmount: 150000,
      taxAmount: 0,
      netAmount: 150000,              // ✅ CRITICAL: Required
      status: 'Draft',
      createdBy: tenant._id
    };

    const sale = await Sale.create(saleData);
    console.log(`   ✅ Sale created: ${sale._id}`);

    // ─────────────────────────────────────────────────
    // STEP 5: Verify Creation
    // ─────────────────────────────────────────────────
    console.log('\n📊 Verifying creation...');
    
    const verify = await Sale.findById(sale._id)
      .populate('customer', 'name customerCode')
      .populate('warehouse', 'name')
      .populate('currency', 'currencyCode')
      .populate('items.item', 'name itemCode')
      .lean();

    if (!verify) {
      console.log('❌ Verification failed: Sale not found');
      process.exit(1);
    }

    console.log(`   ✅ Sale verified in database\n`);

    // ─────────────────────────────────────────────────
    // STEP 6: Report Results
    // ─────────────────────────────────────────────────
    console.log('========================================');
    console.log('REPORT'.padEnd(40));
    console.log('========================================\n');

    console.log(`Tenant ID:        ${tenant._id}`);
    console.log(`Company ID:       ${company._id}`);
    console.log(`\nSale Created:     YES ✅`);
    console.log(`\n  Sale ID:        ${verify._id}`);
    console.log(`  Sales Number:   ${verify.salesNumber}`);
    console.log(`  Status:         ${verify.status}`);
    console.log(`\n  Customer:       ${verify.customer?.name || verify.customer?._id}`);
    console.log(`  Warehouse:      ${verify.warehouse?.name || verify.warehouse?._id}`);
    console.log(`  Currency:       ${verify.currency?.currencyCode || verify.currency?._id}`);
    console.log(`\n  Commodity:      ${verify.commodity}`);
    console.log(`  Broker:         ${verify.broker}`);
    console.log(`  Commission:     ${verify.brokerCommission}`);
    console.log(`\n  Total Amount:   ${verify.totalAmount}`);
    console.log(`  Net Amount:     ${verify.netAmount}`);
    console.log(`\n  Items:          ${verify.items.length} line(s)`);
    verify.items.forEach((line, i) => {
      console.log(`    ${i + 1}. ${line.item?.name || line.item?._id} | Qty: ${line.quantity} | Price: ${line.unitPrice}`);
    });

    console.log(`\n📌 Test Sale Ready for API Testing`);
    console.log(`   GET /api/sales/${verify._id}`);

    await mongoose.disconnect();
    console.log('\n✅ Test completed successfully\n');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Error:', err.message);
    console.error(err.stack);
    process.exit(1);
  }
}

createTestSale();
