const StockLedger = require('../stockLedger/stockLedger.model');

/**
 * ✅ LIFO (Last In First Out) COSTING ENGINE
 * 
 * Calculates Cost of Goods Sold (COGS) using LIFO method:
 * - Newest stock consumed first (reverse of FIFO)
 * - Calculates weighted average cost per unit
 * - Respects tenant & warehouse isolation
 */
class LIFOService {
  /**
   * Calculate COGS using LIFO method
   * 
   * @param {Object} params
   * @param {ObjectId} params.tenantId - Tenant ID
   * @param {ObjectId} params.itemId - Item ID
   * @param {ObjectId} params.warehouseId - Warehouse ID
   * @param {Number} params.qty - Quantity to consume
   * 
   * @returns {Object} { totalCost, unitCost, breakdown, method }
   * 
   * @throws Error if insufficient stock or calculation fails
   */
  async calculateLIFO({ tenantId, itemId, warehouseId, qty }) {
    console.log(`\n🔷 LIFO: Calculating COGS for Item=${itemId}, Qty=${qty}`);

    if (!tenantId || !itemId || !warehouseId || !qty) {
      throw new Error('Missing required parameters for LIFO calculation');
    }

    if (qty <= 0) {
      throw new Error('Quantity must be greater than 0');
    }

    try {
      // ✅ STEP 1: Fetch ALL stock ledger entries for this item/warehouse
      // Stock ledger is immutable: Purchase creates qtyIn, Sale creates qtyOut
      // LIFO: Sort by newest first (DESC)
      const allLedgerEntries = await StockLedger.find({
        tenantId,
        itemId,
        warehouseId,
      })
        .sort({ createdAt: -1 }) // Newest first (LIFO principle)
        .lean();

      console.log(`  📊 Found ${allLedgerEntries.length} total stock ledger entries`);

      if (allLedgerEntries.length === 0) {
        throw new Error('No stock entries found for LIFO calculation');
      }

      // ✅ STEP 1B: Extract all purchase batches (entries with qtyIn > 0)
      // LIFO fetches DESC (newest first) so we need to reverse for storage
      // so stockBatches[0] = oldest, stockBatches[n] = newest
      const stockBatchesRaw = [];
      let runningBalance = 0;

      for (const entry of allLedgerEntries) {
        // Track overall balance
        runningBalance += entry.qtyIn - entry.qtyOut;

        // Collect purchase batches (in newest-first order currently)
        if (entry.qtyIn > 0) {
          stockBatchesRaw.push({
            ledgerId: entry._id,
            qtyIn: entry.qtyIn,
            createdAt: entry.createdAt,
            unitCost: entry.unitCost,
          });
        }
      }

      // Reverse so stockBatches[0] = oldest for consistent iteration logic
      const stockBatches = stockBatchesRaw.reverse();

      console.log(`  🏭 Found ${stockBatches.length} purchase batches for LIFO (reversed to oldest-first order)`);

      // 🔴 BUG PREVENTION: VALIDATE TOTAL AVAILABLE STOCK UPFRONT
      // Calculate total available stock from running balance
      const totalAvailableStock = runningBalance;

      console.log(`  📦 Total available stock: ${totalAvailableStock} units`);
      console.log(`  📌 Requested quantity: ${qty} units`);

      // CRITICAL: Check insufficient stock BEFORE processing
      if (totalAvailableStock < qty) {
        const shortfall = qty - totalAvailableStock;
        console.error(
          `  ❌ INSUFFICIENT STOCK: Available=${totalAvailableStock}, Requested=${qty}, Short by ${shortfall}`
        );
        throw new Error(
          `Insufficient stock: ${totalAvailableStock} available, ${qty} requested (short by ${shortfall} units)`
        );
      }

      // ✅ STEP 1C: Calculate remaining qty for each batch using LIFO logic
      // LIFO: Consumption happens from newest batch first
      // We need to track which batches get consumed as we process sales

      // Initialize: each batch has no consumption
      for (const batch of stockBatches) {
        batch.consumed = 0;
      }

      console.log(`  📊 Batches in order (oldest to newest):`);
      stockBatches.forEach((b, i) => {
        console.log(`    Batch[${i}]: qtyIn=${b.qtyIn}, unitCost=${b.unitCost}`);
      });

      // Process all sales in chronological order
      // For each sale, consume from newest batch backwards
      for (const entry of allLedgerEntries) {
        if (entry.qtyOut > 0) {
          console.log(`\n  📦 Processing sale: ${entry.qtyOut} units`);
          // Process this sale's qtyOut
          let remainingToConsume = entry.qtyOut;
          
          // Start from newest batch (highest index)
          for (let i = stockBatches.length - 1; i >= 0 && remainingToConsume > 0; i--) {
            const batch = stockBatches[i];
            const availableInBatch = batch.qtyIn - batch.consumed;
            const consumedNow = Math.min(availableInBatch, remainingToConsume);
            
            console.log(`    LIFOConsume[${i}]: available=${availableInBatch}, take=${consumedNow}`);
            batch.consumed += consumedNow;
            remainingToConsume -= consumedNow;
          }
        }
      }

      // Set final batchRemainingQty based on consumption
      for (const batch of stockBatches) {
        batch.batchRemainingQty = batch.qtyIn - batch.consumed;
      }

      console.log(`\n  📊 Final batch state (after LIFO simulation):`);
      stockBatches.forEach((b, i) => {
        console.log(`    Batch[${i}]: consumed=${b.consumed}, remaining=${b.batchRemainingQty}`);
      });

      // ✅ STEP 2: Loop through batches in LIFO order (newest to oldest) and consume
      let remainingQty = qty;
      let totalCost = 0;
      const breakdown = [];

      // Iterate from newest to oldest for LIFO
      for (let i = stockBatches.length - 1; i >= 0; i--) {
        if (remainingQty <= 0) break;

        const batch = stockBatches[i];
        const batchRemainingQty = batch.batchRemainingQty;

        // How much we consume from this batch (minimum of available and needed)
        const consumedQty = Math.min(batchRemainingQty, remainingQty);

        // Cost of consumed quantity
        const entryCost = consumedQty * (batch.unitCost || 0);
        totalCost += entryCost;

        // Reduce remaining quantity
        remainingQty -= consumedQty;

        // Track breakdown for debugging
        breakdown.push({
          ledgerId: batch.ledgerId,
          qtyIn: batch.qtyIn,
          batchRemainingQty,
          qtyConsumed: consumedQty,
          unitCost: batch.unitCost,
          entryCost,
          createdAt: batch.createdAt,
          order: `Batch ${stockBatches.length - i} (newest first)`,
        });

        console.log(
          `  📦 Batch[${breakdown.length}]: Available=${batchRemainingQty}, Consumed=${consumedQty} @ ${batch.unitCost} = ${entryCost}`
        );
      }

      // ✅ STEP 3: Verify all quantity consumed (double-check after upfront validation)
      if (remainingQty > 0) {
        console.error(
          `  ❌ LIFO Loop failed: ${remainingQty} units still remaining`
        );
        throw new Error(
          `LIFO processing error: ${remainingQty} units could not be consumed`
        );
      }

      // ✅ STEP 4: Calculate weighted average unit cost
      const unitCost = totalCost / qty;

      console.log(`  ✅ LIFO Complete: TotalCost=${totalCost}, UnitCost=${unitCost}`);

      return {
        totalCost,
        unitCost,
        breakdown,
        method: 'LIFO',
      };
    } catch (error) {
      console.error(`  ❌ LIFO calculation failed: ${error.message}`);
      throw error;
    }
  }
}

module.exports = new LIFOService();
