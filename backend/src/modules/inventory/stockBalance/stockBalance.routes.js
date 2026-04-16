const express = require('express');
const router = express.Router();
const stockController = require('./stockBalance.controller');
const authMiddleware = require('@middleware/auth.middleware.simple');

// All routes require authentication
router.use(authMiddleware);

/**
 * GET /api/inventory
 * Get all stock balances
 * Query params: ?warehouseId=X&itemId=Y&status=ACTIVE
 */
router.get('/', stockController.getAllStock);

/**
 * GET /api/inventory/warehouse/:warehouseId
 * Get stock for a specific warehouse
 */
router.get('/warehouse/:warehouseId', stockController.getWarehouseStock);

/**
 * GET /api/inventory/item/:itemId
 * Get total stock for a specific item across all warehouses
 */
router.get('/item/:itemId', stockController.getItemTotalStock);

/**
 * GET /api/inventory/low-stock
 * Get low stock items (below reorder level)
 * Query params: ?warehouseId=X (optional)
 */
router.get('/low-stock', stockController.getLowStockItems);

/**
 * POST /api/inventory/check-availability
 * Check if stock is available for an item
 * Body: { itemId, warehouseId, quantity, batchNo }
 */
router.post('/check-availability', stockController.checkAvailability);

/**
 * POST /api/inventory/increase
 * Increase stock (manual adjustment)
 * Body: { itemId, warehouseId, quantity, costPrice, batchNo }
 */
router.post('/increase', stockController.increaseStock);

/**
 * POST /api/inventory/decrease
 * Decrease stock (manual adjustment)
 * Body: { itemId, warehouseId, quantity, batchNo }
 */
router.post('/decrease', stockController.decreaseStock);

module.exports = router;
