const StockLedger = require('../stockLedger/stockLedger.model');

/**
 * ✅ FIFO (First In First Out) COSTING ENGINE
 * 
 * Calculates Cost of Goods Sold (COGS) using FIFO method:
 * - Oldest stock consumed first
 * - Calculates weighted average cost per unit
 * - Respects tenant & warehouse isolation
 */
class FIFOService {
  /**
   * Calculate COGS using FIFO method
   * 
   * @param {Object} params
   * @param {ObjectId} params.tenantId - Tenant ID
   * @param {ObjectId} params.itemId - Item ID
   * @param {ObjectId} params.warehouseId - Warehouse ID
   * @param {Number} params.qty - Quantity to consume
   * 
   * @returns {Object} { totalCost, unitCost, breakdown }
   * 
   * @throws Error if insufficient stock or calculation fails
   */
  async calculateFIFO({ tenantId, itemId, warehouseId, qty }) {
    console.log(`\n🔵 FIFO: Calculating COGS for Item=${itemId}, Qty=${qty}`);

    if (!tenantId || !itemId || !warehouseId || !qty) {
      throw new Error('Missing required parameters for FIFO calculation');
    }

    if (qty <= 0) {
      throw new Error('Quantity must be greater than 0');
    }

    try {
      // ✅ STEP 1: Fetch ALL stock ledger entries for this item/warehouse
      // Stock ledger is immutable: Purchase creates qtyIn, Sale creates qtyOut
      // We need to aggregate to find per-batch available quantity
      const allLedgerEntries = await StockLedger.find({
        tenantId,
        itemId,
        warehouseId,
      })
        .sort({ createdAt: 1 }) // Oldest first (FIFO principle)
        .lean();

      console.log(`  📊 Found ${allLedgerEntries.length} total stock ledger entries`);

      if (allLedgerEntries.length === 0) {
        throw new Error('No stock entries found for FIFO calculation');
      }

      // ✅ STEP 1B: Extract all purchase batches (entries with qtyIn > 0)
      const stockBatches = [];
      let runningBalance = 0;

      for (const entry of allLedgerEntries) {
        // Track overall balance
        runningBalance += entry.qtyIn - entry.qtyOut;

        // Collect purchase batches
        if (entry.qtyIn > 0) {
          stockBatches.push({
            ledgerId: entry._id,
            qtyIn: entry.qtyIn,
            createdAt: entry.createdAt,
            unitCost: entry.unitCost,
          });
        }
      }

      console.log(`  🏭 Found ${stockBatches.length} purchase batches for FIFO`);

      // ✅ STEP 1C: Calculate remaining qty for each batch using FIFO logic
      // FIFO: Consumption happens from oldest batch first
      // For each batch, calculate how much of it remains after all sales consuming it
      let batchIdx = 0;
      let qtyShortfall = 0; // Tracks how much of current batch was consumed

      for (const entry of allLedgerEntries) {
        if (entry.qtyOut > 0 && batchIdx < stockBatches.length) {
          // This sale entry consumes from current batch (+ shortfall from prior)
          qtyShortfall += entry.qtyOut;

          // Move to next batch if current one is exhausted
          while (batchIdx < stockBatches.length && qtyShortfall >= stockBatches[batchIdx].qtyIn) {
            qtyShortfall -= stockBatches[batchIdx].qtyIn;
            batchIdx++;
          }
        }
      }

      // Now set batchRemainingQty for each batch
      // Re-calculate from scratch with the correct logic
      batchIdx = 0;
      let currentBatchConsumed = 0;

      for (const entry of allLedgerEntries) {
        if (entry.qtyOut > 0) {
          // This sale consumes from batches
          let remainingFromSale = entry.qtyOut;

          while (remainingFromSale > 0 && batchIdx < stockBatches.length) {
            const batch = stockBatches[batchIdx];
            const availableInBatch = batch.qtyIn - (stockBatches[batchIdx] === batch ? currentBatchConsumed : 0);
            const consumeFromBatch = Math.min(availableInBatch, remainingFromSale);

            if (batchIdx < stockBatches.length && stockBatches[batchIdx] === batch) {
              currentBatchConsumed += consumeFromBatch;
            }

            remainingFromSale -= consumeFromBatch;

            if (currentBatchConsumed >= batch.qtyIn) {
              batchIdx++;
              currentBatchConsumed = 0;
            }
          }
        }
      }

      // Final pass: Calculate actual remaining for each batch based on FIFO order
      batchIdx = 0;
      currentBatchConsumed = 0;

      for (const entry of allLedgerEntries) {
        if (entry.qtyOut > 0) {
          let toConsume = entry.qtyOut;
          while (toConsume > 0 && batchIdx < stockBatches.length) {
            const availToConsume = stockBatches[batchIdx].qtyIn - currentBatchConsumed;
            const consumed = Math.min(availToConsume, toConsume);
            currentBatchConsumed += consumed;
            toConsume -= consumed;

            if (currentBatchConsumed >= stockBatches[batchIdx].qtyIn) {
              batchIdx++;
              currentBatchConsumed = 0;
            }
          }
        }
      }

      // Set final batchRemainingQty
      for (let i = 0; i < stockBatches.length; i++) {
        if (i < batchIdx) {
          stockBatches[i].batchRemainingQty = 0;
        } else if (i === batchIdx) {
          stockBatches[i].batchRemainingQty = stockBatches[i].qtyIn - currentBatchConsumed;
        } else {
          stockBatches[i].batchRemainingQty = stockBatches[i].qtyIn;
        }
      }

      // 🔴 BUG FIX #1: VALIDATE TOTAL AVAILABLE STOCK UPFRONT
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

      // ✅ STEP 2: Loop through batches and consume from oldest to newest
      let remainingQty = qty;
      let totalCost = 0;
      const breakdown = [];

      for (const batch of stockBatches) {
        if (remainingQty <= 0) break;

        // 🔴 BUG FIX #2: USE ACTUAL BATCH REMAINING QTY (already calculated)
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
          qtyOut: batch.qtyOut,
          batchRemainingQty,
          qtyConsumed: consumedQty,
          unitCost: batch.unitCost,
          entryCost,
          createdAt: batch.createdAt,
        });

        console.log(
          `  📦 Batch[${breakdown.length}]: Available=${batchRemainingQty}, Consumed=${consumedQty} @ ${batch.unitCost} = ${entryCost}`
        );
      }

      // ✅ STEP 3: Verify all quantity consumed (double-check after upfront validation)
      if (remainingQty > 0) {
        console.error(
          `  ❌ FIFO Loop failed: ${remainingQty} units still remaining`
        );
        throw new Error(
          `FIFO processing error: ${remainingQty} units could not be consumed`
        );
      }

      // ✅ STEP 4: Calculate weighted average unit cost
      const unitCost = totalCost / qty;

      console.log(`  ✅ FIFO Complete: TotalCost=${totalCost}, UnitCost=${unitCost}`);

      return {
        totalCost,
        unitCost,
        breakdown,
        method: 'FIFO',
      };
    } catch (error) {
      console.error(`  ❌ FIFO calculation failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get current stock balance for an item
   * Uses latest stock ledger entry
   * 
   * @param {ObjectId} tenantId
   * @param {ObjectId} itemId
   * @param {ObjectId} warehouseId
   * @returns {Number} Current stock quantity
   */
  async getCurrentStock(tenantId, itemId, warehouseId) {
    const lastEntry = await StockLedger.findOne({
      tenantId,
      itemId,
      warehouseId,
    })
      .sort({ createdAt: -1 })
      .lean();

    return lastEntry ? lastEntry.balanceQty : 0;
  }

  /**
   * Validate stock availability before COGS calculation
   * 
   * @param {ObjectId} tenantId
   * @param {ObjectId} itemId
   * @param {ObjectId} warehouseId
   * @param {Number} requiredQty
   * @returns {Boolean}
   */
  async validateStockAvailability(tenantId, itemId, warehouseId, requiredQty) {
    const currentStock = await this.getCurrentStock(
      tenantId,
      itemId,
      warehouseId
    );
    return currentStock >= requiredQty;
  }
}

module.exports = new FIFOService();
