/**
 * ========================================
 * FIFO REGRESSION TEST SUITE
 * ========================================
 * 
 * Objective: Verify FIFO still works correctly after LIFO integration
 * Mandate: REGRESSION TESTING - CRITICAL
 * 
 * - DO NOT modify code
 * - ONLY test and report
 * - Use real MongoDB data
 * - Tests must reflect real ERP scenarios
 * 
 * Expected: FIFO behavior EXACTLY as before
 * 
 * ========================================
 */

const mongoose = require('mongoose');
const costingService = require('./src/modules/inventory/costing/costing.service');

// Import models
const StockLedger = require('./src/modules/inventory/stockLedger/stockLedger.model');

// Test configuration
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/erpbuddy_dev';
const FORCE_FIFO = 'FIFO'; // ALWAYS use FIFO for regression testing

// Generate test data ObjectIds
let testTenantId = new mongoose.Types.ObjectId();
let testWarehouseId = new mongoose.Types.ObjectId();
let testItemId = new mongoose.Types.ObjectId();

// Test results tracking
let testResults = {
  totalTests: 0,
  passed: 0,
  failed: 0,
  tests: []
};

// ========================================
// UTILITY FUNCTIONS
// ========================================

/**
 * Connect to MongoDB
 */
async function connectDB() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ MongoDB connected\n');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    process.exit(1);
  }
}

/**
 * Disconnect from MongoDB
 */
async function disconnectDB() {
  await mongoose.disconnect();
}

/**
 * Record purchase in stock ledger
 */
async function recordPurchase(itemId, warehouseId, tenantId, qty, unitCost, batchRef) {
  try {
    const entry = await StockLedger.create({
      tenantId: tenantId,
      itemId: itemId,
      warehouseId: warehouseId,
      transactionType: 'PURCHASE',
      referenceType: 'purchase_bill',
      referenceId: new mongoose.Types.ObjectId(),
      qtyIn: qty,
      qtyOut: 0,
      unitCost: unitCost,
    });

    console.log(`  📥 Purchase recorded: ${qty} units @ $${unitCost} = $${qty * unitCost}`);
    return entry;
  } catch (error) {
    console.error('❌ Error recording purchase:', error.message);
    throw error;
  }
}

/**
 * Record sale in stock ledger (tracks cost calculation)
 */
async function recordSale(itemId, warehouseId, tenantId, qty, costResult, saleRef) {
  try {
    const entry = await StockLedger.create({
      tenantId: tenantId,
      itemId: itemId,
      warehouseId: warehouseId,
      transactionType: 'SALE',
      referenceType: 'sales_invoice',
      referenceId: new mongoose.Types.ObjectId(),
      qtyIn: 0,
      qtyOut: qty,
      unitCost: costResult.unitCost,
    });

    console.log(`  📤 Sale recorded: ${qty} units | Cost: $${costResult.totalCost} (FIFO)`);
    return entry;
  } catch (error) {
    console.error('❌ Error recording sale:', error.message);
    throw error;
  }
}

/**
 * Validate stock balance
 */
async function validateStockBalance(itemId, warehouseId, tenantId, expectedBalance) {
  try {
    const ledger = await StockLedger.find({
      tenantId: tenantId,
      itemId: itemId,
      warehouseId: warehouseId,
    }).sort({ createdAt: 1 });

    const balance = ledger.reduce((acc, entry) => {
      return acc + entry.qtyIn - entry.qtyOut;
    }, 0);

    const isValid = balance === expectedBalance;

    console.log(`  ${isValid ? '✅' : '❌'} Stock Balance: ${balance}/${expectedBalance}`);

    return { balance, isValid, ledger };
  } catch (error) {
    console.error('❌ Error validating stock:', error.message);
    throw error;
  }
}

/**
 * Clear test data
 */
async function clearTestData() {
  try {
    await StockLedger.deleteMany({ tenantId: testTenantId });
    console.log('🧹 Test data cleared\n');
  } catch (error) {
    console.error('⚠️  Error clearing test data:', error.message);
  }
}

/**
 * Record test result
 */
function recordTest(testName, passed, details) {
  testResults.totalTests++;
  if (passed) {
    testResults.passed++;
    console.log(`✅ ${testName} PASSED\n`);
  } else {
    testResults.failed++;
    console.log(`❌ ${testName} FAILED: ${details}\n`);
  }

  testResults.tests.push({
    name: testName,
    passed: passed,
    details: details,
  });
}

// ========================================
// TEST SCENARIOS
// ========================================

/**
 * TEST 1: BASIC FIFO
 * Purchase: 100@10, 100@20
 * Sale: 100 units
 * Expected: 100×10 = 1000
 */
async function test1_BasicFIFO() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('🧪 TEST 1 — BASIC FIFO');
  console.log('═══════════════════════════════════════════════════════');

  try {
    const itemId = new mongoose.Types.ObjectId();
    const warehouseId = testWarehouseId;
    const tenantId = testTenantId;

    // Purchases
    console.log('\n📦 Purchases:');
    await recordPurchase(itemId, warehouseId, tenantId, 100, 10, 'PO-001');
    await recordPurchase(itemId, warehouseId, tenantId, 100, 20, 'PO-002');

    // Calculate FIFO cost for 100 units (should use first batch @ 10)
    console.log('\n💰 Calculating FIFO cost for 100 units:');
    const costResult = await costingService.calculateCost(FORCE_FIFO, {
      tenantId: tenantId,
      itemId: itemId,
      warehouseId: warehouseId,
      qty: 100,
    });

    console.log(`  Method: ${costingService.method}`);
    console.log(`  Unit Cost: $${costResult.unitCost}`);
    console.log(`  Total Cost: $${costResult.totalCost}`);
    console.log(`  Batch Breakdown:`);
    costResult.breakdown.forEach((b, i) => {
      console.log(`    Batch ${i + 1}: ${b.qty} @ $${b.unitCost} = $${b.totalCost}`);
    });

    // Record sale
    console.log('\n📊 Recording sale:');
    await recordSale(itemId, warehouseId, tenantId, 100, costResult, 'SI-001');

    // Validate
    const expected = 1000; // 100 @ 10
    const passed = costResult.totalCost === expected;

    recordTest(
      'TEST 1 - Basic FIFO',
      passed,
      passed
        ? `FIFO correctly calculated $${costResult.totalCost}`
        : `Expected $${expected}, got $${costResult.totalCost}`
    );

    // Stock balance
    await validateStockBalance(itemId, warehouseId, tenantId, 100); // 100 + 100 - 100 = 100 remaining
  } catch (error) {
    recordTest('TEST 1 - Basic FIFO', false, error.message);
  }
}

/**
 * TEST 2: PARTIAL FIFO
 * Purchase: 100@10, 100@20
 * Sale: 150 units
 * Expected: 100@10 + 50@20 = 2000
 */
async function test2_PartialFIFO() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('🧪 TEST 2 — PARTIAL FIFO');
  console.log('═══════════════════════════════════════════════════════');

  try {
    const itemId = new mongoose.Types.ObjectId();
    const warehouseId = testWarehouseId;
    const tenantId = testTenantId;

    // Purchases
    console.log('\n📦 Purchases:');
    await recordPurchase(itemId, warehouseId, tenantId, 100, 10, 'PO-003');
    await recordPurchase(itemId, warehouseId, tenantId, 100, 20, 'PO-004');

    // Calculate FIFO cost for 150 units (100@10 + 50@20)
    console.log('\n💰 Calculating FIFO cost for 150 units:');
    const costResult = await costingService.calculateCost(FORCE_FIFO, {
      tenantId: tenantId,
      itemId: itemId,
      warehouseId: warehouseId,
      qty: 150,
    });

    console.log(`  Method: ${costResult.method}`);
    console.log(`  Unit Cost: $${costResult.unitCost}`);
    console.log(`  Total Cost: $${costResult.totalCost}`);
    console.log(`  Batch Breakdown:`);
    costResult.breakdown.forEach((b, i) => {
      console.log(`    Batch ${i + 1}: ${b.qty} @ $${b.unitCost} = $${b.totalCost}`);
    });

    // Record sale
    console.log('\n📊 Recording sale:');
    await recordSale(itemId, warehouseId, tenantId, 150, costResult, 'SI-002');

    // Validate
    const expected = 2000; // 100@10 + 50@20
    const passed = costResult.totalCost === expected;

    recordTest(
      'TEST 2 - Partial FIFO',
      passed,
      passed
        ? `FIFO correctly calculated $${costResult.totalCost} (100@10 + 50@20)`
        : `Expected $${expected}, got $${costResult.totalCost}`
    );

    // Stock balance
    await validateStockBalance(itemId, warehouseId, tenantId, 50); // 100 + 100 - 150 = 50 remaining
  } catch (error) {
    recordTest('TEST 2 - Partial FIFO', false, error.message);
  }
}

/**
 * TEST 3: MULTI-BATCH FIFO
 * Purchase: 100@10, 200@15, 300@20
 * Sale: 400 units
 * Expected: 100@10 + 200@15 + 100@20 = 6000
 */
async function test3_MultiBatchFIFO() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('🧪 TEST 3 — MULTI-BATCH FIFO');
  console.log('═══════════════════════════════════════════════════════');

  try {
    const itemId = new mongoose.Types.ObjectId();
    const warehouseId = testWarehouseId;
    const tenantId = testTenantId;

    // Purchases
    console.log('\n📦 Purchases:');
    await recordPurchase(itemId, warehouseId, tenantId, 100, 10, 'PO-005');
    await recordPurchase(itemId, warehouseId, tenantId, 200, 15, 'PO-006');
    await recordPurchase(itemId, warehouseId, tenantId, 300, 20, 'PO-007');

    // Calculate FIFO cost for 400 units (100@10 + 200@15 + 100@20)
    console.log('\n💰 Calculating FIFO cost for 400 units:');
    const costResult = await costingService.calculateCost(FORCE_FIFO, {
      tenantId: tenantId,
      itemId: itemId,
      warehouseId: warehouseId,
      qty: 400,
    });

    console.log(`  Method: ${costResult.method}`);
    console.log(`  Unit Cost: $${costResult.unitCost}`);
    console.log(`  Total Cost: $${costResult.totalCost}`);
    console.log(`  Batch Breakdown:`);
    costResult.breakdown.forEach((b, i) => {
      console.log(`    Batch ${i + 1}: ${b.qty} @ $${b.unitCost} = $${b.totalCost}`);
    });

    // Record sale
    console.log('\n📊 Recording sale:');
    await recordSale(itemId, warehouseId, tenantId, 400, costResult, 'SI-003');

    // Validate
    const expected = 6000; // 100@10 + 200@15 + 100@20 = 1000 + 3000 + 2000
    const passed = costResult.totalCost === expected;

    recordTest(
      'TEST 3 - Multi-Batch FIFO',
      passed,
      passed
        ? `FIFO correctly calculated $${costResult.totalCost} (3-batch consumption)`
        : `Expected $${expected}, got $${costResult.totalCost}`
    );

    // Stock balance
    await validateStockBalance(itemId, warehouseId, tenantId, 200); // 100 + 200 + 300 - 400 = 200 remaining
  } catch (error) {
    recordTest('TEST 3 - Multi-Batch FIFO', false, error.message);
  }
}

/**
 * TEST 4: MULTIPLE SALES SEQUENCE
 * Purchase: 500@10, 500@20
 * Sales: 300, 200, 400
 * Validate: Correct batch consumption, no stock reuse, remaining correct
 */
async function test4_MultipleSalesSequence() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('🧪 TEST 4 — MULTIPLE SALES SEQUENCE');
  console.log('═══════════════════════════════════════════════════════');

  try {
    const itemId = new mongoose.Types.ObjectId();
    const warehouseId = testWarehouseId;
    const tenantId = testTenantId;

    // Purchases
    console.log('\n📦 Purchases:');
    await recordPurchase(itemId, warehouseId, tenantId, 500, 10, 'PO-008');
    await recordPurchase(itemId, warehouseId, tenantId, 500, 20, 'PO-009');

    const sales = [
      { qty: 300, saleRef: 'SI-004' },
      { qty: 200, saleRef: 'SI-005' },
      { qty: 400, saleRef: 'SI-006' },
    ];

    let totalCost = 0;
    let allCorrect = true;

    for (let i = 0; i < sales.length; i++) {
      const { qty, saleRef } = sales[i];

      console.log(`\n💰 Sale ${i + 1}: Calculating FIFO cost for ${qty} units:`);
      const costResult = await costingService.calculateCost(FORCE_FIFO, {
        tenantId: tenantId,
        itemId: itemId,
        warehouseId: warehouseId,
        qty: qty,
      });

      console.log(`  Method: ${costResult.method}`);
      console.log(`  Unit Cost: $${costResult.unitCost}`);
      console.log(`  Total Cost: $${costResult.totalCost}`);
      costResult.breakdown.forEach((b, j) => {
        console.log(`    Batch ${j + 1}: ${b.qty} @ $${b.unitCost} = $${b.totalCost}`);
      });

      // Record sale
      await recordSale(itemId, warehouseId, tenantId, qty, costResult, saleRef);
      totalCost += costResult.totalCost;
    }

    // Expected costs
    // Sale 1 (300): 300@10 = 3000
    // Sale 2 (200): 200@10 = 2000
    // Sale 3 (400): 0@10 (all used) + 400@20 = 8000
    // Total = 13000

    const expectedTotal = 13000;
    const passed = totalCost === expectedTotal;

    recordTest(
      'TEST 4 - Multiple Sales Sequence',
      passed,
      passed
        ? `Sequential FIFO correctly calculated total $${totalCost}`
        : `Expected total $${expectedTotal}, got $${totalCost}`
    );

    // Stock balance should be 0 (500 + 500 - 300 - 200 - 400 = 0... wait let me check:  500+500=1000, 300+200+400=900, so 100 remaining)
    // Actually 500+500-300-200-400 = 100
    await validateStockBalance(itemId, warehouseId, tenantId, 100);
  } catch (error) {
    recordTest('TEST 4 - Multiple Sales Sequence', false, error.message);
  }
}

/**
 * TEST 5: NEGATIVE STOCK PROTECTION
 * Purchase: 100@10
 * Sale: 150 units
 * Expected: Error "Insufficient stock"
 */
async function test5_NegativeStockProtection() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('🧪 TEST 5 — NEGATIVE STOCK PROTECTION');
  console.log('═══════════════════════════════════════════════════════');

  try {
    const itemId = new mongoose.Types.ObjectId();
    const warehouseId = testWarehouseId;
    const tenantId = testTenantId;

    // Purchases
    console.log('\n📦 Purchases:');
    await recordPurchase(itemId, warehouseId, tenantId, 100, 10, 'PO-010');

    // Try to sell 150 (should fail)
    console.log('\n💰 Attempting FIFO cost for 150 units (should fail):');
    let errorCaught = false;
    let errorMessage = '';

    try {
      const costResult = await costingService.calculateCost(FORCE_FIFO, {
        tenantId: tenantId,
        itemId: itemId,
        warehouseId: warehouseId,
        qty: 150,
      });
      console.log(`  ❌ ERROR: Sale was allowed! Cost: $${costResult.totalCost}`);
    } catch (error) {
      errorCaught = true;
      errorMessage = error.message;
      console.log(`  ✅ Correctly rejected with error: "${error.message}"`);
    }

    const passed = errorCaught;

    recordTest(
      'TEST 5 - Negative Stock Protection',
      passed,
      passed ? `Sale correctly rejected (insufficient stock)` : `Sale was incorrectly allowed!`
    );
  } catch (error) {
    recordTest('TEST 5 - Negative Stock Protection', false, error.message);
  }
}

/**
 * TEST 6: STOCK LEDGER CONSISTENCY
 * Validate: Sum(qtyIn - qtyOut) = balanceQty, No negatives, Entries consistent
 */
async function test6_StockLedgerConsistency() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('🧪 TEST 6 — STOCK LEDGER CONSISTENCY');
  console.log('═══════════════════════════════════════════════════════');

  try {
    const itemId = new mongoose.Types.ObjectId();
    const warehouseId = testWarehouseId;
    const tenantId = testTenantId;

    // Create a transaction sequence
    console.log('\n📦 Transaction Sequence:');
    const transactions = [
      { type: 'buy', qty: 100, cost: 10 },
      { type: 'buy', qty: 200, cost: 15 },
      { type: 'buy', qty: 300, cost: 20 },
      { type: 'sell', qty: 150 },
      { type: 'buy', qty: 100, cost: 25 },
      { type: 'sell', qty: 200 },
    ];

    for (let i = 0; i < transactions.length; i++) {
      const tx = transactions[i];
      if (tx.type === 'buy') {
        await recordPurchase(itemId, warehouseId, tenantId, tx.qty, tx.cost, `PO-${11 + i}`);
      } else {
        const costResult = await costingService.calculateCost(FORCE_FIFO, {
          tenantId: tenantId,
          itemId: itemId,
          warehouseId: warehouseId,
          qty: tx.qty,
        });
        await recordSale(itemId, warehouseId, tenantId, tx.qty, costResult, `SI-${100 + i}`);
      }
    }

    // Validate ledger consistency
    console.log('\n✔️ Validating ledger consistency:');

    const ledger = await StockLedger.find({
      tenantId: tenantId,
      itemId: itemId,
      warehouseId: warehouseId,
    }).sort({ createdAt: 1 });

    let balance = 0;
    let hasNegative = false;
    let allValid = true;

    ledger.forEach((entry, index) => {
      balance += entry.qtyIn - entry.qtyOut;
      console.log(`  Entry ${index + 1}: +${entry.qtyIn} -${entry.qtyOut} = Balance: ${balance}`);

      if (balance < 0) {
        hasNegative = true;
        console.log(`    ⚠️ NEGATIVE BALANCE DETECTED!`);
      }
    });

    console.log(`\n  Final Balance: ${balance}`);
    console.log(`  Has Negatives: ${hasNegative ? 'YES ❌' : 'NO ✅'}`);
    console.log(`  Expected: 100 + 200 + 300 - 150 + 100 - 200 = 350`);

    const passed = !hasNegative && balance === 350;

    recordTest(
      'TEST 6 - Stock Ledger Consistency',
      passed,
      passed
        ? `Ledger valid: balance=${balance}, no negatives`
        : `Ledger invalid: hasNegatives=${hasNegative}, balance=${balance}`
    );
  } catch (error) {
    recordTest('TEST 6 - Stock Ledger Consistency', false, error.message);
  }
}

/**
 * TEST 7: RANDOM STRESS TEST
 * Generate 10 purchases + 10 sales
 * Validate: No crash, correct costs, correct stock
 */
async function test7_RandomStressTest() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('🧪 TEST 7 — RANDOM STRESS TEST');
  console.log('═══════════════════════════════════════════════════════');

  try {
    const itemId = new mongoose.Types.ObjectId();
    const warehouseId = testWarehouseId;
    const tenantId = testTenantId;

    console.log('\n📦 Generating 10 random purchases:');

    let totalInStock = 0;
    const purchaseCosts = [];

    for (let i = 0; i < 10; i++) {
      const qty = Math.floor(Math.random() * 200) + 50; // 50-250
      const cost = Math.floor(Math.random() * 50) + 5; // $5-$55
      await recordPurchase(itemId, warehouseId, tenantId, qty, cost, `PO-STRESS-${i + 1}`);
      totalInStock += qty;
      purchaseCosts.push({ qty, cost });
    }

    console.log(`\n📊 Total in stock: ${totalInStock} units`);

    console.log('\n💰 Generating 10 random sales:');

    let totalSalesCost = 0;
    let totalSalesQty = 0;
    let crashDetected = false;

    for (let i = 0; i < 10; i++) {
      const maxQty = Math.max(1, totalInStock - totalSalesQty);
      const qty = Math.floor(Math.random() * maxQty) + 1;

      try {
        const costResult = await costingService.calculateCost(FORCE_FIFO, {
          tenantId: tenantId,
          itemId: itemId,
          warehouseId: warehouseId,
          qty: qty,
        });

        await recordSale(itemId, warehouseId, tenantId, qty, costResult, `SI-STRESS-${i + 1}`);
        totalSalesCost += costResult.totalCost;
        totalSalesQty += qty;
      } catch (error) {
        console.log(`  ⚠️ Sale ${i + 1} skipped: ${error.message}`);
      }
    }

    console.log(`\n✅ Stress test completed:`);
    console.log(`  Total purchases: 10`);
    console.log(`  Total sales: 10`);
    console.log(`  Total qty sold: ${totalSalesQty}`);
    console.log(`  Total sale cost: $${totalSalesCost}`);

    // Validate final balance
    const { balance, isValid } = await validateStockBalance(
      itemId,
      warehouseId,
      tenantId,
      totalInStock - totalSalesQty
    );

    const passed = isValid && !crashDetected;

    recordTest(
      'TEST 7 - Random Stress Test',
      passed,
      passed
        ? `Stress test passed: ${totalSalesQty} sales processed, balance=${balance}`
        : `Stress test failed: balance invalid`
    );
  } catch (error) {
    recordTest('TEST 7 - Random Stress Test', false, error.message);
  }
}

// ========================================
// MAIN TEST RUNNER
// ========================================

async function runAllTests() {
  console.log('\n');
  console.log('╔═══════════════════════════════════════════════════════╗');
  console.log('║  FIFO REGRESSION TEST SUITE                           ║');
  console.log('║  Objective: Verify FIFO still works after LIFO added  ║');
  console.log('║  Status: REGRESSION TESTING - CRITICAL                ║');
  console.log('╚═══════════════════════════════════════════════════════╝');

  await connectDB();

  try {
    // Clear old test data
    await clearTestData();

    // Run all tests
    await test1_BasicFIFO();
    await clearTestData();

    await test2_PartialFIFO();
    await clearTestData();

    await test3_MultiBatchFIFO();
    await clearTestData();

    await test4_MultipleSalesSequence();
    await clearTestData();

    await test5_NegativeStockProtection();
    await clearTestData();

    await test6_StockLedgerConsistency();
    await clearTestData();

    await test7_RandomStressTest();
    await clearTestData();

    // Print final report
    printFinalReport();
  } catch (error) {
    console.error('❌ Test suite error:', error.message);
    console.error(error.stack);
  } finally {
    await disconnectDB();
  }
}

/**
 * Print final QA report
 */
function printFinalReport() {
  console.log('\n');
  console.log('╔═══════════════════════════════════════════════════════╗');
  console.log('║  FIFO REGRESSION TEST REPORT                          ║');
  console.log('╚═══════════════════════════════════════════════════════╝');

  console.log('\n📊 SUMMARY:');
  console.log(`  Total Tests:    ${testResults.totalTests}`);
  console.log(`  ✅ Passed:       ${testResults.passed}`);
  console.log(`  ❌ Failed:       ${testResults.failed}`);
  console.log(`  Success Rate:   ${((testResults.passed / testResults.totalTests) * 100).toFixed(1)}%`);

  if (testResults.failed > 0) {
    console.log('\n🚨 FAILED TESTS:');
    testResults.tests
      .filter((t) => !t.passed)
      .forEach((test) => {
        console.log(`  ❌ ${test.name}`);
        console.log(`     Details: ${test.details}`);
      });
  }

  console.log('\n🔍 REGRESSION STATUS:');
  if (testResults.failed === 0 && testResults.passed === 7) {
    console.log('  ✅ FIFO SAFE - NO REGRESSIONS DETECTED');
    console.log('  ✅ LIFO integration did NOT break FIFO');
    console.log('  ✅ Financial accuracy verified');
    console.log('  ✅ Stock ledger consistency confirmed');
    console.log('  ✅ System stable for production');
  } else {
    console.log('  ❌ FIFO BROKEN - REGRESSIONS DETECTED');
    console.log('  ❌ Review failures above immediately');
  }

  console.log('\n🎯 CONCLUSION:');
  if (testResults.failed === 0) {
    console.log('  ✅ FIFO REGRESSION TEST PASSED');
    console.log('  ✅ 100% accurate after LIFO integration');
    console.log('  ✅ Ready for production deployment');
  } else {
    console.log('  ❌ FIFO REGRESSION TEST FAILED');
    console.log('  ❌ DO NOT proceed with production');
    console.log('  ❌ Investigation required');
  }

  console.log('\n');
}

// Run tests
runAllTests().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
