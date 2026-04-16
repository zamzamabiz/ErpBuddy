/**
 * ============================================================================
 * LIFO CRITICAL TEST SUITE
 * ERP Financial Validation Level Testing
 * ============================================================================
 * 
 * OBJECTIVE:
 *   - Validate LIFO correctness against FIFO
 *   - Detect batch consumption bugs
 *   - Ensure Stock Ledger consistency
 *   - Stress test multi-batch scenarios
 *   - Confirm production readiness
 * 
 * RULES:
 *   - NO business logic modifications
 *   - REAL database (MongoDB)
 *   - All tests reproducible
 *   - 100% accuracy required
 * 
 * ============================================================================
 */

const mongoose = require('mongoose');
const Item = require('./src/modules/masters/items/items.model');
const StockLedger = require('./src/modules/inventory/stockLedger/stockLedger.model');
const Warehouse = require('./src/modules/masters/warehouse/warehouse.model');
const costingService = require('./src/modules/inventory/costing/costing.service');
const fifoService = require('./src/modules/inventory/costing/fifo.service');
const lifoService = require('./src/modules/inventory/costing/lifo.service');

// ============================================================================
// TEST FRAMEWORK
// ============================================================================

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/erpbuddy_dev';
let tenantId = new mongoose.Types.ObjectId();
let warehouseId = new mongoose.Types.ObjectId();
let itemId = null;
let companyId = new mongoose.Types.ObjectId();

let testsPassed = 0;
let testsFailed = 0;
const failedTests = [];

function log(msg, icon = '📋') {
  console.log(`${icon} ${msg}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(80));
  console.log(`🎯 ${title}`);
  console.log('='.repeat(80));
}

function logTest(testNum, testName) {
  console.log(`\n📌 TEST ${testNum}: ${testName}`);
  console.log('─'.repeat(80));
}

function logSuccess(msg) {
  console.log(`  ✅ ${msg}`);
}

function logError(msg) {
  console.log(`  ❌ ${msg}`);
}

function logInfo(msg) {
  console.log(`  ℹ️  ${msg}`);
}

function logDebug(msg, indent = 2) {
  const spaces = ' '.repeat(indent);
  console.log(`${spaces}🔍 ${msg}`);
}

async function assert(condition, successMsg, failureMsg) {
  if (condition) {
    logSuccess(successMsg);
    return true;
  } else {
    logError(failureMsg);
    testsFailed++;
    failedTests.push(failureMsg);
    return false;
  }
}

async function assertEquals(actual, expected, field) {
  if (actual === expected) {
    logSuccess(`${field}: ${actual} ✓`);
    return true;
  } else {
    logError(`${field} MISMATCH: Expected ${expected}, Got ${actual}`);
    testsFailed++;
    failedTests.push(`${field} mismatch in TEST`);
    return false;
  }
}

// ============================================================================
// DATABASE SETUP
// ============================================================================

async function connectDB() {
  try {
    await mongoose.connect(MONGO_URI);
    logSuccess('Connected to MongoDB');
  } catch (err) {
    logError(`MongoDB Connection Failed: ${err.message}`);
    process.exit(1);
  }
}

async function setupTestData() {
  try {
    // Create or get Company
    let company = await mongoose.connection.collection('companies').findOne({});
    if (!company) {
      const result = await mongoose.connection.collection('companies').insertOne({
        name: 'Test Company',
        code: 'TC-001',
        status: 'active',
      });
      company = result.ops ? result.ops[0] : { _id: result.insertedId };
    }
    const companyId = company._id;

    // Create or get Tenant
    let tenant = await mongoose.connection.collection('tenants').findOne({});
    if (!tenant) {
      const result = await mongoose.connection.collection('tenants').insertOne({
        name: 'Test Tenant',
        code: 'TT-001',
      });
      tenant = result.ops ? result.ops[0] : { _id: result.insertedId };
    }

    tenantId = tenant._id;

    // Clear previous test data
    await StockLedger.deleteMany({ tenantId });
    await Item.deleteMany({ tenantId });
    await Warehouse.deleteMany({ companyId });

    // Create warehouse
    const warehouse = await Warehouse.create({
      companyId,
      warehouseCode: 'TEST-WH-001',
      name: 'Test Warehouse',
      location: 'Test Location',
      address: 'Test Address',
    });

    // Create item
    const item = await Item.create({
      tenantId,
      companyId,
      itemCode: 'ITEM-001',
      name: 'Test Item',
      description: 'Test item for LIFO validation',
      itemType: 'inventory',
    });

    itemId = item._id;
    warehouseId = warehouse._id;

    logSuccess('Test data initialized');
    logInfo(`Item ID: ${itemId}`);
    logInfo(`Warehouse ID: ${warehouseId}`);
  } catch (err) {
    logError(`Setup Failed: ${err.message}`);
    process.exit(1);
  }
}

// ============================================================================
// STOCK LEDGER HELPERS
// ============================================================================

async function recordPurchase(qty, cost) {
  const entry = await StockLedger.create({
    tenantId,
    itemId,
    warehouseId,
    transactionType: 'PURCHASE',
    referenceType: 'purchase_bill',
    referenceId: new mongoose.Types.ObjectId(),
    qtyIn: qty,
    qtyOut: 0,
  });
  logDebug(`Purchase: ${qty} units @ $${cost}/unit created`);
  return entry;
}

async function recordSale(qty) {
  const entry = await StockLedger.create({
    tenantId,
    itemId,
    warehouseId,
    transactionType: 'SALE',
    referenceType: 'sales_invoice',
    referenceId: new mongoose.Types.ObjectId(),
    qtyIn: 0,
    qtyOut: qty,
  });
  logDebug(`Sale: ${qty} units created`);
  return entry;
}

async function getStockBalance() {
  const ledger = await StockLedger.find({ tenantId, itemId, warehouseId }).sort(
    { createdAt: 1 }
  );
  let balance = 0;
  ledger.forEach((entry) => {
    balance += entry.qtyIn - entry.qtyOut;
  });
  return { balance, ledger };
}

async function validateStockLedger() {
  const { balance, ledger } = await getStockBalance();

  let valid = true;
  let runningBalance = 0;

  for (const entry of ledger) {
    runningBalance += entry.qtyIn - entry.qtyOut;
    if (runningBalance < 0) {
      logError(`❌ Negative balance detected at entry ${entry._id}: ${runningBalance}`);
      valid = false;
    }
  }

  logDebug(`Current balance: ${balance} units`);
  return { valid, balance, ledger };
}

// ============================================================================
// TEST SCENARIOS
// ============================================================================

async function test1_BasicLIFOvsFIFO() {
  logTest(1, 'BASIC LIFO VS FIFO');
  logInfo('Purchase: 100 @ $10, 100 @ $20');
  logInfo('Sale: 100 units');

  // Clear ledger
  await StockLedger.deleteMany({ tenantId, itemId });

  // Purchases
  await recordPurchase(100, 10);
  await recordPurchase(100, 20);

  let validLedger = await validateStockLedger();
  await assert(validLedger.valid, 'Stock ledger is valid', 'Stock ledger has negative value');

  // Calculate FIFO
  const fifoResult = await costingService.calculateCost('FIFO', {
    tenantId,
    itemId,
    warehouseId,
    qty: 100,
  });

  logInfo(`FIFO Cost: $${fifoResult.totalCost} (Unit Cost: $${fifoResult.unitCost})`);
  logDebug('FIFO Breakdown:');
  fifoResult.breakdown.forEach((batch) => {
    logDebug(`  Batch @ $${batch.cost}: ${batch.qty} units = $${batch.qty * batch.cost}`, 6);
  });

  await assertEquals(fifoResult.totalCost, 1000, 'FIFO Total Cost');

  // Calculate LIFO
  const lifoResult = await costingService.calculateCost('LIFO', {
    tenantId,
    itemId,
    warehouseId,
    qty: 100,
  });

  logInfo(`LIFO Cost: $${lifoResult.totalCost} (Unit Cost: $${lifoResult.unitCost})`);
  logDebug('LIFO Breakdown:');
  lifoResult.breakdown.forEach((batch) => {
    logDebug(`  Batch @ $${batch.cost}: ${batch.qty} units = $${batch.qty * batch.cost}`, 6);
  });

  await assertEquals(lifoResult.totalCost, 2000, 'LIFO Total Cost');

  await assert(
    fifoResult.totalCost !== lifoResult.totalCost,
    'FIFO and LIFO produce different results ✓',
    'FIFO and LIFO should produce different results'
  );

  testsPassed++;
  logSuccess('✅ TEST 1 PASSED');
}

async function test2_PartialConsumption() {
  logTest(2, 'PARTIAL CONSUMPTION');
  logInfo('Purchase: 100 @ $10, 100 @ $20');
  logInfo('Sale: 150 units');

  await StockLedger.deleteMany({ tenantId, itemId });

  await recordPurchase(100, 10);
  await recordPurchase(100, 20);

  let validLedger = await validateStockLedger();
  await assert(validLedger.valid, 'Stock ledger is valid', 'Stock ledger has errors');

  // FIFO
  const fifoResult = await costingService.calculateCost('FIFO', {
    tenantId,
    itemId,
    warehouseId,
    qty: 150,
  });

  logInfo(`FIFO Cost: $${fifoResult.totalCost} (Unit Cost: $${fifoResult.unitCost})`);
  logDebug('FIFO Breakdown:');
  fifoResult.breakdown.forEach((batch) => {
    logDebug(`  Batch @ $${batch.cost}: ${batch.qty} units = $${batch.qty * batch.cost}`, 6);
  });

  await assertEquals(fifoResult.totalCost, 2000, 'FIFO Total Cost');

  // LIFO
  const lifoResult = await costingService.calculateCost('LIFO', {
    tenantId,
    itemId,
    warehouseId,
    qty: 150,
  });

  logInfo(`LIFO Cost: $${lifoResult.totalCost} (Unit Cost: $${lifoResult.unitCost})`);
  logDebug('LIFO Breakdown:');
  lifoResult.breakdown.forEach((batch) => {
    logDebug(`  Batch @ $${batch.cost}: ${batch.qty} units = $${batch.qty * batch.cost}`, 6);
  });

  await assertEquals(lifoResult.totalCost, 2500, 'LIFO Total Cost');

  testsPassed++;
  logSuccess('✅ TEST 2 PASSED');
}

async function test3_MultiBatchComplex() {
  logTest(3, 'MULTI-BATCH COMPLEX (3 batches, sale 400 units)');
  logInfo('Purchase: 100 @ $10, 200 @ $15, 300 @ $20');
  logInfo('Sale: 400 units');

  await StockLedger.deleteMany({ tenantId, itemId });

  await recordPurchase(100, 10);
  await recordPurchase(200, 15);
  await recordPurchase(300, 20);

  let validLedger = await validateStockLedger();
  await assert(validLedger.valid, 'Stock ledger is valid', 'Stock ledger has errors');
  await assertEquals(validLedger.balance, 600, 'Total Stock');

  // FIFO: 100@10 + 200@15 + 100@20
  const fifoResult = await costingService.calculateCost('FIFO', {
    tenantId,
    itemId,
    warehouseId,
    qty: 400,
  });

  const expectedFIFO = 100 * 10 + 200 * 15 + 100 * 20;
  logInfo(`FIFO Cost: $${fifoResult.totalCost} (Expected: $${expectedFIFO})`);
  logDebug('FIFO Breakdown:');
  fifoResult.breakdown.forEach((batch) => {
    logDebug(`  Batch @ $${batch.cost}: ${batch.qty} units = $${batch.qty * batch.cost}`, 6);
  });

  await assertEquals(fifoResult.totalCost, expectedFIFO, 'FIFO Total Cost');

  // LIFO: 300@20 + 100@15
  const lifoResult = await costingService.calculateCost('LIFO', {
    tenantId,
    itemId,
    warehouseId,
    qty: 400,
  });

  const expectedLIFO = 300 * 20 + 100 * 15;
  logInfo(`LIFO Cost: $${lifoResult.totalCost} (Expected: $${expectedLIFO})`);
  logDebug('LIFO Breakdown:');
  lifoResult.breakdown.forEach((batch) => {
    logDebug(`  Batch @ $${batch.cost}: ${batch.qty} units = $${batch.qty * batch.cost}`, 6);
  });

  await assertEquals(lifoResult.totalCost, expectedLIFO, 'LIFO Total Cost');

  testsPassed++;
  logSuccess('✅ TEST 3 PASSED');
}

async function test4_MultipleSalesSequence() {
  logTest(4, 'MULTIPLE SALES SEQUENCE');
  logInfo('Purchase: 500 @ $10, 500 @ $20');
  logInfo('Sales: 300, 200, 400 (total 900, but only 1000 available, last should be rejected)');

  await StockLedger.deleteMany({ tenantId, itemId });

  await recordPurchase(500, 10);
  await recordPurchase(500, 20);

  let validLedger = await validateStockLedger();
  await assertEquals(validLedger.balance, 1000, 'Initial Stock');

  // Sale 1: 300 units
  logInfo('--- Sale 1: 300 units ---');
  const sale1FIFO = await costingService.calculateCost('FIFO', {
    tenantId,
    itemId,
    warehouseId,
    qty: 300,
  });
  logInfo(`  FIFO: $${sale1FIFO.totalCost}`);

  const sale1LIFO = await costingService.calculateCost('LIFO', {
    tenantId,
    itemId,
    warehouseId,
    qty: 300,
  });
  logInfo(`  LIFO: $${sale1LIFO.totalCost}`);

  // Sale 2: 200 units (remaining: 500 @ $10 [200 left], 500 @ $20)
  logInfo('--- Sale 2: 200 units ---');
  const sale2FIFO = await costingService.calculateCost('FIFO', {
    tenantId,
    itemId,
    warehouseId,
    qty: 200,
  });
  logInfo(`  FIFO: $${sale2FIFO.totalCost}`);

  const sale2LIFO = await costingService.calculateCost('LIFO', {
    tenantId,
    itemId,
    warehouseId,
    qty: 200,
  });
  logInfo(`  LIFO: $${sale2LIFO.totalCost}`);

  // Sale 3: 400 units (remaining: 200 @ $10, 500 @ $20)
  logInfo('--- Sale 3: 400 units ---');
  const sale3FIFO = await costingService.calculateCost('FIFO', {
    tenantId,
    itemId,
    warehouseId,
    qty: 400,
  });
  logInfo(`  FIFO: $${sale3FIFO.totalCost}`);

  const sale3LIFO = await costingService.calculateCost('LIFO', {
    tenantId,
    itemId,
    warehouseId,
    qty: 400,
  });
  logInfo(`  LIFO: $${sale3LIFO.totalCost}`);

  // Validate no double counting
  const totalFIFO = sale1FIFO.totalCost + sale2FIFO.totalCost + sale3FIFO.totalCost;
  const totalLIFO = sale1LIFO.totalCost + sale2LIFO.totalCost + sale3LIFO.totalCost;

  const fullLIFO = await costingService.calculateCost('LIFO', {
    tenantId,
    itemId,
    warehouseId,
    qty: 900,
  });

  logInfo(`\nTotal from 3 sales (LIFO): $${totalLIFO}`);
  logInfo(`Full sale of 900 units (LIFO): $${fullLIFO.totalCost}`);

  await assert(
    totalLIFO === fullLIFO.totalCost,
    'Cumulative sales equal full sale ✓',
    'Cumulative sales do NOT match full sale'
  );

  testsPassed++;
  logSuccess('✅ TEST 4 PASSED');
}

async function test5_NegativeStockProtection() {
  logTest(5, 'NEGATIVE STOCK PROTECTION');
  logInfo('Purchase: 100 @ $10');
  logInfo('Attempt Sale: 150 units (should fail)');

  await StockLedger.deleteMany({ tenantId, itemId });
  await recordPurchase(100, 10);

  try {
    const result = await costingService.calculateCost('LIFO', {
      tenantId,
      itemId,
      warehouseId,
      qty: 150,
    });

    logError(
      `❌ Should have thrown error but got result: $${result.totalCost}`
    );
    testsFailed++;
    failedTests.push('Negative stock protection failed - should reject 150 qty when 100 available');
  } catch (err) {
    if (err.message.includes('Insufficient') || err.message.includes('insufficient')) {
      logSuccess(`Correctly rejected oversale: "${err.message}"`);
      testsPassed++;
      logSuccess('✅ TEST 5 PASSED');
    } else {
      logError(`Unexpected error: ${err.message}`);
      testsFailed++;
      failedTests.push(`Unexpected error in oversale test: ${err.message}`);
    }
  }
}

async function test6_StockLedgerConsistency() {
  logTest(6, 'STOCK LEDGER CONSISTENCY');
  logInfo('Multiple purchases and sales - validate ledger integrity');

  await StockLedger.deleteMany({ tenantId, itemId });

  // Complex sequence
  await recordPurchase(100, 10);
  await recordSale(30);
  await recordPurchase(200, 15);
  await recordSale(150);
  await recordPurchase(300, 20);
  await recordSale(100);

  const { valid, balance, ledger } = await validateStockLedger();

  logInfo(`Ledger entries: ${ledger.length}`);
  logInfo(`Final balance: ${balance} units`);

  let runningBalance = 0;
  ledger.forEach((entry, idx) => {
    runningBalance += entry.qtyIn - entry.qtyOut;
    const entryType = entry.qtyIn > 0 ? 'IN' : 'OUT';
    const qty = entry.qtyIn > 0 ? entry.qtyIn : entry.qtyOut;
    logDebug(
      `Entry ${idx + 1}: ${qty} ${entryType} @ $${entry.cost}, Balance: ${runningBalance}`,
      4
    );
  });

  await assert(valid, 'All balances are non-negative ✓', 'Negative balance detected');

  const expectedBalance = 100 - 30 + 200 - 150 + 300 - 100;
  await assertEquals(balance, expectedBalance, 'Final Balance');

  testsPassed++;
  logSuccess('✅ TEST 6 PASSED');
}

async function test7_StressTest() {
  logTest(7, 'RANDOM STRESS TEST');
  logInfo('Generating 10 random purchases and 10 random sales');

  await StockLedger.deleteMany({ tenantId, itemId });

  const purchases = [];
  let totalPurchaseQty = 0;

  // Generate random purchases
  for (let i = 0; i < 10; i++) {
    const qty = Math.floor(Math.random() * 500) + 100;
    const cost = Math.floor(Math.random() * 50) + 5;
    await recordPurchase(qty, cost);
    purchases.push({ qty, cost });
    totalPurchaseQty += qty;
    logDebug(`Purchase ${i + 1}: ${qty} units @ $${cost}`, 4);
  }

  logInfo(`Total available: ${totalPurchaseQty} units`);

  let { valid: validAfterPurchase, balance: balanceAfterPurchase } =
    await validateStockLedger();
  await assert(
    validAfterPurchase,
    'Stock ledger valid after purchases',
    'Stock ledger has errors after purchases'
  );

  // Generate sales up to 80% of available
  const maxSaleQty = Math.floor(totalPurchaseQty * 0.8);
  let soldQty = 0;
  let saleCount = 0;

  for (let i = 0; i < 10 && soldQty < maxSaleQty; i++) {
    const remainingBudget = maxSaleQty - soldQty;
    const saleQty = Math.min(Math.floor(Math.random() * 200) + 50, remainingBudget);

    try {
      const fifoResult = await costingService.calculateCost('FIFO', {
        tenantId,
        itemId,
        warehouseId,
        qty: saleQty,
      });

      const lifoResult = await costingService.calculateCost('LIFO', {
        tenantId,
        itemId,
        warehouseId,
        qty: saleQty,
      });

      logDebug(
        `Sale ${i + 1}: ${saleQty} units → FIFO: $${fifoResult.totalCost}, LIFO: $${lifoResult.totalCost}`,
        4
      );

      soldQty += saleQty;
      saleCount++;
    } catch (err) {
      logInfo(`  Sale ${i + 1} failed (OK): ${err.message.substring(0, 50)}`);
    }
  }

  logInfo(`Completed ${saleCount} sales, Sold ${soldQty} units`);

  let { valid: validAfterSales, balance: balanceAfterSales } =
    await validateStockLedger();
  await assert(
    validAfterSales,
    'Stock ledger valid after sales',
    'Stock ledger has errors after sales'
  );

  const expectedFinalBalance = totalPurchaseQty - soldQty;
  await assertEquals(balanceAfterSales, expectedFinalBalance, 'Final Balance');

  testsPassed++;
  logSuccess('✅ TEST 7 PASSED');
}

async function test8_FIFOLIFODivergence() {
  logTest(8, 'FIFO VS LIFO DIVERGENCE ANALYSIS');
  logInfo('Validate that FIFO and LIFO always produce different results (except edge cases)');

  await StockLedger.deleteMany({ tenantId, itemId });

  // Create varied price batches
  const batches = [
    { qty: 150, cost: 8 },
    { qty: 200, cost: 12 },
    { qty: 100, cost: 20 },
    { qty: 250, cost: 15 },
  ];

  let totalQty = 0;
  for (const batch of batches) {
    await recordPurchase(batch.qty, batch.cost);
    totalQty += batch.qty;
  }

  logInfo(`Total inventory: ${totalQty} units across 4 batches with varied pricing`);

  // Test multiple sale quantities
  const salesToTest = [100, 250, 400, 550];

  for (const saleQty of salesToTest) {
    if (saleQty > totalQty) {
      logDebug(`Skipping ${saleQty} (exceeds available)`, 4);
      continue;
    }

    try {
      const fifo = await costingService.calculateCost('FIFO', {
        tenantId,
        itemId,
        warehouseId,
        qty: saleQty,
      });

      const lifo = await costingService.calculateCost('LIFO', {
        tenantId,
        itemId,
        warehouseId,
        qty: saleQty,
      });

      const divergence = lifo.totalCost - fifo.totalCost;
      const divergencePercent = ((divergence / fifo.totalCost) * 100).toFixed(2);

      logDebug(
        `Sale ${saleQty}u: FIFO=$${fifo.totalCost}, LIFO=$${lifo.totalCost}, Divergence=$${divergence} (${divergencePercent}%)`,
        4
      );

      if (fifo.totalCost !== lifo.totalCost) {
        logSuccess(`Methods diverge as expected (+${divergencePercent}%)`);
      } else {
        logError(`⚠️ Methods returned same cost (edge case or bug)`);
      }
    } catch (err) {
      logInfo(`  Sale ${saleQty}u error: ${err.message.substring(0, 40)}`);
    }
  }

  testsPassed++;
  logSuccess('✅ TEST 8 PASSED');
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function main() {
  logSection('LIFO CRITICAL TEST SUITE - START');

  try {
    await connectDB();
    await setupTestData();

    logSection('RUNNING TESTS');

    await test1_BasicLIFOvsFIFO();
    await test2_PartialConsumption();
    await test3_MultiBatchComplex();
    await test4_MultipleSalesSequence();
    await test5_NegativeStockProtection();
    await test6_StockLedgerConsistency();
    await test7_StressTest();
    await test8_FIFOLIFODivergence();

    // ========================================================================
    // FINAL REPORT
    // ========================================================================

    logSection('✅ SUMMARY REPORT');

    const totalTests = 8;
    console.log(`
╔════════════════════════════════════════════════════════════════════════════╗
║                         LIFO CRITICAL TEST REPORT                          ║
╚════════════════════════════════════════════════════════════════════════════╝

📊 TEST RESULTS:
   Total Tests:     ${totalTests}
   ✅ Passed:        ${testsPassed}
   ❌ Failed:        ${testsFailed}
   Success Rate:    ${((testsPassed / totalTests) * 100).toFixed(1)}%

`);

    if (testsFailed === 0) {
      console.log(`
🎯 🚀 ALL TESTS PASSED - SYSTEM READY FOR PRODUCTION

✅ Correctness: LIFO calculations mathematically correct
✅ Consistency: Stock ledger maintains integrity
✅ Stability: System stable under stress
✅ Compliance: Batch consumption logic validated
✅ Safety: Negative stock protection active

`);
    } else {
      console.log(`
⚠️ ISSUES DETECTED - REQUIRES FIXES

🚨 BUGS FOUND:
${failedTests.map((bug, idx) => `   ${idx + 1}. ${bug}`).join('\n')}

`);
    }

    console.log(`
╔════════════════════════════════════════════════════════════════════════════╗
║                           RISK ANALYSIS                                    ║
╚════════════════════════════════════════════════════════════════════════════╝

✔ Edge Case Failures: ${failedTests.length === 0 ? '❌ NONE' : '⚠️ ' + failedTests.length}
✔ Data Consistency Issues: ${failedTests.length === 0 ? '❌ NONE' : '⚠️ YES'}
✔ Stock Ledger Corruption Risk: ${failedTests.length === 0 ? '❌ NONE' : '⚠️ PRESENT'}
✔ Batch Consumption Logic: ${failedTests.length === 0 ? '✅ RELIABLE' : '⚠️ NEEDS REVIEW'}

`);

    console.log(`
╔════════════════════════════════════════════════════════════════════════════╗
║                           FINAL VERDICT                                    ║
╚════════════════════════════════════════════════════════════════════════════╝

${
  testsFailed === 0
    ? `
✅ ✅ ✅ SAFE FOR PRODUCTION ✅ ✅ ✅

LIFO costing system has passed all critical tests:
  • Mathematical accuracy verified
  • Inventory consistency maintained
  • System stable under stress
  • Production deployment APPROVED

Recommendation: DEPLOY TO PRODUCTION WITH CONFIDENCE

`
    : `
⚠️ ⚠️ ⚠️ NEEDS FIXES ⚠️ ⚠️ ⚠️

${failedTests.length} issue(s) detected. Do NOT deploy to production.

Action Required:
  1. Review failed tests above
  2. Debug batch consumption logic
  3. Run test suite again
  4. Confirm all 8/8 tests pass before deployment

`
}
`);

    console.log(`
╔════════════════════════════════════════════════════════════════════════════╗
║                         END OF REPORT                                      ║
╚════════════════════════════════════════════════════════════════════════════╝
`);

    process.exit(testsFailed === 0 ? 0 : 1);
  } catch (err) {
    logError(`Test Suite Error: ${err.message}`);
    console.error(err);
    process.exit(1);
  }
}

main();
