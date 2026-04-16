const Inventory = require('./inventory.model');
const Item = require('@modules/item/item.model');

class InventoryService {
  /**
   * Validate Item exists and belongs to tenant
   */
  async validateItem(itemId, tenantId) {
    try {
      const item = await Item.findOne({
        _id: itemId,
        tenantId,
        deletedAt: null,
      });

      if (!item) {
        throw new Error('Invalid item or item does not belong to this tenant');
      }

      return item;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Create inventory entry (stock movement)
   */
  async createEntry(data, tenantId) {
    try {
      // Validate required fields
      if (!data.itemId) {
        throw new Error('Item ID is required');
      }

      if (!data.quantity || data.quantity <= 0) {
        throw new Error('Quantity must be greater than 0');
      }

      if (!data.unit) {
        throw new Error('Unit is required');
      }

      if (!data.transactionType) {
        throw new Error('Transaction type is required');
      }

      // Validate item exists and belongs to tenant
      const item = await this.validateItem(data.itemId, tenantId);

      // Validate unit matches item unit
      if (data.unit !== item.unit) {
        throw new Error(
          `Unit mismatch. Item requires ${item.unit}, got ${data.unit}`
        );
      }

      // Create inventory entry
      const entry = new Inventory({
        itemId: data.itemId,
        batchNo: data.batchNo || null,
        subLotNo: data.subLotNo || null,
        quantity: data.quantity,
        unit: data.unit,
        transactionType: data.transactionType,
        referenceType: data.referenceType || null,
        referenceId: data.referenceId || null,
        date: data.date || new Date(),
        notes: data.notes || null,
        tenantId,
      });

      return await entry.save();
    } catch (error) {
      throw error;
    }
  }

  /**
   * Calculate current stock for an item (per tenant)
   * CRITICAL: Returns total quantity considering all movements
   */
  async getStockByItem(itemId, tenantId) {
    try {
      const item = await this.validateItem(itemId, tenantId);

      // Get all movements for this item
      const movements = await Inventory.find({
        itemId,
        tenantId,
        deletedAt: null,
      }).lean();

      // Calculate stock based on transaction type
      let currentStock = 0;
      movements.forEach((movement) => {
        if (movement.transactionType === 'IN') {
          currentStock += movement.quantity;
        } else if (movement.transactionType === 'OUT') {
          currentStock -= movement.quantity;
        } else if (movement.transactionType === 'ADJUST') {
          // ADJUST entries are signed values (can be +/-)
          currentStock += movement.quantity;
        }
      });

      return {
        itemId,
        itemName: item.name,
        unit: item.unit,
        currentStock,
        totalMovements: movements.length,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get stock by item and batch (for batch tracking)
   * CRITICAL FOR INVOICES: Tracks which batch has which quantity
   */
  async getStockByItemAndBatch(itemId, batchNo, tenantId) {
    try {
      const item = await this.validateItem(itemId, tenantId);

      // Get all movements for this item + batch combination
      const movements = await Inventory.find({
        itemId,
        batchNo: batchNo || null,
        tenantId,
        deletedAt: null,
      }).lean();

      // Calculate stock for this specific batch
      let batchStock = 0;
      movements.forEach((movement) => {
        if (movement.transactionType === 'IN') {
          batchStock += movement.quantity;
        } else if (movement.transactionType === 'OUT') {
          batchStock -= movement.quantity;
        } else if (movement.transactionType === 'ADJUST') {
          batchStock += movement.quantity;
        }
      });

      return {
        itemId,
        batchNo: batchNo || 'NO_BATCH',
        itemName: item.name,
        unit: item.unit,
        batchStock,
        movements: movements.length,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get full inventory ledger (movement history)
   */
  async getInventoryLedger(itemId, tenantId) {
    try {
      const item = await this.validateItem(itemId, tenantId);

      // Get all movements ordered by date
      const movements = await Inventory.find({
        itemId,
        tenantId,
        deletedAt: null,
      })
        .populate('itemId', 'name sku unit')
        .sort({ date: -1 })
        .lean()
        .exec();

      // Build ledger with running balance
      let runningBalance = 0;
      const ledger = movements.reverse().map((movement) => {
        if (movement.transactionType === 'IN') {
          runningBalance += movement.quantity;
        } else if (movement.transactionType === 'OUT') {
          runningBalance -= movement.quantity;
        } else if (movement.transactionType === 'ADJUST') {
          runningBalance += movement.quantity;
        }

        return {
          _id: movement._id,
          date: movement.date,
          transactionType: movement.transactionType,
          referenceType: movement.referenceType,
          batchNo: movement.batchNo,
          quantity: movement.quantity,
          unit: movement.unit,
          balance: runningBalance,
          notes: movement.notes,
          createdAt: movement.createdAt,
        };
      });

      return {
        itemId,
        itemName: item.name,
        totalEntries: ledger.length,
        finalStock: runningBalance,
        ledger,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get all batches for an item with their stock levels
   * CRITICAL FOR INVOICE SELECTION: Shows available batches
   */
  async getBatchesForItem(itemId, tenantId) {
    try {
      const item = await this.validateItem(itemId, tenantId);

      // Get all movements grouped by batch
      const movements = await Inventory.find({
        itemId,
        tenantId,
        deletedAt: null,
      }).lean();

      // Group by batchNo and calculate stock per batch
      const batchMap = new Map();

      movements.forEach((movement) => {
        const batchKey = movement.batchNo || 'NO_BATCH';
        if (!batchMap.has(batchKey)) {
          batchMap.set(batchKey, {
            batchNo: movement.batchNo,
            stock: 0,
            movementCount: 0,
          });
        }

        const batch = batchMap.get(batchKey);

        if (movement.transactionType === 'IN') {
          batch.stock += movement.quantity;
        } else if (movement.transactionType === 'OUT') {
          batch.stock -= movement.quantity;
        } else if (movement.transactionType === 'ADJUST') {
          batch.stock += movement.quantity;
        }

        batch.movementCount += 1;
      });

      // Convert to array and filter out zero-stock batches
      const batches = Array.from(batchMap.values()).filter(
        (batch) => batch.stock > 0
      );

      return {
        itemId,
        itemName: item.name,
        unit: item.unit,
        totalBatches: batches.length,
        batches,
      };
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new InventoryService();
