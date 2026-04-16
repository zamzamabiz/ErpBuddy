const express = require('express');
const InventoryController = require('./inventory.controller');
const authMiddleware = require('@middleware/auth.middleware');
const stockBalanceController = require('./stockBalance/stockBalance.controller');

const router = express.Router();

/**
 * POST /api/inventory
 * Create inventory entry (stock movement IN/OUT/ADJUST)
 */
router.post(
  '/',
  authMiddleware,
  InventoryController.createInventoryEntry
);

/**
 * GET /api/inventory/stock/:itemId
 * Get current stock for an item (sum of all movements)
 */
router.get('/stock/:itemId', authMiddleware, InventoryController.getItemStock);

/**
 * GET /api/inventory/stock/:itemId/batch/:batchNo
 * Get current stock for an item + specific batch
 */
router.get(
  '/stock/:itemId/batch/:batchNo',
  authMiddleware,
  InventoryController.getItemBatchStock
);

/**
 * GET /api/inventory/ledger/:itemId
 * Get full inventory ledger (movement history with running balance)
 */
router.get(
  '/ledger/:itemId',
  authMiddleware,
  InventoryController.getInventoryLedger
);

/**
 * GET /api/inventory/batches/:itemId
 * Get all available batches for an item (batch number + stock)
 * CRITICAL FOR INVOICE UI: Shows which batches can be selected
 */
router.get(
  '/batches/:itemId',
  authMiddleware,
  InventoryController.getAvailableBatches
);

// ============================================================
// STOCK BALANCE ROUTES (Real-time Stock Tracking)
// ============================================================

/**
 * GET /api/inventory/stock-balance
 * Get all stock balances (real-time, by warehouse & batch)
 * Query params: ?warehouseId=X&itemId=Y&status=ACTIVE
 */
router.get('/stock-balance', authMiddleware, stockBalanceController.getAllStock);

/**
 * GET /api/inventory/stock-balance/warehouse/:warehouseId
 * Get stock for a specific warehouse
 */
router.get(
  '/stock-balance/warehouse/:warehouseId',
  authMiddleware,
  stockBalanceController.getWarehouseStock
);

/**
 * GET /api/inventory/stock-balance/item/:itemId
 * Get total stock for a specific item across all warehouses
 */
router.get(
  '/stock-balance/item/:itemId',
  authMiddleware,
  stockBalanceController.getItemTotalStock
);

/**
 * GET /api/inventory/stock-balance/low-stock
 * Get low stock items (below reorder level)
 * Query params: ?warehouseId=X (optional)
 */
router.get(
  '/stock-balance/low-stock',
  authMiddleware,
  stockBalanceController.getLowStockItems
);

/**
 * POST /api/inventory/stock-balance/check-availability
 * Check if stock is available for an item
 * Body: { itemId, warehouseId, quantity, batchNo }
 */
router.post(
  '/stock-balance/check-availability',
  authMiddleware,
  stockBalanceController.checkAvailability
);

/**
 * POST /api/inventory/stock-balance/increase
 * Increase stock (manual adjustment)
 * Body: { itemId, warehouseId, quantity, costPrice, batchNo }
 */
router.post(
  '/stock-balance/increase',
  authMiddleware,
  stockBalanceController.increaseStock
);

/**
 * POST /api/inventory/stock-balance/decrease
 * Decrease stock (manual adjustment)
 * Body: { itemId, warehouseId, quantity, batchNo }
 */
router.post(
  '/stock-balance/decrease',
  authMiddleware,
  stockBalanceController.decreaseStock
);

module.exports = router;
