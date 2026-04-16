const mongoose = require('mongoose');

const StockLedger = require('./src/modules/inventory/stockLedger/stockLedger.model');
const stockLedgerService = require('./src/modules/inventory/stockLedger/stockLedger.service');

async function testStockLedger() {
  try {
    console.log('🔵 TEST: Stock Ledger System\n');

    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/erpbuddy');
    console.log('✅ MongoDB connected\n');

    // Test data (use fake IDs for testing)
    const tenantId = new mongoose.Types.ObjectId();
    const itemId = new mongoose.Types.ObjectId();
    const warehouseId = new mongoose.Types.ObjectId();

    // Clean up any previous test entries
    await StockLedger.deleteMany({
      itemId,
      warehouseId,
    });
    console.log('🧹 Cleaned previous test entries\n');

    // ✅ TEST 1: Insert first entry with qtyIn = 100
    console.log('📝 TEST 1: Insert first entry (qtyIn = 100)');
    const entry1 = await stockLedgerService.createEntry({
      tenantId,
      itemId,
      warehouseId,
      transactionType: 'PURCHASE',
      qtyIn: 100,
      qtyOut: 0,
      unitCost: 10,
      totalCost: 1000,
      transactionDate: new Date(),
    });
    console.log(`   Entry 1 Balance: ${entry1.balanceQty}`);
    console.log(`   ✅ Expected: 100, Got: ${entry1.balanceQty}\n`);

    // ✅ TEST 2: Insert second entry with qtyOut = 20
    console.log('📝 TEST 2: Insert second entry (qtyOut = 20)');
    const entry2 = await stockLedgerService.createEntry({
      tenantId,
      itemId,
      warehouseId,
      transactionType: 'SALE',
      qtyIn: 0,
      qtyOut: 20,
      unitCost: 10,
      totalCost: 200,
      transactionDate: new Date(),
    });
    console.log(`   Entry 2 Balance: ${entry2.balanceQty}`);
    console.log(`   ✅ Expected: 80, Got: ${entry2.balanceQty}\n`);

    // ✅ TEST 3: Get current stock balance
    console.log('📝 TEST 3: Get current stock balance');
    const currentBalance = await stockLedgerService.getStock(itemId, warehouseId);
    console.log(`   Current Balance: ${currentBalance}`);
    console.log(`   ✅ Expected: 80, Got: ${currentBalance}\n`);

    // ✅ TEST 4: Multiple transactions
    console.log('📝 TEST 4: Multiple transactions test');
    const entry3 = await stockLedgerService.createEntry({
      tenantId,
      itemId,
      warehouseId,
      transactionType: 'PURCHASE',
      qtyIn: 50,
      qtyOut: 0,
      transactionDate: new Date(),
    });
    console.log(`   After +50: ${entry3.balanceQty} (Expected: 130)`);

    const entry4 = await stockLedgerService.createEntry({
      tenantId,
      itemId,
      warehouseId,
      transactionType: 'SALE',
      qtyIn: 0,
      qtyOut: 30,
      transactionDate: new Date(),
    });
    console.log(`   After -30: ${entry4.balanceQty} (Expected: 100)\n`);

    // ✅ TEST 5: Verify final balance
    const finalBalance = await stockLedgerService.getStock(itemId, warehouseId);
    console.log('📝 TEST 5: Final verification');
    console.log(`   Final Balance: ${finalBalance}`);
    console.log(`   ✅ Expected: 100, Got: ${finalBalance}\n`);

    // Display results
    console.log('═══════════════════════════════════════');
    if (entry1.balanceQty === 100 && entry2.balanceQty === 80 && finalBalance === 100) {
      console.log('✅ ALL TESTS PASSED');
      console.log('═══════════════════════════════════════');
    } else {
      console.log('❌ SOME TESTS FAILED');
      console.log('═══════════════════════════════════════');
    }

    // Cleanup
    await StockLedger.deleteMany({
      itemId,
      warehouseId,
    });
    console.log('\n🧹 Cleaned up test entries');

    await mongoose.disconnect();
    console.log('✅ MongoDB disconnected\n');

  } catch (error) {
    console.error('❌ Test error:', error.message);
    process.exit(1);
  }
}

testStockLedger();
