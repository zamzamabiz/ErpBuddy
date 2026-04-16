/**
 * 🧪 QA STRESS TEST - Large-Scale Transactional Validation (V2)
 * 
 * Test Plan:
 * 1. Large Purchase (1000 units @ 10)
 * 2. Large Sales (700 units) - FIFO
 * 3. Second Sales (200 units)
 * 4. Final Sales (50 units)
 * 5. Negative Test (100 units - insufficient stock)
 * 6. Multi-Batch FIFO (purchase 500 @ 20, sell 100 mixed)
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
const Journal = require('./src/modules/finance/journal/journal.model');
const StockLedger = require('./src/modules/inventory/stockLedger/stockLedger.model');

// Services
const purchaseService = require('./src/modules/business/purchase/purchase.service');
const salesService = require('./src/modules/business/sales/sales.service');

// ============================================================================
// 📊 TEST RESULTS
// ============================================================================

const testResults = {
  tests: [],
  issues: [],
  performanceMetrics: {},
  cogsSummary: {
    totalSalesValue: 0,
    totalCOGS: 0,
    remainingInventory: 0,
  },
};

// ============================================================================
// 🔧 HELPERS
// ============================================================================

async function recordTest(name, status, details = {}) {
  testResults.tests.push({
    name,
    status,
    timestamp: new Date(),
    ...details,
  });
  console.log(`\n${status === 'PASS' ? '✅' : '❌'} ${name}: ${status}`);
  if (details.message) console.log(`   📝 ${details.message}`);
}

async function setupTestData() {
  console.log('\n📋 Setting up test data...');

  const tenantId = new mongoose.Types.ObjectId('000000000000000000000001');
  const companyId = new mongoose.Types.ObjectId('100000000000000000000001');
  const warehouseId = new mongoose.Types.ObjectId('200000000000000000000001');
  const userId = new mongoose.Types.ObjectId('300000000000000000000001');

  // Create test item
  const item = await Item.findOneAndUpdate(
    { tenantId, itemCode: 'TEST-QA-001' },
    {
      tenantId,
      companyId,
      itemCode: 'TEST-QA-001',
      name: 'QA Stress Test Item',
      description: 'Item for large-scale stress testing',
      itemType: 'inventory',
      purchasePrice: 10,
      sellingPrice: 15,
      status: 'active',
      createdBy: userId,
      updatedBy: userId,
    },
    { upsert: true, new: true }
  );

  // Create warehouse
  const warehouse = await Warehouse.findOneAndUpdate(
    { companyId, warehouseCode: 'QA-WH-001' },
    {
      companyId,
      warehouseCode: 'QA-WH-001',
      name: 'QA Test Warehouse',
      location: 'Test Location',
      status: 'active',
      createdBy: userId,
      updatedBy: userId,
    },
    { upsert: true, new: true }
  );

  // Create Accounts
  const accounts = {};
  for (const [key, data] of Object.entries({
    sales: { code: 'SALES-001', name: 'Sales Revenue', type: 'income' },
    cogs: { code: 'COGS-001', name: 'Cost of Goods Sold', type: 'expense' },
    inventory: { code: 'INV-001', name: 'Inventory Asset', type: 'asset' },
    ar: { code: 'AR-001', name: 'Accounts Receivable', type: 'asset' },
    ap: { code: 'AP-001', name: 'Accounts Payable', type: 'liability' },
  })) {
    accounts[key] = await Account.findOneAndUpdate(
      { tenantId, code: data.code },
      {
        tenantId,
        code: data.code,
        name: data.name,
        type: data.type,
        isActive: true,
        createdBy: userId,
        updatedBy: userId,
      },
      { upsert: true, new: true }
    );
  }

  console.log(`✅ Item: ${item.itemCode}`);
  console.log(`✅ Warehouse: ${warehouse.warehouseCode}`);
  console.log(`✅ Accounts created (Sales, COGS, Inventory, AR, AP)`);

  return {
    tenantId,
    companyId,
    warehouseId: warehouse._id,
    item,
    warehouse,
    accounts,
    userId,
  };
}

// ============================================================================
// 🧪 TEST SCENARIOS
// ============================================================================

async function test1_LargePurchase(data) {
  console.log('\n\n🔷 TEST 1: LARGE PURCHASE (1000 units @ 10)');
  console.log('═'.repeat(60));

  try {
    const startTime = Date.now();

    const purchaseData = {
      tenantId: data.tenantId,
      company: data.companyId,
      purchaseNumber: 'PUR-QA-001',
      purchaseDate: new Date(),
      supplier: data.accounts.ap._id,
      warehouse: data.warehouseId,
      items: [
        {
          item: data.item._id,
          quantity: 1000,
          unitCost: 10,
          totalCost: 10000,
        },
      ],
      totalAmount: 10000,
      netAmount: 10000,
      expenseAccountId: data.accounts.cogs._id,
      supplierAccountId: data.accounts.ap._id,
      status: 'Draft',
    };

    const purchase = await Purchase.create(purchaseData);
    console.log(`✅ Purchase created: ${purchase._id}`);

    // Post purchase
    await purchaseService.post(purchase._id, { tenantId: data.tenantId, _id: data.userId });
    const postedPurchase = await Purchase.findById(purchase._id);
    console.log(`✅ Purchase posted: Status=${postedPurchase.status}`);

    // Check stock ledger
    const ledger = await StockLedger.find({
      tenantId: data.tenantId,
      itemId: data.item._id,
      warehouseId: data.warehouseId,
    }).sort({ createdAt: 1 });

    const latestEntry = ledger[ledger.length - 1];
    const elapsed = Date.now() - startTime;
    testResults.performanceMetrics.test1 = `${elapsed}ms`;

    if (latestEntry.qtyIn === 1000 && latestEntry.balanceQty === 1000) {
      await recordTest('Test 1: Large Purchase', 'PASS', {
        message: `qtyIn=1000, balanceQty=1000, Time=${elapsed}ms`,
      });
      return true;
    } else {
      await recordTest('Test 1: Large Purchase', 'FAIL', {
        message: `qtyIn=${latestEntry.qtyIn}, balanceQty=${latestEntry.balanceQty}`,
      });
      testResults.issues.push(`Test 1: Expected qtyIn=1000, balanceQty=1000`);
      return false;
    }
  } catch (err) {
    await recordTest('Test 1: Large Purchase', 'FAIL', { message: err.message });
    testResults.issues.push(`Test 1: ${err.message}`);
    return false;
  }
}

async function test2_LargeSalesFIFO(data) {
  console.log('\n\n🔷 TEST 2: LARGE SALES FIFO (700 units)');
  console.log('═'.repeat(60));

  try {
    const startTime = Date.now();

    const salesData = {
      tenantId: data.tenantId,
      company: data.companyId,
      saleNumber: 'SAL-QA-001',
      saleDate: new Date(),
      customer: data.accounts.ar._id,
      warehouse: data.warehouseId,
      items: [
        {
          item: data.item._id,
          quantity: 700,
          unitPrice: 15,
          total: 10500,
        },
      ],
      totalAmount: 10500,
      netAmount: 10500,
      salesAccountId: data.accounts.sales._id,
      cogsAccountId: data.accounts.cogs._id,
      inventoryAccountId: data.accounts.inventory._id,
      receivableAccountId: data.accounts.ar._id,
      status: 'Draft',
    };

    const sales = await Sales.create(salesData);
    console.log(`✅ Sales created: ${sales._id}`);

    // Post sales
    await salesService.post(sales._id, { tenantId: data.tenantId, _id: data.userId });
    const postedSales = await Sales.findById(sales._id);
    console.log(`✅ Sales posted: Status=${postedSales.status}`);

    // Check COGS
    const saleItem = postedSales.items[0];
    const actualCOGS = saleItem.cost || 0;
    const expectedCOGS = 700 * 10;

    // Check ledger
    const ledger = await StockLedger.find({
      tenantId: data.tenantId,
      itemId: data.item._id,
    }).sort({ createdAt: 1 });

    const latestEntry = ledger[ledger.length - 1];
    const elapsed = Date.now() - startTime;
    testResults.performanceMetrics.test2 = `${elapsed}ms`;

    testResults.cogsSummary.totalSalesValue += 10500;
    testResults.cogsSummary.totalCOGS += actualCOGS;

    if (actualCOGS === expectedCOGS && latestEntry.qtyOut === 700 && latestEntry.balanceQty === 300) {
      await recordTest('Test 2: Large Sales FIFO', 'PASS', {
        message: `COGS=7000, qtyOut=700, balanceQty=300, Time=${elapsed}ms`,
      });
      return true;
    } else {
      await recordTest('Test 2: Large Sales FIFO', 'FAIL', {
        message: `COGS=${actualCOGS} (exp 7000), qtyOut=${latestEntry.qtyOut}, balanceQty=${latestEntry.balanceQty}`,
      });
      testResults.issues.push(`Test 2: FIFO mismatch`);
      return false;
    }
  } catch (err) {
    await recordTest('Test 2: Large Sales FIFO', 'FAIL', { message: err.message });
    testResults.issues.push(`Test 2: ${err.message}`);
    return false;
  }
}

async function test3_SecondSales(data) {
  console.log('\n\n🔷 TEST 3: SECOND SALES (200 units)');
  console.log('═'.repeat(60));

  try {
    const startTime = Date.now();

    const salesData = {
      tenantId: data.tenantId,
      company: data.companyId,
      saleNumber: 'SAL-QA-002',
      saleDate: new Date(),
      customer: data.accounts.ar._id,
      warehouse: data.warehouseId,
      items: [
        {
          item: data.item._id,
          quantity: 200,
          unitPrice: 15,
          total: 3000,
        },
      ],
      totalAmount: 3000,
      netAmount: 3000,
      salesAccountId: data.accounts.sales._id,
      cogsAccountId: data.accounts.cogs._id,
      inventoryAccountId: data.accounts.inventory._id,
      receivableAccountId: data.accounts.ar._id,
      status: 'Draft',
    };

    const sales = await Sales.create(salesData);
    await salesService.post(sales._id, { tenantId: data.tenantId, _id: data.userId });
    const postedSales = await Sales.findById(sales._id);

    const saleItem = postedSales.items[0];
    const actualCOGS = saleItem.cost || 0;
    const expectedCOGS = 200 * 10;

    const ledger = await StockLedger.find({
      tenantId: data.tenantId,
      itemId: data.item._id,
    }).sort({ createdAt: 1 });

    const latestEntry = ledger[ledger.length - 1];
    const elapsed = Date.now() - startTime;
    testResults.performanceMetrics.test3 = `${elapsed}ms`;

    testResults.cogsSummary.totalSalesValue += 3000;
    testResults.cogsSummary.totalCOGS += actualCOGS;

    if (actualCOGS === expectedCOGS && latestEntry.balanceQty === 100) {
      await recordTest('Test 3: Second Sales', 'PASS', {
        message: `COGS=2000, balanceQty=100, Time=${elapsed}ms`,
      });
      return true;
    } else {
      await recordTest('Test 3: Second Sales', 'FAIL', {
        message: `COGS=${actualCOGS}, balanceQty=${latestEntry.balanceQty}`,
      });
      testResults.issues.push(`Test 3: COGS/Balance mismatch`);
      return false;
    }
  } catch (err) {
    await recordTest('Test 3: Second Sales', 'FAIL', { message: err.message });
    testResults.issues.push(`Test 3: ${err.message}`);
    return false;
  }
}

async function test4_FinalSales(data) {
  console.log('\n\n🔷 TEST 4: FINAL SALES (50 units)');
  console.log('═'.repeat(60));

  try {
    const startTime = Date.now();

    const salesData = {
      tenantId: data.tenantId,
      company: data.companyId,
      saleNumber: 'SAL-QA-003',
      saleDate: new Date(),
      customer: data.accounts.ar._id,
      warehouse: data.warehouseId,
      items: [
        {
          item: data.item._id,
          quantity: 50,
          unitPrice: 15,
          total: 750,
        },
      ],
      totalAmount: 750,
      netAmount: 750,
      salesAccountId: data.accounts.sales._id,
      cogsAccountId: data.accounts.cogs._id,
      inventoryAccountId: data.accounts.inventory._id,
      receivableAccountId: data.accounts.ar._id,
      status: 'Draft',
    };

    const sales = await Sales.create(salesData);
    await salesService.post(sales._id, { tenantId: data.tenantId, _id: data.userId });
    const postedSales = await Sales.findById(sales._id);

    const saleItem = postedSales.items[0];
    const actualCOGS = saleItem.cost || 0;
    const expectedCOGS = 50 * 10;

    const ledger = await StockLedger.find({
      tenantId: data.tenantId,
      itemId: data.item._id,
    }).sort({ createdAt: 1 });

    const latestEntry = ledger[ledger.length - 1];
    const elapsed = Date.now() - startTime;
    testResults.performanceMetrics.test4 = `${elapsed}ms`;

    testResults.cogsSummary.totalSalesValue += 750;
    testResults.cogsSummary.totalCOGS += actualCOGS;
    testResults.cogsSummary.remainingInventory = latestEntry.balanceQty * latestEntry.unitCost;

    if (actualCOGS === expectedCOGS && latestEntry.balanceQty === 50) {
      await recordTest('Test 4: Final Sales', 'PASS', {
        message: `COGS=500, balanceQty=50, Time=${elapsed}ms`,
      });
      return true;
    } else {
      await recordTest('Test 4: Final Sales', 'FAIL', {
        message: `COGS=${actualCOGS}, balanceQty=${latestEntry.balanceQty}`,
      });
      testResults.issues.push(`Test 4: COGS/Balance mismatch`);
      return false;
    }
  } catch (err) {
    await recordTest('Test 4: Final Sales', 'FAIL', { message: err.message });
    testResults.issues.push(`Test 4: ${err.message}`);
    return false;
  }
}

async function test5_NegativeStockTest(data) {
  console.log('\n\n🔷 TEST 5: NEGATIVE STOCK TEST (100 units - should fail)');
  console.log('═'.repeat(60));

  try {
    const startTime = Date.now();

    const salesData = {
      tenantId: data.tenantId,
      company: data.companyId,
      saleNumber: 'SAL-QA-NEG-001',
      saleDate: new Date(),
      customer: data.accounts.ar._id,
      warehouse: data.warehouseId,
      items: [
        {
          item: data.item._id,
          quantity: 100,
          unitPrice: 15,
          total: 1500,
        },
      ],
      totalAmount: 1500,
      netAmount: 1500,
      salesAccountId: data.accounts.sales._id,
      cogsAccountId: data.accounts.cogs._id,
      inventoryAccountId: data.accounts.inventory._id,
      receivableAccountId: data.accounts.ar._id,
      status: 'Draft',
    };

    const sales = await Sales.create(salesData);

    try {
      await salesService.post(sales._id, { tenantId: data.tenantId, _id: data.userId });
      await recordTest('Test 5: Negative Stock', 'FAIL', {
        message: 'Expected error but posting succeeded',
      });
      testResults.issues.push(`Test 5: Negative stock not prevented`);
      return false;
    } catch (err) {
      if (err.message.toLowerCase().includes('insufficient')) {
        const elapsed = Date.now() - startTime;
        testResults.performanceMetrics.test5 = `${elapsed}ms`;

        await recordTest('Test 5: Negative Stock', 'PASS', {
          message: `Error correctly thrown: "${err.message}",Time=${elapsed}ms`,
        });
        return true;
      } else {
        await recordTest('Test 5: Negative Stock', 'FAIL', {
          message: `Wrong error: ${err.message}`,
        });
        testResults.issues.push(`Test 5: Wrong error type`);
        return false;
      }
    }
  } catch (err) {
    await recordTest('Test 5: Negative Stock', 'FAIL', { message: err.message });
    testResults.issues.push(`Test 5: ${err.message}`);
    return false;
  }
}

async function test6_MultiBatchFIFO(data) {
  console.log('\n\n🔷 TEST 6: MULTI-BATCH FIFO (purchase 500 @ 20, sell 100 mixed)');
  console.log('═'.repeat(60));

  try {
    const startTime = Date.now();

    // Get current balance
    const ledgerBefore = await StockLedger.find({
      tenantId: data.tenantId,
      itemId: data.item._id,
    }).sort({ createdAt: 1 });

    const balanceBefore = ledgerBefore[ledgerBefore.length - 1].balanceQty;
    console.log(`   Current balance: ${balanceBefore}`);

    // Create second purchase at higher cost
    const purchaseData = {
      tenantId: data.tenantId,
      company: data.companyId,
      purchaseNumber: 'PUR-QA-002',
      purchaseDate: new Date(),
      supplier: data.accounts.ap._id,
      warehouse: data.warehouseId,
      items: [
        {
          item: data.item._id,
          quantity: 500,
          unitCost: 20,
          totalCost: 10000,
        },
      ],
      totalAmount: 10000,
      netAmount: 10000,
      expenseAccountId: data.accounts.cogs._id,
      supplierAccountId: data.accounts.ap._id,
      status: 'Draft',
    };

    const purchase = await Purchase.create(purchaseData);
    await purchaseService.post(purchase._id, { tenantId: data.tenantId, _id: data.userId });
    console.log(`✅ Second purchase posted: 500 units @ 20`);

    // Now sell 100 units (should use FIFO: 50 @ 10 + 50 @ 20 = 1500)
    const salesData = {
      tenantId: data.tenantId,
      company: data.companyId,
      saleNumber: 'SAL-QA-004',
      saleDate: new Date(),
      customer: data.accounts.ar._id,
      warehouse: data.warehouseId,
      items: [
        {
          item: data.item._id,
          quantity: 100,
          unitPrice: 25,
          total: 2500,
        },
      ],
      totalAmount: 2500,
      netAmount: 2500,
      salesAccountId: data.accounts.sales._id,
      cogsAccountId: data.accounts.cogs._id,
      inventoryAccountId: data.accounts.inventory._id,
      receivableAccountId: data.accounts.ar._id,
      status: 'Draft',
    };

    const sales = await Sales.create(salesData);
    await salesService.post(sales._id, { tenantId: data.tenantId, _id: data.userId });
    const postedSales = await Sales.findById(sales._id);

    const saleItem = postedSales.items[0];
    const actualCOGS = saleItem.cost || 0;
    const expectedCOGS = 1500; // 50 @ 10 + 50 @ 20

    const ledger = await StockLedger.find({
      tenantId: data.tenantId,
      itemId: data.item._id,
    }).sort({ createdAt: 1 });

    const latestEntry = ledger[ledger.length - 1];
    const expectedBalance = balanceBefore + 500 - 100; // 50 + 500 - 100 = 450

    const elapsed = Date.now() - startTime;
    testResults.performanceMetrics.test6 = `${elapsed}ms`;

    testResults.cogsSummary.totalSalesValue += 2500;
    testResults.cogsSummary.totalCOGS += actualCOGS;

    if (actualCOGS === expectedCOGS && latestEntry.balanceQty === expectedBalance) {
      await recordTest('Test 6: Multi-Batch FIFO', 'PASS', {
        message: `COGS=1500 (50@10+50@20), balance=${expectedBalance}, Time=${elapsed}ms`,
      });
      return true;
    } else {
      await recordTest('Test 6: Multi-Batch FIFO', 'FAIL', {
        message: `COGS=${actualCOGS} (exp 1500), balance=${latestEntry.balanceQty} (exp ${expectedBalance})`,
      });
      testResults.issues.push(`Test 6: Multi-batch FIFO mismatch`);
      return false;
    }
  } catch (err) {
    await recordTest('Test 6: Multi-Batch FIFO', 'FAIL', { message: err.message });
    testResults.issues.push(`Test 6: ${err.message}`);
    return false;
  }
}

// ============================================================================
// 📊 FINAL REPORT
// ============================================================================

async function generateFinalReport() {
  console.log('\n\n' + '═'.repeat(80));
  console.log('📊 QA STRESS TEST REPORT');
  console.log('═'.repeat(80));

  // Test Summary
  console.log('\n✅ TEST RESULTS SUMMARY\n');
  testResults.tests.forEach((test) => {
    const status = test.status === 'PASS' ? '✅' : '❌';
    console.log(`${status} ${test.name}: ${test.status}`);
  });

  const passCount = testResults.tests.filter((t) => t.status === 'PASS').length;
  const failCount = testResults.tests.filter((t) => t.status === 'FAIL').length;
  console.log(`\n📈 Results: ${passCount} PASSED, ${failCount} FAILED`);

  // Stock Ledger Snapshot
  console.log('\n\n📊 STOCK LEDGER SNAPSHOT\n');
  const ledger = await StockLedger.find().sort({ createdAt: 1 });
  const tableData = ledger.map((entry) => ({
    'Qty In': entry.qtyIn,
    'Qty Out': entry.qtyOut,
    'Balance': entry.balanceQty,
    'Unit Cost': entry.unitCost,
    'Type': entry.type,
    'Ref': entry.type === 'purchase' ? 'PUR' : 'SAL',
  }));

  console.table(tableData);

  // COGS Summary
  console.log('\n\n💰 COGS SUMMARY\n');
  console.log(`Total Sales Value:     PKR ${testResults.cogsSummary.totalSalesValue.toLocaleString()}`);
  console.log(`Total COGS:            PKR ${testResults.cogsSummary.totalCOGS.toLocaleString()}`);
  console.log(`Gross Profit:          PKR ${(testResults.cogsSummary.totalSalesValue - testResults.cogsSummary.totalCOGS).toLocaleString()}`);

  const gp = testResults.cogsSummary.totalSalesValue - testResults.cogsSummary.totalCOGS;
  const margin = testResults.cogsSummary.totalSalesValue > 0 ? ((gp / testResults.cogsSummary.totalSalesValue) * 100).toFixed(2) : 0;
  console.log(`Gross Profit Margin:   ${margin}%`);
  console.log(`Remaining Inventory:   PKR ${testResults.cogsSummary.remainingInventory.toLocaleString()}`);

  // Performance
  console.log('\n\n⚡ PERFORMANCE METRICS\n');
  console.table(testResults.performanceMetrics);

  // Issues
  if (testResults.issues.length > 0) {
    console.log('\n\n⚠️ ISSUES FOUND\n');
    testResults.issues.forEach((issue, i) => {
      console.log(`${i + 1}. ${issue}`);
    });
  } else {
    console.log('\n\n⚠️ ISSUES FOUND: NONE ✅');
  }

  // Verdict
  console.log('\n\n🎯 FINAL VERDICT\n');
  const allPassed = failCount === 0;
  const systemStable = allPassed && testResults.issues.length === 0;

  console.log(`System Stable:         ${systemStable ? '✅ YES' : '❌ NO'}`);
  console.log(`FIFO Accurate:         ${allPassed ? '✅ YES' : '❌ NO'}`);
  console.log(`Ready for Production:  ${systemStable ? '✅ YES' : '❌ NO'}`);

  if (systemStable) {
    console.log('\n🚀 SYSTEM PASSED ALL STRESS TESTS - PRODUCTION READY');
  } else {
    console.log('\n📌 SYSTEM NEEDS ATTENTION - REVIEW ISSUES ABOVE');
  }

  console.log('\n' + '═'.repeat(80));
}

// ============================================================================
// 🚀 MAIN
// ============================================================================

async function runAllTests() {
  console.log('\n' + '═'.repeat(80));
  console.log('🧪 QA STRESS TEST - LARGE-SCALE TRANSACTIONAL VALIDATION (V2)');
  console.log('═'.repeat(80));

  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/erpbuddy');
    console.log('\n✅ Connected to MongoDB');

    const data = await setupTestData();

    // Clear previous test data
    await Purchase.deleteMany({ tenantId: data.tenantId, purchaseNumber: /PUR-QA/ });
    await Sales.deleteMany({ tenantId: data.tenantId, saleNumber: /SAL-QA/ });
    await StockLedger.deleteMany({ tenantId: data.tenantId });
    console.log('✅ Previous test data cleared');

    // Run tests
    await test1_LargePurchase(data);
    await test2_LargeSalesFIFO(data);
    await test3_SecondSales(data);
    await test4_FinalSales(data);
    await test5_NegativeStockTest(data);
    await test6_MultiBatchFIFO(data);

    // Report
    await generateFinalReport();

    await mongoose.connection.close();
    console.log('\n✅ Test session closed');
  } catch (err) {
    console.error('\n❌ Test failed:', err.message);
    process.exit(1);
  }
}

// Run tests
runAllTests();
