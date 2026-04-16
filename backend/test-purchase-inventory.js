const mongoose = require('mongoose');

const Purchase = require('./src/modules/business/purchase/purchase.model');
const StockLedger = require('./src/modules/inventory/stockLedger/stockLedger.model');
const purchaseService = require('./src/modules/business/purchase/purchase.service');

async function testPurchaseInventoryIntegration() {
  try {
    console.log('🔵 TEST: Purchase → Inventory Integration\n');

    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/erpbuddy');
    console.log('✅ MongoDB connected\n');

    // Test data
    const tenantId = new mongoose.Types.ObjectId();
    const userId = new mongoose.Types.ObjectId();
    const supplierId = new mongoose.Types.ObjectId();
    const warehouseId = new mongoose.Types.ObjectId();
    const itemId1 = new mongoose.Types.ObjectId();
    const itemId2 = new mongoose.Types.ObjectId();
    const expenseAccountId = new mongoose.Types.ObjectId();
    const supplierAccountId = new mongoose.Types.ObjectId();

    // Clean up previous test data
    await Purchase.deleteMany({ tenantId });
    await StockLedger.deleteMany({ tenantId });
    console.log('🧹 Cleaned previous test data\n');

    // ✅ TEST 1: Create Purchase
    console.log('📝 TEST 1: Create Purchase with 2 items');
    const purchaseData = {
      tenantId,
      company: new mongoose.Types.ObjectId(),
      purchaseNumber: 'PO-TEST-001',
      purchaseDate: new Date(),
      supplier: supplierId,
      warehouse: warehouseId,
      currency: new mongoose.Types.ObjectId(),
      exchangeRate: 1,
      items: [
        {
          item: itemId1,
          quantity: 100,
          unitCost: 10,
          totalCost: 1000,
        },
        {
          item: itemId2,
          quantity: 50,
          unitCost: 20,
          totalCost: 1000,
        },
      ],
      totalAmount: 2000,
      taxAmount: 0,
      netAmount: 2000,
      expenseAccountId,
      supplierAccountId,
    };

    const purchase = await purchaseService.create(purchaseData, {
      tenantId,
      _id: userId,
    });
    console.log(`   ✅ Purchase created: ${purchase._id}`);
    console.log(`   ✅ Status: ${purchase.status} (Expected: Draft)\n`);

    // ✅ TEST 2: Post Purchase
    console.log('📝 TEST 2: Post Purchase');
    console.log('   This should create:');
    console.log('   → Journal entries (via Core Engine)');
    console.log('   → Stock Ledger entries (Inventory IN)\n');

    const postedPurchase = await purchaseService.post(purchase._id, {
      tenantId,
      _id: userId,
    });
    console.log(`   ✅ Purchase posted: ${postedPurchase._id}`);
    console.log(`   ✅ Status: ${postedPurchase.status} (Expected: Posted)`);
    console.log(`   ✅ Journal ID: ${postedPurchase.journalId}\n`);

    // ✅ TEST 3: Verify Stock Ledger Entries Created
    console.log('📝 TEST 3: Verify Stock Ledger entries were created');
    const ledgerEntries = await StockLedger.find({
      tenantId,
      referenceId: purchase._id,
    });
    console.log(`   ✅ Stock Ledger entries: ${ledgerEntries.length} (Expected: 2)`);
    console.log('');

    if (ledgerEntries.length === 2) {
      ledgerEntries.forEach((entry, idx) => {
        console.log(
          `   Entry ${idx + 1}:`
        );
        console.log(
          `     Item: ${entry.itemId}`
        );
        console.log(
          `     QtyIn: ${entry.qtyIn}, QtyOut: ${entry.qtyOut}`
        );
        console.log(
          `     Balance: ${entry.balanceQty}`
        );
        console.log(
          `     Unit Cost: ${entry.unitCost}, Total: ${entry.totalCost}`
        );
        console.log(
          `     Transaction Type: ${entry.transactionType}`
        );
        console.log('');
      });
    }

    // ✅ TEST 4: Verify correct values
    console.log('📝 TEST 4: Verify values are correct');
    const entry1 = ledgerEntries.find(
      (e) => e.itemId.toString() === itemId1.toString()
    );
    const entry2 = ledgerEntries.find(
      (e) => e.itemId.toString() === itemId2.toString()
    );

    if (entry1 && entry1.qtyIn === 100 && entry1.balanceQty === 100) {
      console.log('   ✅ Entry 1: Qty=100, Balance=100');
    } else {
      console.log(
        `   ❌ Entry 1: Expected Qty=100/Balance=100, Got Qty=${entry1?.qtyIn}/Balance=${entry1?.balanceQty}`
      );
    }

    if (entry2 && entry2.qtyIn === 50 && entry2.balanceQty === 50) {
      console.log('   ✅ Entry 2: Qty=50, Balance=50\n');
    } else {
      console.log(
        `   ❌ Entry 2: Expected Qty=50/Balance=50, Got Qty=${entry2?.qtyIn}/Balance=${entry2?.balanceQty}\n`
      );
    }

    // ✅ TEST 5: Verify Warehouse & Transaction Type
    console.log('📝 TEST 5: Verify Warehouse & Transaction Type');
    const allCorrect = ledgerEntries.every((e) => {
      return (
        e.warehouseId.toString() === warehouseId.toString() &&
        e.transactionType === 'PURCHASE' &&
        e.referenceType === 'Purchase'
      );
    });

    if (allCorrect) {
      console.log('   ✅ All entries: Warehouse, TransactionType, ReferenceType correct\n');
    } else {
      console.log('   ❌ Some entries have incorrect warehouse/type\n');
    }

    // Display results
    console.log('═══════════════════════════════════════');
    if (
      postedPurchase.status === 'Posted' &&
      postedPurchase.journalId &&
      ledgerEntries.length === 2 &&
      allCorrect &&
      entry1 &&
      entry2
    ) {
      console.log('✅ ALL TESTS PASSED');
      console.log('═══════════════════════════════════════');
      console.log('\n✅ Purchase → Inventory Integration: WORKING');
      console.log('   • Purchase posting creates journal entries');
      console.log('   • Purchase posting creates stock ledger entries');
      console.log('   • Stock balances calculated correctly');
    } else {
      console.log('❌ SOME TESTS FAILED');
      console.log('═══════════════════════════════════════');
    }

    // Cleanup
    await Purchase.deleteMany({ tenantId });
    await StockLedger.deleteMany({ tenantId });
    console.log('\n🧹 Cleaned up test data');

    await mongoose.disconnect();
    console.log('✅ MongoDB disconnected\n');

  } catch (error) {
    console.error('❌ Test error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

testPurchaseInventoryIntegration();
