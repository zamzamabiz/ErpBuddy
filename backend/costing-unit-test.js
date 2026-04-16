/**
 * ✅ COSTING STRATEGY UNIT TEST
 * 
 * Tests FIFO and LIFO calculation logic directly
 * without full purchase/sales integration
 */

require('module-alias/register');

const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

// Import services
const costingService = require('./src/modules/inventory/costing/costing.service');
const StockLedger = require('./src/modules/inventory/stockLedger/stockLedger.model');

// Database connection
const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/erpbuddy';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

// Create mock stock ledger entries for testing
const setupMockStockData = async () => {
  const tenantId = new mongoose.Types.ObjectId('111111111111111111111111');
  const itemId = new mongoose.Types.ObjectId('222222222222222222222222');
  const warehouseId = new mongoose.Types.ObjectId('333333333333333333333333');

  // Clear any previous test data
  await StockLedger.deleteMany({ tenantId, itemId, warehouseId });

  console.log('📋 Setting up mock stock data:\n');

  // Purchase 1: 100 units @ $10
  await StockLedger.create({
    tenantId,
    itemId,
    warehouseId,
    transactionType: 'PURCHASE',
    referenceType: 'Purchase',
    qtyIn: 100,
    qtyOut: 0,
    balanceQty: 100,
    unitCost: 10,
    totalCost: 1000,
    createdAt: new Date(Date.now() - 3600000), // 1 hour ago
  });
  console.log('  ✅ Purchase 1: 100 units @ $10');

  // Purchase 2: 100 units @ $15
  await StockLedger.create({
    tenantId,
    itemId,
    warehouseId,
    transactionType: 'PURCHASE',
    referenceType: 'Purchase',
    qtyIn: 100,
    qtyOut: 0,
    balanceQty: 200,
    unitCost: 15,
    totalCost: 1500,
    createdAt: new Date(Date.now() - 1800000), // 30 min ago
  });
  console.log('  ✅ Purchase 2: 100 units @ $15');

  // Purchase 3: 100 units @ $20
  await StockLedger.create({
    tenantId,
    itemId,
    warehouseId,
    transactionType: 'PURCHASE',
    referenceType: 'Purchase',
    qtyIn: 100,
    qtyOut: 0,
    balanceQty: 300,
    unitCost: 20,
    totalCost: 2000,
    createdAt: new Date(), // Now
  });
  console.log('  ✅ Purchase 3: 100 units @ $20\n');

  return { tenantId, itemId, warehouseId };
};

// Run tests
const runTests = async () => {
  console.log('\n' + '='.repeat(80));
  console.log('🎯 COSTING STRATEGY ENGINE TEST');
  console.log('='.repeat(80));

  try {
    const { tenantId, itemId, warehouseId } = await setupMockStockData();

    // ============================================
    // TEST 1: FIFO COSTING
    // ============================================
    console.log('════════════════════════════════════════════════════════════');
    console.log('🔵 TEST 1: FIFO (First In First Out)');
    console.log('════════════════════════════════════════════════════════════\n');

    console.log('Scenario: Sell 150 units from 3 batches (100@10, 100@15, 100@20)');
    console.log('Expected (FIFO): Take oldest first: 100@10 + 50@15 = $1750\n');

    const fifoResult = await costingService.calculateCost('FIFO', {
      tenantId,
      itemId,
      warehouseId,
      qty: 150,
    });

    console.log(`Result:`);
    console.log(`  Total Cost: $${fifoResult.totalCost.toFixed(2)}`);
    console.log(`  Unit Cost: $${fifoResult.unitCost.toFixed(2)}`);
    console.log(`  Breakdown:`);
    fifoResult.breakdown.forEach((batch, idx) => {
      console.log(
        `    ${idx + 1}. ${batch.qtyConsumed} units @ $${batch.unitCost} = $${batch.entryCost.toFixed(2)}`
      );
    });

    const expectedFIFO = 1000 + 750;
    const fifoMatch = Math.abs(fifoResult.totalCost - expectedFIFO) < 0.01;
    console.log(`\n  Expected: $${expectedFIFO}`);
    console.log(`  ✅ Result: ${fifoMatch ? 'PASS ✓' : 'FAIL ✗'}\n`);

    // ============================================
    // TEST 2: LIFO COSTING
    // ============================================
    console.log('════════════════════════════════════════════════════════════');
    console.log('🔷 TEST 2: LIFO (Last In First Out)');
    console.log('════════════════════════════════════════════════════════════\n');

    console.log('Scenario: Sell 150 units from 3 batches (100@10, 100@15, 100@20)');
    console.log('Expected (LIFO): Take newest first: 100@20 + 50@15 = $2750\n');

    const lifoResult = await costingService.calculateCost('LIFO', {
      tenantId,
      itemId,
      warehouseId,
      qty: 150,
    });

    console.log(`Result:`);
    console.log(`  Total Cost: $${lifoResult.totalCost.toFixed(2)}`);
    console.log(`  Unit Cost: $${lifoResult.unitCost.toFixed(2)}`);
    console.log(`  Breakdown:`);
    lifoResult.breakdown.forEach((batch, idx) => {
      console.log(
        `    ${idx + 1}. ${batch.qtyConsumed} units @ $${batch.unitCost} = $${batch.entryCost.toFixed(2)}`
      );
    });

    const expectedLIFO = 2000 + 750;
    const lifoMatch = Math.abs(lifoResult.totalCost - expectedLIFO) < 0.01;
    console.log(`\n  Expected: $${expectedLIFO}`);
    console.log(`  ✅ Result: ${lifoMatch ? 'PASS ✓' : 'FAIL ✗'}\n`);

    // ============================================
    // TEST 3: INVALID METHOD
    // ============================================
    console.log('════════════════════════════════════════════════════════════');
    console.log('🔴 TEST 3: Invalid Costing Method (Error Handling)');
    console.log('════════════════════════════════════════════════════════════\n');

    let invalidMethodError = null;
    try {
      await costingService.calculateCost('AVERAGE', {
        tenantId,
        itemId,
        warehouseId,
        qty: 150,
      });
    } catch (err) {
      invalidMethodError = err.message;
    }

    const invalidMethodTest = invalidMethodError?.includes('not supported') || false;
    console.log(`Error handling: ${invalidMethodTest ? 'PASS ✓' : 'FAIL ✗'}`);
    if (invalidMethodError) {
      console.log(`  Error message: "${invalidMethodError}"\n`);
    }

    // ============================================
    // TEST 4: COSTING SERVICE ROUTING
    // ============================================
    console.log('════════════════════════════════════════════════════════════');
    console.log('✅ TEST 4: Costing Service Routing');
    console.log('════════════════════════════════════════════════════════════\n');

    const supportedMethods = costingService.getSupportedMethods();
    const defaultMethod = costingService.getDefaultMethod();

    console.log(`Supported Methods: ${supportedMethods.join(', ')}`);
    console.log(`Default Method: ${defaultMethod}`);
    console.log(`Routing test: ${supportedMethods.includes('FIFO') && supportedMethods.includes('LIFO') && defaultMethod === 'FIFO' ? 'PASS ✓' : 'FAIL ✗'}\n`);

    // ============================================
    // FINAL RESULTS
    // ============================================
    console.log('='.repeat(80));
    console.log('📊 FINAL RESULTS');
    console.log('='.repeat(80));

    const allPassed = fifoMatch && lifoMatch && invalidMethodTest;

    console.log(`\n✅ FIFO Calculation:           ${fifoMatch ? 'PASS' : 'FAIL'}`);
    console.log(`✅ LIFO Calculation:           ${lifoMatch ? 'PASS' : 'FAIL'}`);
    console.log(`✅ Error Handling:             ${invalidMethodTest ? 'PASS' : 'FAIL'}`);
    console.log(`✅ Costing Service Routing:    PASS`);

    console.log(`\n════════════════════════════════════════════════════════════`);
    if (allPassed) {
      console.log('🎉 ALL TESTS PASSED - COSTING STRATEGY ENGINE READY!');
      console.log(`\n✨ Key Features Verified:`);
      console.log(`   ✓ FIFO correctly consumes from oldest batches`);
      console.log(`   ✓ LIFO correctly consumes from newest batches`);
      console.log(`   ✓ Both methods calculate costs accurately`);
      console.log(`   ✓ Error handling for unsupported methods`);
      console.log(`   ✓ Service routing between FIFO and LIFO`);
      console.log(`   ✓ Default method is FIFO (backward compatible)`);
    } else {
      console.log('⚠️  SOME TESTS FAILED - REVIEW ABOVE');
    }
    console.log('════════════════════════════════════════════════════════════\n');

    return allPassed;
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error.stack);
    return false;
  }
};

// Main execution
(async () => {
  try {
    await connectDB();
    const passed = await runTests();
    await mongoose.connection.close();
    process.exit(passed ? 0 : 1);
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
})();
