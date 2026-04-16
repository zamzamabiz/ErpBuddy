/**
 * 🧪 QA STRESS TEST - Large-Scale Transactional Validation (V3 - FINAL)
 * Complete test suite with all required fields
 */

require('module-alias/register');

const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

// Models
const Item = require('./src/modules/masters/items/items.model');
const Warehouse = require('./src/modules/masters/warehouse/warehouse.model');
const Account = require('./src/modules/accounting/accounts/account.model');
const Purchase = require('./src/modules/business/purchase/purchase.model');
const Sales = require('./src/modules/business/sales/sales.model');
const StockLedger = require('./src/modules/inventory/stockLedger/stockLedger.model');

// Services
const purchaseService = require('./src/modules/business/purchase/purchase.service');
const salesService = require('./src/modules/business/sales/sales.service');

// ============================================================================
// 📊 RESULTS CONTAINER
// ============================================================================

const results = {
  tests: [],
  issues: [],
  metrics: {},
  cogs: {
    totalSales: 0,
    totalCogs: 0,
    inventory: 0,
  },
};

// ============================================================================
// 🔧 HELPERS
// ============================================================================

async function recordTest(name, status, details) {
  results.tests.push({ name, status, details, time: new Date() });
  console.log(`${status === 'PASS' ? '✅' : '❌'} ${name}: ${status}`);
  if (details?.message) console.log(`   💬 ${details.message}`);
}

async function setupData() {
  console.log('\n📋 SETUP TEST DATA');
  console.log('═'.repeat(60));

  const tenantId = new mongoose.Types.ObjectId('000000000000000000000001');
  const companyId = new mongoose.Types.ObjectId('100000000000000000000001');
  const currencyId = new mongoose.Types.ObjectId('200000000000000000000001');
  const warehouseId = new mongoose.Types.ObjectId('300000000000000000000001');
  const userId = new mongoose.Types.ObjectId('400000000000000000000001');

  // Create item
  const item = await Item.findOneAndUpdate(
    { tenantId, itemCode: 'QA-STRESS-001' },
    {
      tenantId,
      companyId,
      itemCode: 'QA-STRESS-001',
      name: 'Stress Test Item',
      itemType: 'inventory',
      purchasePrice: 10,
      sellingPrice: 15,
      status: 'active',
      createdBy: userId,
    },
    { upsert: true, new: true }
  );

  // Create warehouse
  const warehouse = await Warehouse.findOneAndUpdate(
    { companyId, warehouseCode: 'QA-STRESS-WH' },
    {
      companyId,
      warehouseCode: 'QA-STRESS-WH',
      name: 'Stress Test Warehouse',
      location: 'Test Location',
      status: 'active',
      createdBy: userId,
    },
    { upsert: true, new: true }
  );

  // Create accounts
  const acctsMap = {};
  for (const [key, cfg] of Object.entries({
    sales: { code: 'SALES-QA', name: 'Sales Revenue', type: 'income' },
    cogs: { code: 'COGS-QA', name: 'COGS', type: 'expense' },
    inventory: { code: 'INV-QA', name: 'Inventory', type: 'asset' },
    ar: { code: 'AR-QA', name: 'AR', type: 'asset' },
    ap: { code: 'AP-QA', name: 'AP', type: 'liability' },
  })) {
    acctsMap[key] = await Account.findOneAndUpdate(
      { tenantId, code: cfg.code },
      {
        tenantId,
        code: cfg.code,
        name: cfg.name,
        type: cfg.type,
        isActive: true,
        createdBy: userId,
      },
      { upsert: true, new: true }
    );
  }

  console.log(`✅ Item: ${item.itemCode}`);
  console.log(`✅ Warehouse: ${warehouse.warehouseCode}`);
  console.log(`✅ Accounts: Sales, COGS, Inventory, AR, AP`);

  return {
    tenantId,
    companyId,
    currencyId,
    warehouseId: warehouse._id,
    item,
    warehouse,
    accounts: acctsMap,
    userId,
  };
}

// ============================================================================
// 🧪 TEST FUNCTIONS
// ============================================================================

async function test1(data) {
  console.log('\n\n🔷 TEST 1: LARGE PURCHASE (1000 units @ 10)');
  console.log('═'.repeat(60));

  try {
    const start = Date.now();

    const pur = await Purchase.create({
      tenantId: data.tenantId,
      company: data.companyId,
      purchaseNumber: 'PUR-STRESS-001',
      purchaseDate: new Date(),
      supplier: data.accounts.ap._id,
      warehouse: data.warehouseId,
      currency: data.currencyId,
      items: [{
        item: data.item._id,
        quantity: 1000,
        unitCost: 10,
        totalCost: 10000,
      }],
      totalAmount: 10000,
      netAmount: 10000,
      supplierAccountId: data.accounts.ap._id,
      expenseAccountId: data.accounts.cogs._id,
      createdBy: data.userId,
    });

    console.log(`✅ Purchase created: ${pur._id}`);

    await purchaseService.post(pur._id, { tenantId: data.tenantId, _id: data.userId });
    console.log(`✅ Purchase posted`);

    const ledger = await StockLedger.find({
      tenantId: data.tenantId,
      itemId: data.item._id,
    }).sort({ createdAt: 1 });

    const latest = ledger[ledger.length - 1];
    const elapsed = Date.now() - start;
    results.metrics.test1 = elapsed;

    if (latest.qtyIn === 1000 && latest.balanceQty === 1000) {
      await recordTest('Test 1: Large Purchase', 'PASS', {
        message: `✓ qtyIn=1000, balance=1000, ${elapsed}ms`,
      });
      return true;
    } else {
      await recordTest('Test 1: Large Purchase', 'FAIL', {
        message: `✗ Expected qtyIn=1000/balance=1000, got ${latest.qtyIn}/${latest.balanceQty}`,
      });
      results.issues.push('T1: Ledger mismatch');
      return false;
    }
  } catch (err) {
    await recordTest('Test 1: Large Purchase', 'FAIL', { message: err.message });
    results.issues.push(`T1: ${err.message}`);
    return false;
  }
}

async function test2(data) {
  console.log('\n\n🔷 TEST 2: LARGE SALES FIFO (700 units)');
  console.log('═'.repeat(60));

  try {
    const start = Date.now();

    const sale = await Sales.create({
      tenantId: data.tenantId,
      company: data.companyId,
      salesNumber: 'SAL-STRESS-001',
      salesDate: new Date(),
      customer: data.accounts.ar._id,
      warehouse: data.warehouseId,
      currency: data.currencyId,
      items: [{
        item: data.item._id,
        quantity: 700,
        unitPrice: 15,
        totalPrice: 10500,
      }],
      totalAmount: 10500,
      netAmount: 10500,
      customerAccountId: data.accounts.ar._id,
      salesAccountId: data.accounts.sales._id,
      createdBy: data.userId,
    });

    console.log(`✅ Sale created: ${sale._id}`);

    await salesService.postSales(sale._id, data.tenantId, data.userId);
    console.log(`✅ Sale posted`);

    const posted = await Sales.findById(sale._id);
    const cogs = posted.items[0].cost || 0;
    const expectedCogs = 7000;

    const ledger = await StockLedger.find({
      tenantId: data.tenantId,
      itemId: data.item._id,
    }).sort({ createdAt: 1 });

    const latest = ledger[ledger.length - 1];
    const elapsed = Date.now() - start;
    results.metrics.test2 = elapsed;

    results.cogs.totalSales += 10500;
    results.cogs.totalCogs += cogs;

    if (cogs === expectedCogs && latest.qtyOut === 700 && latest.balanceQty === 300) {
      await recordTest('Test 2: Large Sales FIFO', 'PASS', {
        message: `✓ COGS=7000, qtyOut=700, balance=300, ${elapsed}ms`,
      });
      return true;
    } else {
      await recordTest('Test 2: Large Sales FIFO', 'FAIL', {
        message: `✗ COGS=${cogs}/qtyOut=${latest.qtyOut}/balance=${latest.balanceQty}`,
      });
      results.issues.push('T2: FIFO/Balance mismatch');
      return false;
    }
  } catch (err) {
    await recordTest('Test 2: Large Sales FIFO', 'FAIL', { message: err.message });
    results.issues.push(`T2: ${err.message}`);
    return false;
  }
}

async function test3(data) {
  console.log('\n\n🔷 TEST 3: SECOND SALES (200 units)');
  console.log('═'.repeat(60));

  try {
    const start = Date.now();

    const sale = await Sales.create({
      tenantId: data.tenantId,
      company: data.companyId,
      salesNumber: 'SAL-STRESS-002',
      salesDate: new Date(),
      customer: data.accounts.ar._id,
      warehouse: data.warehouseId,
      currency: data.currencyId,
      items: [{
        item: data.item._id,
        quantity: 200,
        unitPrice: 15,
        totalPrice: 3000,
      }],
      totalAmount: 3000,
      netAmount: 3000,
      customerAccountId: data.accounts.ar._id,
      salesAccountId: data.accounts.sales._id,
      createdBy: data.userId,
    });

    await salesService.postSales(sale._id, data.tenantId, data.userId);
    const posted = await Sales.findById(sale._id);
    const cogs = posted.items[0].cost || 0;
    const expectedCogs = 2000;

    const ledger = await StockLedger.find({
      tenantId: data.tenantId,
      itemId: data.item._id,
    }).sort({ createdAt: 1 });

    const latest = ledger[ledger.length - 1];
    const elapsed = Date.now() - start;
    results.metrics.test3 = elapsed;

    results.cogs.totalSales += 3000;
    results.cogs.totalCogs += cogs;

    if (cogs === expectedCogs && latest.balanceQty === 100) {
      await recordTest('Test 3: Second Sales', 'PASS', {
        message: `✓ COGS=2000, balance=100, ${elapsed}ms`,
      });
      return true;
    } else {
      await recordTest('Test 3: Second Sales', 'FAIL', {
        message: `✗ COGS=${cogs}, balance=${latest.balanceQty}`,
      });
      results.issues.push('T3: COGS/Balance mismatch');
      return false;
    }
  } catch (err) {
    await recordTest('Test 3: Second Sales', 'FAIL', { message: err.message });
    results.issues.push(`T3: ${err.message}`);
    return false;
  }
}

async function test4(data) {
  console.log('\n\n🔷 TEST 4: FINAL SALES (50 units)');
  console.log('═'.repeat(60));

  try {
    const start = Date.now();

    const sale = await Sales.create({
      tenantId: data.tenantId,
      company: data.companyId,
      salesNumber: 'SAL-STRESS-003',
      salesDate: new Date(),
      customer: data.accounts.ar._id,
      warehouse: data.warehouseId,
      currency: data.currencyId,
      items: [{
        item: data.item._id,
        quantity: 50,
        unitPrice: 15,
        totalPrice: 750,
      }],
      totalAmount: 750,
      netAmount: 750,
      customerAccountId: data.accounts.ar._id,
      salesAccountId: data.accounts.sales._id,
      createdBy: data.userId,
    });

    await salesService.postSales(sale._id, data.tenantId, data.userId);
    const posted = await Sales.findById(sale._id);
    const cogs = posted.items[0].cost || 0;
    const expectedCogs = 500;

    const ledger = await StockLedger.find({
      tenantId: data.tenantId,
      itemId: data.item._id,
    }).sort({ createdAt: 1 });

    const latest = ledger[ledger.length - 1];
    const elapsed = Date.now() - start;
    results.metrics.test4 = elapsed;

    results.cogs.totalSales += 750;
    results.cogs.totalCogs += cogs;
    results.cogs.inventory = latest.balanceQty * 10;

    if (cogs === expectedCogs && latest.balanceQty === 50) {
      await recordTest('Test 4: Final Sales', 'PASS', {
        message: `✓ COGS=500, balance=50, ${elapsed}ms`,
      });
      return true;
    } else {
      await recordTest('Test 4: Final Sales', 'FAIL', {
        message: `✗ COGS=${cogs}, balance=${latest.balanceQty}`,
      });
      results.issues.push('T4: COGS/Balance mismatch');
      return false;
    }
  } catch (err) {
    await recordTest('Test 4: Final Sales', 'FAIL', { message: err.message });
    results.issues.push(`T4: ${err.message}`);
    return false;
  }
}

async function test5(data) {
  console.log('\n\n🔷 TEST 5: NEGATIVE STOCK TEST (should fail with 100+ units)');
  console.log('═'.repeat(60));

  try {
    const start = Date.now();

    const sale = await Sales.create({
      tenantId: data.tenantId,
      company: data.companyId,
      salesNumber: 'SAL-STRESS-NEG',
      salesDate: new Date(),
      customer: data.accounts.ar._id,
      warehouse: data.warehouseId,
      currency: data.currencyId,
      items: [{
        item: data.item._id,
        quantity: 100,
        unitPrice: 15,
        totalPrice: 1500,
      }],
      totalAmount: 1500,
      netAmount: 1500,
      customerAccountId: data.accounts.ar._id,
      salesAccountId: data.accounts.sales._id,
      createdBy: data.userId,
    });

    try {
      await salesService.postSales(sale._id, data.tenantId, data.userId);
      await recordTest('Test 5: Negative Stock', 'FAIL', {
        message: '✗ Expected error but post succeeded',
      });
      results.issues.push('T5: Negative stock not prevented');
      return false;
    } catch (err) {
      if (err.message.toLowerCase().includes('insufficient')) {
        const elapsed = Date.now() - start;
        results.metrics.test5 = elapsed;
        await recordTest('Test 5: Negative Stock', 'PASS', {
          message: `✓ Correctly rejected: "${err.message.substring(0, 40)}...", ${elapsed}ms`,
        });
        return true;
      } else {
        await recordTest('Test 5: Negative Stock', 'FAIL', {
          message: `✗ Wrong error: ${err.message}`,
        });
        results.issues.push('T5: Wrong error type');
        return false;
      }
    }
  } catch (err) {
    await recordTest('Test 5: Negative Stock', 'FAIL', { message: err.message });
    results.issues.push(`T5: ${err.message}`);
    return false;
  }
}

async function test6(data) {
  console.log('\n\n🔷 TEST 6: MULTI-BATCH FIFO (purchase 500 @ 20, sell 100)');
  console.log('═'.repeat(60));

  try {
    const start = Date.now();

    // Get current balance
    const ledgBefore = await StockLedger.find({
      tenantId: data.tenantId,
      itemId: data.item._id,
    }).sort({ createdAt: 1 });

    const balBefore = ledgBefore[ledgBefore.length - 1].balanceQty;
    console.log(`   Current balance: ${balBefore} units`);

    // Purchase 500 @ 20
    const pur2 = await Purchase.create({
      tenantId: data.tenantId,
      company: data.companyId,
      purchaseNumber: 'PUR-STRESS-002',
      purchaseDate: new Date(),
      supplier: data.accounts.ap._id,
      warehouse: data.warehouseId,
      currency: data.currencyId,
      items: [{
        item: data.item._id,
        quantity: 500,
        unitCost: 20,
        totalCost: 10000,
      }],
      totalAmount: 10000,
      netAmount: 10000,
      supplierAccountId: data.accounts.ap._id,
      expenseAccountId: data.accounts.cogs._id,
      createdBy: data.userId,
    });

    await purchaseService.post(pur2._id, { tenantId: data.tenantId, _id: data.userId });
    console.log(`✅ Second purchase posted: 500 @ 20`);

    // Sell 100 (FIFO: 50@10 + 50@20 = 1500)
    const sale = await Sales.create({
      tenantId: data.tenantId,
      company: data.companyId,
      salesNumber: 'SAL-STRESS-004',
      salesDate: new Date(),
      customer: data.accounts.ar._id,
      warehouse: data.warehouseId,
      currency: data.currencyId,
      items: [{
        item: data.item._id,
        quantity: 100,
        unitPrice: 25,
        totalPrice: 2500,
      }],
      totalAmount: 2500,
      netAmount: 2500,
      customerAccountId: data.accounts.ar._id,
      salesAccountId: data.accounts.sales._id,
      createdBy: data.userId,
    });

    await salesService.postSales(sale._id, data.tenantId, data.userId);
    const posted = await Sales.findById(sale._id);
    const cogs = posted.items[0].cost || 0;
    const expectedCogs = 1500; // 50@10 + 50@20

    const ledger = await StockLedger.find({
      tenantId: data.tenantId,
      itemId: data.item._id,
    }).sort({ createdAt: 1 });

    const latest = ledger[ledger.length - 1];
    const expectedBal = balBefore + 500 - 100; // 50 + 500 - 100 = 450

    const elapsed = Date.now() - start;
    results.metrics.test6 = elapsed;

    results.cogs.totalSales += 2500;
    results.cogs.totalCogs += cogs;

    if (cogs === expectedCogs && latest.balanceQty === expectedBal) {
      await recordTest('Test 6: Multi-Batch FIFO', 'PASS', {
        message: `✓ COGS=1500 (50@10+50@20), balance=${expectedBal}, ${elapsed}ms`,
      });
      return true;
    } else {
      await recordTest('Test 6: Multi-Batch FIFO', 'FAIL', {
        message: `✗ COGS=${cogs} (exp 1500), balance=${latest.balanceQty} (exp ${expectedBal})`,
      });
      results.issues.push('T6: Multi-batch FIFO mismatch');
      return false;
    }
  } catch (err) {
    await recordTest('Test 6: Multi-Batch FIFO', 'FAIL', { message: err.message });
    results.issues.push(`T6: ${err.message}`);
    return false;
  }
}

// ============================================================================
// 📊 REPORT
// ============================================================================

async function report() {
  console.log('\n\n' + '═'.repeat(80));
  console.log('📊 QA STRESS TEST - FINAL REPORT');
  console.log('═'.repeat(80));

  // Test Summary
  console.log('\n✅ TEST RESULTS\n');
  results.tests.forEach((t) => {
    const icon = t.status === 'PASS' ? '✅' : '❌';
    console.log(`${icon} ${t.name}: ${t.status}`);
  });

  const pass = results.tests.filter((t) => t.status === 'PASS').length;
  const fail = results.tests.filter((t) => t.status === 'FAIL').length;
  console.log(`\n📈 Summary: ${pass}/6 PASSED, ${fail}/6 FAILED\n`);

  // Ledger
  console.log('📊 STOCK LEDGER\n');
  const ledg = await StockLedger.find().sort({ createdAt: 1 });
  console.table(
    ledg.map((e) => ({
      'Type': e.type.toUpperCase(),
      'Qty In': e.qtyIn,
      'Qty Out': e.qtyOut,
      'Balance': e.balanceQty,
      'Unit Cost': e.unitCost,
      'Date': e.createdAt.toISOString().split('T')[0],
    }))
  );

  // COGS
  console.log('\n💰 FINANCIAL SUMMARY\n');
  const gp = results.cogs.totalSales - results.cogs.totalCogs;
  const margin = results.cogs.totalSales > 0 ? ((gp / results.cogs.totalSales) * 100).toFixed(2) : 0;
  console.log(`Total Sales Revenue:    PKR ${results.cogs.totalSales.toLocaleString()}`);
  console.log(`Total COGS:             PKR ${results.cogs.totalCogs.toLocaleString()}`);
  console.log(`Gross Profit:           PKR ${gp.toLocaleString()}`);
  console.log(`Gross Profit Margin:    ${margin}%`);
  console.log(`Remaining Inventory:    PKR ${results.cogs.inventory.toLocaleString()}`);

  // Performance
  console.log('\n⚡ PERFORMANCE\n');
  console.table(Object.entries(results.metrics).reduce((acc, [k, v]) => {
    acc[k] = `${v}ms`;
    return acc;
  }, {}));

  // Issues
  if (results.issues.length > 0) {
    console.log('\n⚠️ ISSUES\n');
    results.issues.forEach((issue, i) => {
      console.log(`${i + 1}. ${issue}`);
    });
  } else {
    console.log('\n⚠️ ISSUES: NONE ✅\n');
  }

  // Verdict
  console.log('\n🎯 FINAL VERDICT\n');
  const allPass = fail === 0;
  const stable = allPass && results.issues.length === 0;
  console.log(`System Stable:          ${stable ? '✅ YES' : '❌ NO'}`);
  console.log(`FIFO Accurate:          ${allPass ? '✅ YES' : '❌ NO'}`);
  console.log(`Ready for Production:   ${stable ? '✅ YES' : '❌ NO'}`);

  if (stable) {
    console.log('\n🚀 ALL TESTS PASSED - SYSTEM PRODUCTION READY\n');
  } else {
    console.log('\n📌 ATTENTION REQUIRED - REVIEW ISSUES ABOVE\n');
  }

  console.log('═'.repeat(80));
}

// ============================================================================
// 🚀 MAIN
// ============================================================================

async function main() {
  console.log('\n' + '═'.repeat(80));
  console.log('🧪 QA STRESS TEST - LARGE-SCALE TRANSACTIONAL VALIDATION');
  console.log('═'.repeat(80));

  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/erpbuddy');
    console.log('\n✅ Connected to MongoDB');

    const data = await setupData();

    // Clean
    await Purchase.deleteMany({ tenantId: data.tenantId, purchaseNumber: /PUR-STRESS/ });
    await Sales.deleteMany({ tenantId: data.tenantId, salesNumber: /SAL-STRESS/ });
    await StockLedger.deleteMany({ tenantId: data.tenantId });
    console.log('✅ Previous test data cleared');

    // Execute
    await test1(data);
    await test2(data);
    await test3(data);
    await test4(data);
    await test5(data);
    await test6(data);

    // Report
    await report();

    await mongoose.connection.close();
    console.log('✅ Connection closed\n');
  } catch (err) {
    console.error('\n❌ ERROR:', err.message);
    process.exit(1);
  }
}

main();
