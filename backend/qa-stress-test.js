/**
 * 🧪 QA STRESS TEST - Large-Scale Transactional Validation
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
const path = require('path');

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
// 📊 TEST RESULTS CONTAINER
// ============================================================================

const testResults = {
  tests: [],
  ledgerSnapshot: [],
  cogsSummary: {
    totalSalesValue: 0,
    totalCOGS: 0,
    remainingInventoryValue: 0,
  },
  issues: [],
  performanceMetrics: {},
};

// ============================================================================
// 🔧 HELPER FUNCTIONS
// ============================================================================

async function setupTestData(tenantId) {
  console.log('\n📋 Setting up test data...');

  try {
    // Create item
    const item = await Item.findOneAndUpdate(
      { tenantId, code: 'TEST-ITEM-001' },
      {
        tenantId,
        name: 'Test Item for QA Stress Test',
        code: 'TEST-ITEM-001',
        description: 'QA Stress Test Item',
      },
      { upsert: true, new: true }
    );
    console.log(`✅ Item: ${item._id} (${item.code})`);

    // Create warehouse
    const warehouse = await Warehouse.findOneAndUpdate(
      { tenantId, code: 'WH-001' },
      {
        tenantId,
        name: 'Test Warehouse',
        code: 'WH-001',
        location: 'Test Location',
      },
      { upsert: true, new: true }
    );
    console.log(`✅ Warehouse: ${warehouse._id} (${warehouse.code})`);

    // Create accounts (Sales, COGS, Inventory, AR, AP)
    const salesAccount = await Account.findOneAndUpdate(
      { tenantId, code: 'SALES-001' },
      {
        tenantId,
        name: 'Sales Revenue',
        code: 'SALES-001',
        type: 'revenue',
        subType: 'sales',
        nature: 'credit',
      },
      { upsert: true, new: true }
    );

    const cogsAccount = await Account.findOneAndUpdate(
      { tenantId, code: 'COGS-001' },
      {
        tenantId,
        name: 'Cost of Goods Sold',
        code: 'COGS-001',
        type: 'expense',
        subType: 'cost_of_sales',
        nature: 'debit',
      },
      { upsert: true, new: true }
    );

    const inventoryAccount = await Account.findOneAndUpdate(
      { tenantId, code: 'INV-001' },
      {
        tenantId,
        name: 'Inventory Asset',
        code: 'INV-001',
        type: 'asset',
        subType: 'inventory',
        nature: 'debit',
      },
      { upsert: true, new: true }
    );

    const arAccount = await Account.findOneAndUpdate(
      { tenantId, code: 'AR-001' },
      {
        tenantId,
        name: 'Accounts Receivable',
        code: 'AR-001',
        type: 'asset',
        subType: 'receivable',
        nature: 'debit',
      },
      { upsert: true, new: true }
    );

    const apAccount = await Account.findOneAndUpdate(
      { tenantId, code: 'AP-001' },
      {
        tenantId,
        name: 'Accounts Payable',
        code: 'AP-001',
        type: 'liability',
        subType: 'payable',
        nature: 'credit',
      },
      { upsert: true, new: true }
    );

    console.log(`✅ Accounts created (Sales, COGS, Inventory, AR, AP)`);

    return {
      item,
      warehouse,
      salesAccount,
      cogsAccount,
      inventoryAccount,
      arAccount,
      apAccount,
    };
  } catch (err) {
    console.error('❌ Setup failed:', err.message);
    throw err;
  }
}

async function recordTest(testName, status, details = {}) {
  testResults.tests.push({
    name: testName,
    status,
    timestamp: new Date(),
    ...details,
  });
  console.log(`\n${status === 'PASS' ? '✅' : '❌'} ${testName}: ${status}`);
  if (details.message) console.log(`   📝 ${details.message}`);
}

async function captureStockLedger(tenantId, itemId, warehouseId) {
  return await StockLedger.find({
    tenantId,
    itemId,
    warehouseId,
  }).sort({ createdAt: 1 });
}

async function calculateCOGSSummary(tenantId, itemId) {
  const sales = await Sales.find({ tenantId, 'items.item': itemId, status: 'Posted' });
  const ledger = await StockLedger.find({ tenantId, itemId });

  let totalSalesValue = 0;
  let totalCOGS = 0;

  sales.forEach((sale) => {
    sale.items.forEach((item) => {
      if (item.item?.toString() === itemId.toString()) {
        totalSalesValue += item.quantity * item.unitPrice || 0;
        totalCOGS += item.cost || 0;
      }
    });
  });

  // Get remaining stock
  const latestBalance = ledger[ledger.length - 1];
  const remainingInventoryValue = (latestBalance?.balanceQty || 0) * (latestBalance?.unitCost || 0);

  return {
    totalSalesValue,
    totalCOGS,
    remainingInventoryValue,
    ledgerEntries: ledger.length,
  };
}

// ============================================================================
// 🧪 TEST SCENARIOS
// ============================================================================

async function test1_LargePurchase(tenantId, data) {
  console.log('\n\n🔷 TEST 1: LARGE PURCHASE (1000 units @ 10)');
  console.log('═'.repeat(60));

  try {
    const startTime = Date.now();

    const purchase = await Purchase.create({
      tenantId,
      purchaseNumber: 'PUR-QA-001',
      supplier: data.apAccount._id,
      warehouse: data.warehouse._id,
      items: [
        {
          item: data.item._id,
          quantity: 1000,
          unitCost: 10,
          total: 10000,
        },
      ],
      totalAmount: 10000,
      status: 'Draft',
    });

    console.log(`✅ Purchase created: ${purchase._id}`);

    // Post purchase
    await purchaseService.postPurchase(tenantId, purchase._id);
    const postedPurchase = await Purchase.findById(purchase._id);
    console.log(`✅ Purchase posted: Status=${postedPurchase.status}`);

    // Check stock ledger
    const ledger = await captureStockLedger(tenantId, data.item._id, data.warehouse._id);
    const latestEntry = ledger[ledger.length - 1];

    const qtyInMatch = latestEntry.qtyIn === 1000;
    const balanceMatch = latestEntry.balanceQty === 1000;

    const elapsed = Date.now() - startTime;
    testResults.performanceMetrics.test1 = `${elapsed}ms`;

    if (qtyInMatch && balanceMatch) {
      await recordTest('Test 1: Large Purchase', 'PASS', {
        message: `qtyIn=1000, balanceQty=1000, Time=${elapsed}ms`,
        qtyIn: latestEntry.qtyIn,
        balanceQty: latestEntry.balanceQty,
      });
      return true;
    } else {
      await recordTest('Test 1: Large Purchase', 'FAIL', {
        message: `Expected qtyIn=1000, got ${latestEntry.qtyIn}; Expected balanceQty=1000, got ${latestEntry.balanceQty}`,
        qtyIn: latestEntry.qtyIn,
        balanceQty: latestEntry.balanceQty,
      });
      testResults.issues.push(`Test 1: Stock ledger mismatch (qtyIn=${latestEntry.qtyIn}, balanceQty=${latestEntry.balanceQty})`);
      return false;
    }
  } catch (err) {
    await recordTest('Test 1: Large Purchase', 'FAIL', { message: err.message });
    testResults.issues.push(`Test 1: ${err.message}`);
    return false;
  }
}

async function test2_LargeSalesFIFO(tenantId, data) {
  console.log('\n\n🔷 TEST 2: LARGE SALES FIFO (700 units)');
  console.log('═'.repeat(60));

  try {
    const startTime = Date.now();

    const sales = await Sales.create({
      tenantId,
      saleNumber: 'SAL-QA-001',
      customer: data.arAccount._id,
      warehouse: data.warehouse._id,
      items: [
        {
          item: data.item._id,
          quantity: 700,
          unitPrice: 15, // Selling at 15 (cost is 10)
        },
      ],
      totalAmount: 10500,
      status: 'Draft',
    });

    console.log(`✅ Sales created: ${sales._id}`);

    // Post sales
    await salesService.postSales(tenantId, sales._id, {
      salesAccountId: data.salesAccount._id,
      cogsAccountId: data.cogsAccount._id,
      inventoryAccountId: data.inventoryAccount._id,
    });

    const postedSales = await Sales.findById(sales._id);
    console.log(`✅ Sales posted: Status=${postedSales.status}`);

    // Check COGS
    const saleItem = postedSales.items[0];
    const expectedCOGS = 700 * 10;
    const actualCOGS = saleItem.cost;

    // Check stock ledger
    const ledger = await captureStockLedger(tenantId, data.item._id, data.warehouse._id);
    const latestEntry = ledger[ledger.length - 1];

    const cogsMatch = actualCOGS === expectedCOGS;
    const qtyOutMatch = latestEntry.qtyOut === 700;
    const balanceMatch = latestEntry.balanceQty === 300;

    const elapsed = Date.now() - startTime;
    testResults.performanceMetrics.test2 = `${elapsed}ms`;

    testResults.cogsSummary.totalSalesValue += 10500;
    testResults.cogsSummary.totalCOGS += actualCOGS;

    if (cogsMatch && qtyOutMatch && balanceMatch) {
      await recordTest('Test 2: Large Sales FIFO', 'PASS', {
        message: `COGS=7000, qtyOut=700, balanceQty=300, Time=${elapsed}ms`,
        cogs: actualCOGS,
        qtyOut: latestEntry.qtyOut,
        balanceQty: latestEntry.balanceQty,
      });
      return true;
    } else {
      await recordTest('Test 2: Large Sales FIFO', 'FAIL', {
        message: `Expected COGS=7000 (got ${actualCOGS}), qtyOut=700 (got ${latestEntry.qtyOut}), balanceQty=300 (got ${latestEntry.balanceQty})`,
      });
      testResults.issues.push(`Test 2: FIFO mismatch (COGS=${actualCOGS}, exp=7000; qtyOut=${latestEntry.qtyOut}, exp=700; balance=${latestEntry.balanceQty}, exp=300)`);
      return false;
    }
  } catch (err) {
    await recordTest('Test 2: Large Sales FIFO', 'FAIL', { message: err.message });
    testResults.issues.push(`Test 2: ${err.message}`);
    return false;
  }
}

async function test3_SecondSales(tenantId, data) {
  console.log('\n\n🔷 TEST 3: SECOND SALES (200 units)');
  console.log('═'.repeat(60));

  try {
    const startTime = Date.now();

    const sales = await Sales.create({
      tenantId,
      saleNumber: 'SAL-QA-002',
      customer: data.arAccount._id,
      warehouse: data.warehouse._id,
      items: [
        {
          item: data.item._id,
          quantity: 200,
          unitPrice: 15,
        },
      ],
      totalAmount: 3000,
      status: 'Draft',
    });

    console.log(`✅ Sales created: ${sales._id}`);

    await salesService.postSales(tenantId, sales._id, {
      salesAccountId: data.salesAccount._id,
      cogsAccountId: data.cogsAccount._id,
      inventoryAccountId: data.inventoryAccount._id,
    });

    const postedSales = await Sales.findById(sales._id);
    const saleItem = postedSales.items[0];
    const expectedCOGS = 200 * 10;
    const actualCOGS = saleItem.cost;

    const ledger = await captureStockLedger(tenantId, data.item._id, data.warehouse._id);
    const latestEntry = ledger[ledger.length - 1];

    const cogsMatch = actualCOGS === expectedCOGS;
    const qtyOutMatch = latestEntry.qtyOut === 200;
    const balanceMatch = latestEntry.balanceQty === 100;

    const elapsed = Date.now() - startTime;
    testResults.performanceMetrics.test3 = `${elapsed}ms`;

    testResults.cogsSummary.totalSalesValue += 3000;
    testResults.cogsSummary.totalCOGS += actualCOGS;

    if (cogsMatch && qtyOutMatch && balanceMatch) {
      await recordTest('Test 3: Second Sales', 'PASS', {
        message: `COGS=2000, qtyOut=200, balanceQty=100, Time=${elapsed}ms`,
        cogs: actualCOGS,
        balance: latestEntry.balanceQty,
      });
      return true;
    } else {
      await recordTest('Test 3: Second Sales', 'FAIL', {
        message: `Expected COGS=2000 (got ${actualCOGS}), balance=100 (got ${latestEntry.balanceQty})`,
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

async function test4_FinalSales(tenantId, data) {
  console.log('\n\n🔷 TEST 4: FINAL SALES (50 units)');
  console.log('═'.repeat(60));

  try {
    const startTime = Date.now();

    const sales = await Sales.create({
      tenantId,
      saleNumber: 'SAL-QA-003',
      customer: data.arAccount._id,
      warehouse: data.warehouse._id,
      items: [
        {
          item: data.item._id,
          quantity: 50,
          unitPrice: 15,
        },
      ],
      totalAmount: 750,
      status: 'Draft',
    });

    await salesService.postSales(tenantId, sales._id, {
      salesAccountId: data.salesAccount._id,
      cogsAccountId: data.cogsAccount._id,
      inventoryAccountId: data.inventoryAccount._id,
    });

    const postedSales = await Sales.findById(sales._id);
    const saleItem = postedSales.items[0];
    const expectedCOGS = 50 * 10;
    const actualCOGS = saleItem.cost;

    const ledger = await captureStockLedger(tenantId, data.item._id, data.warehouse._id);
    const latestEntry = ledger[ledger.length - 1];

    const cogsMatch = actualCOGS === expectedCOGS;
    const balanceMatch = latestEntry.balanceQty === 50;

    const elapsed = Date.now() - startTime;
    testResults.performanceMetrics.test4 = `${elapsed}ms`;

    testResults.cogsSummary.totalSalesValue += 750;
    testResults.cogsSummary.totalCOGS += actualCOGS;

    if (cogsMatch && balanceMatch) {
      await recordTest('Test 4: Final Sales', 'PASS', {
        message: `COGS=500, balanceQty=50, Time=${elapsed}ms`,
        cogs: actualCOGS,
        balance: latestEntry.balanceQty,
      });
      return true;
    } else {
      await recordTest('Test 4: Final Sales', 'FAIL', {
        message: `Expected COGS=500 (got ${actualCOGS}), balance=50 (got ${latestEntry.balanceQty})`,
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

async function test5_NegativeStockTest(tenantId, data) {
  console.log('\n\n🔷 TEST 5: NEGATIVE STOCK TEST (100 units - should fail)');
  console.log('═'.repeat(60));

  try {
    const startTime = Date.now();

    const sales = await Sales.create({
      tenantId,
      saleNumber: 'SAL-QA-004',
      customer: data.arAccount._id,
      warehouse: data.warehouse._id,
      items: [
        {
          item: data.item._id,
          quantity: 100,
          unitPrice: 15,
        },
      ],
      totalAmount: 1500,
      status: 'Draft',
    });

    try {
      await salesService.postSales(tenantId, sales._id, {
        salesAccountId: data.salesAccount._id,
        cogsAccountId: data.cogsAccount._id,
        inventoryAccountId: data.inventoryAccount._id,
      });

      // If we reach here, it's a failure (should have thrown)
      await recordTest('Test 5: Negative Stock', 'FAIL', {
        message: 'Expected error but posting succeeded',
      });
      testResults.issues.push(`Test 5: Negative stock not prevented`);
      return false;
    } catch (err) {
      if (err.message.includes('Insufficient') || err.message.includes('insufficient')) {
        const elapsed = Date.now() - startTime;
        testResults.performanceMetrics.test5 = `${elapsed}ms`;

        await recordTest('Test 5: Negative Stock', 'PASS', {
          message: `Error correctly thrown: "${err.message}", Time=${elapsed}ms`,
          errorThrown: true,
        });

        // Verify no ledger entry created
        const ledger = await StockLedger.findOne({
          tenantId,
          itemId: data.item._id,
          referenceId: sales._id,
          type: 'sale',
        });

        if (!ledger) {
          console.log('✅ No ledger entry created (correct)');
          return true;
        } else {
          testResults.issues.push(`Test 5: Orphan ledger entry found`);
          return false;
        }
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

async function test6_MultiBatchFIFO(tenantId, data) {
  console.log('\n\n🔷 TEST 6: MULTI-BATCH FIFO (purchase 500 @ 20, sell 100 mixed)');
  console.log('═'.repeat(60));

  try {
    const startTime = Date.now();

    // Purchase 500 @ 20
    const purchase2 = await Purchase.create({
      tenantId,
      purchaseNumber: 'PUR-QA-002',
      supplier: data.apAccount._id,
      warehouse: data.warehouse._id,
      items: [
        {
          item: data.item._id,
          quantity: 500,
          unitCost: 20,
          total: 10000,
        },
      ],
      totalAmount: 10000,
      status: 'Draft',
    });

    console.log(`✅ Second purchase created: 500 units @ 20`);

    await purchaseService.postPurchase(tenantId, purchase2._id);
    console.log(`✅ Second purchase posted`);

    let ledgerBefore = await captureStockLedger(tenantId, data.item._id, data.warehouse._id);
    const balanceBefore = ledgerBefore[ledgerBefore.length - 1].balanceQty;
    console.log(`   Current balance: ${balanceBefore}`);

    // Now sell 100 units
    const sales = await Sales.create({
      tenantId,
      saleNumber: 'SAL-QA-005',
      customer: data.arAccount._id,
      warehouse: data.warehouse._id,
      items: [
        {
          item: data.item._id,
          quantity: 100,
          unitPrice: 25,
        },
      ],
      totalAmount: 2500,
      status: 'Draft',
    });

    console.log(`✅ Sale created: 100 units`);

    await salesService.postSales(tenantId, sales._id, {
      salesAccountId: data.salesAccount._id,
      cogsAccountId: data.cogsAccount._id,
      inventoryAccountId: data.inventoryAccount._id,
    });

    const postedSales = await Sales.findById(sales._id);
    const saleItem = postedSales.items[0];
    const actualCOGS = saleItem.cost;

    // FIFO: First 50 from old stock @ 10 = 500, Next 50 from new stock @ 20 = 1000
    // Expected COGS = 1500
    const expectedCOGS = 1500;

    const ledger = await captureStockLedger(tenantId, data.item._id, data.warehouse._id);
    const latestEntry = ledger[ledger.length - 1];
    const expectedBalance = balanceBefore - 100; // Should be 550 - 100 = 450

    const cogsMatch = actualCOGS === expectedCOGS;
    const balanceMatch = latestEntry.balanceQty === expectedBalance;

    const elapsed = Date.now() - startTime;
    testResults.performanceMetrics.test6 = `${elapsed}ms`;

    testResults.cogsSummary.totalSalesValue += 2500;
    testResults.cogsSummary.totalCOGS += actualCOGS;

    if (cogsMatch && balanceMatch) {
      await recordTest('Test 6: Multi-Batch FIFO', 'PASS', {
        message: `COGS=1500 (50@10 + 50@20), balance=${expectedBalance}, Time=${elapsed}ms`,
        cogs: actualCOGS,
        balance: latestEntry.balanceQty,
      });
      return true;
    } else {
      await recordTest('Test 6: Multi-Batch FIFO', 'FAIL', {
        message: `Expected COGS=1500 (got ${actualCOGS}), expected balance=${expectedBalance} (got ${latestEntry.balanceQty})`,
      });
      testResults.issues.push(`Test 6: Multi-batch FIFO mismatch (COGS=${actualCOGS}, exp=1500; balance=${latestEntry.balanceQty}, exp=${expectedBalance})`);
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
    'Date': entry.createdAt.toISOString().split('T')[0],
  }));

  console.table(tableData);

  // COGS Summary
  console.log('\n\n💰 COGS SUMMARY\n');
  console.log(`Total Sales Value: PKR ${testResults.cogsSummary.totalSalesValue.toLocaleString()}`);
  console.log(`Total COGS: PKR ${testResults.cogsSummary.totalCOGS.toLocaleString()}`);
  console.log(`Gross Profit: PKR ${(testResults.cogsSummary.totalSalesValue - testResults.cogsSummary.totalCOGS).toLocaleString()}`);
  console.log(`Gross Profit %: ${((((testResults.cogsSummary.totalSalesValue - testResults.cogsSummary.totalCOGS) / testResults.cogsSummary.totalSalesValue) * 100) || 0).toFixed(2)}%`);

  const latestLedger = ledger[ledger.length - 1];
  const remainingInventoryValue = (latestLedger?.balanceQty || 0) * (latestLedger?.unitCost || 0);
  testResults.cogsSummary.remainingInventoryValue = remainingInventoryValue;
  console.log(`Remaining Inventory Value: PKR ${remainingInventoryValue.toLocaleString()}`);

  // Performance Metrics
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

  // Final Verdict
  console.log('\n\n🎯 FINAL VERDICT\n');
  const allPassed = failCount === 0;
  const systemStable = allPassed && testResults.issues.length === 0;

  console.log(`System Stable: ${systemStable ? '✅ YES' : '❌ NO'}`);
  console.log(`FIFO Accurate: ${allPassed ? '✅ YES' : '❌ NO'}`);
  console.log(`Ready for Production: ${systemStable ? '✅ YES' : '❌ NO'}`);

  if (systemStable) {
    console.log('\n🚀 SYSTEM PASSED ALL STRESS TESTS - READY FOR PRODUCTION');
  } else {
    console.log('\n📌 SYSTEM NEEDS ATTENTION - REVIEW ISSUES ABOVE');
  }

  console.log('\n' + '═'.repeat(80));
}

// ============================================================================
// 🚀 MAIN TEST EXECUTION
// ============================================================================

async function runAllTests() {
  console.log('\n' + '═'.repeat(80));
  console.log('🧪 QA STRESS TEST - LARGE-SCALE TRANSACTIONAL VALIDATION');
  console.log('═'.repeat(80));

  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/erpbuddy', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('\n✅ Connected to MongoDB');

    // Setup test data
    const tenantId = new mongoose.Types.ObjectId('000000000000000000000001'); // Fixed tenant for testing
    const data = await setupTestData(tenantId);

    // Clear previous test data
    await StockLedger.deleteMany({ tenantId });
    await Purchase.deleteMany({ tenantId, purchaseNumber: /PUR-QA/ });
    await Sales.deleteMany({ tenantId, saleNumber: /SAL-QA/ });
    await Journal.deleteMany({ tenantId, referenceType: 'purchase_qa', });
    console.log('✅ Previous test data cleared');

    // Run tests sequentially
    await test1_LargePurchase(tenantId, data);
    await test2_LargeSalesFIFO(tenantId, data);
    await test3_SecondSales(tenantId, data);
    await test4_FinalSales(tenantId, data);
    await test5_NegativeStockTest(tenantId, data);
    await test6_MultiBatchFIFO(tenantId, data);

    // Generate report
    await generateFinalReport();

    await mongoose.connection.close();
    console.log('\n✅ Test session closed');
  } catch (err) {
    console.error('\n❌ Test execution failed:', err);
    process.exit(1);
  }
}

// Run tests
runAllTests();
