const express = require('express');
const ItemController = require('./item.controller');
const authMiddleware = require('../../../middleware/auth.middleware');
const checkPermission = require('../../../middleware/rbac.middleware');

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

/**
 * POST /api/items
 * Create item
 */
router.post(
  '/',
  checkPermission('items', 'create'),
  ItemController.createItem
);

/**
 * GET /api/items
 * List all items
 */
router.get(
  '/',
  checkPermission('items', 'read'),
  ItemController.listItems
);

/**
 * GET /api/items/:itemId
 * Get single item
 */
router.get(
  '/:itemId',
  checkPermission('items', 'read'),
  ItemController.getItem
);

/**
 * GET /api/items/sku/:sku
 * Get item by SKU
 */
router.get(
  '/sku/:sku',
  checkPermission('items', 'read'),
  ItemController.getItemBySku
);

/**
 * PUT /api/items/:itemId
 * Update item
 */
router.put(
  '/:itemId',
  checkPermission('items', 'update'),
  ItemController.updateItem
);

/**
 * DELETE /api/items/:itemId
 * Delete item
 */
router.delete(
  '/:itemId',
  checkPermission('items', 'delete'),
  ItemController.deleteItem
);

/**
 * GET /api/items/category/:categoryId
 * Get items by category
 */
router.get(
  '/category/:categoryId',
  checkPermission('items', 'read'),
  ItemController.getItemsByCategory
);

/**
 * GET /api/items/subcategory/:subCategoryId
 * Get items by sub-category
 */
router.get(
  '/subcategory/:subCategoryId',
  checkPermission('items', 'read'),
  ItemController.getItemsBySubCategory
);

module.exports = router;
