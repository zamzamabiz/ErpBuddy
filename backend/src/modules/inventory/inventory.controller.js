const inventoryService = require('./inventory.service');

class InventoryController {
  /**
   * POST /api/inventory
   * Create inventory entry (stock movement)
   */
  static async createInventoryEntry(req, res) {
    try {
      const tenantId = req.headers['x-tenant-id'];

      if (!tenantId) {
        return res
          .status(400)
          .json({ message: 'Tenant ID header is required' });
      }

      const { itemId, batchNo, subLotNo, quantity, unit, transactionType, referenceType, referenceId, date, notes } =
        req.body;

      // Create entry
      const entry = await inventoryService.createEntry(
        {
          itemId,
          batchNo,
          subLotNo,
          quantity,
          unit,
          transactionType,
          referenceType,
          referenceId,
          date,
          notes,
        },
        tenantId
      );

      return res
        .status(201)
        .json({
          message: 'Stock movement created successfully',
          data: entry,
        });
    } catch (error) {
      console.error('❌ Create inventory entry error:', error);
      return res
        .status(400)
        .json({ message: error.message });
    }
  }

  /**
   * GET /api/inventory/stock/:itemId
   * Get current stock for an item
   */
  static async getItemStock(req, res) {
    try {
      const tenantId = req.headers['x-tenant-id'];
      const { itemId } = req.params;

      if (!tenantId) {
        return res
          .status(400)
          .json({ message: 'Tenant ID header is required' });
      }

      if (!itemId) {
        return res
          .status(400)
          .json({ message: 'Item ID is required' });
      }

      const stock = await inventoryService.getStockByItem(itemId, tenantId);

      return res
        .status(200)
        .json({
          message: 'Stock retrieved successfully',
          data: stock,
        });
    } catch (error) {
      console.error('❌ Get item stock error:', error);
      return res
        .status(400)
        .json({ message: error.message });
    }
  }

  /**
   * GET /api/inventory/stock/:itemId/batch/:batchNo
   * Get current stock for an item + specific batch
   */
  static async getItemBatchStock(req, res) {
    try {
      const tenantId = req.headers['x-tenant-id'];
      const { itemId, batchNo } = req.params;

      if (!tenantId) {
        return res
          .status(400)
          .json({ message: 'Tenant ID header is required' });
      }

      if (!itemId) {
        return res
          .status(400)
          .json({ message: 'Item ID is required' });
      }

      const batchStock = await inventoryService.getStockByItemAndBatch(
        itemId,
        batchNo || null,
        tenantId
      );

      return res
        .status(200)
        .json({
          message: 'Batch stock retrieved successfully',
          data: batchStock,
        });
    } catch (error) {
      console.error('❌ Get batch stock error:', error);
      return res
        .status(400)
        .json({ message: error.message });
    }
  }

  /**
   * GET /api/inventory/ledger/:itemId
   * Get full inventory ledger (movement history)
   */
  static async getInventoryLedger(req, res) {
    try {
      const tenantId = req.headers['x-tenant-id'];
      const { itemId } = req.params;

      if (!tenantId) {
        return res
          .status(400)
          .json({ message: 'Tenant ID header is required' });
      }

      if (!itemId) {
        return res
          .status(400)
          .json({ message: 'Item ID is required' });
      }

      const ledger = await inventoryService.getInventoryLedger(
        itemId,
        tenantId
      );

      return res
        .status(200)
        .json({
          message: 'Inventory ledger retrieved successfully',
          data: ledger,
        });
    } catch (error) {
      console.error('❌ Get inventory ledger error:', error);
      return res
        .status(400)
        .json({ message: error.message });
    }
  }

  /**
   * GET /api/inventory/batches/:itemId
   * Get all batches for an item with their stock levels
   * CRITICAL FOR INVOICE: Shows available batches to select during invoicing
   */
  static async getAvailableBatches(req, res) {
    try {
      const tenantId = req.headers['x-tenant-id'];
      const { itemId } = req.params;

      if (!tenantId) {
        return res
          .status(400)
          .json({ message: 'Tenant ID header is required' });
      }

      if (!itemId) {
        return res
          .status(400)
          .json({ message: 'Item ID is required' });
      }

      const batches = await inventoryService.getBatchesForItem(
        itemId,
        tenantId
      );

      return res
        .status(200)
        .json({
          message: 'Available batches retrieved successfully',
          data: batches,
        });
    } catch (error) {
      console.error('❌ Get available batches error:', error);
      return res
        .status(400)
        .json({ message: error.message });
    }
  }
}

module.exports = InventoryController;
