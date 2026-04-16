const express = require('express');
const router = express.Router();
const CategoryController = require('./category.controller');
const authMiddleware = require('../../../middleware/auth.middleware');

// All routes require authentication
router.use(authMiddleware);

/**
 * POST /categories
 * Create a new category
 */
router.post('/', CategoryController.createCategory);

/**
 * GET /categories
 * List all categories for tenant
 */
router.get('/', CategoryController.listCategories);

/**
 * GET /categories/:categoryId
 * Get single category
 */
router.get('/:categoryId', CategoryController.getCategory);

/**
 * PUT /categories/:categoryId
 * Update category
 */
router.put('/:categoryId', CategoryController.updateCategory);

/**
 * DELETE /categories/:categoryId
 * Delete (soft delete) category
 */
router.delete('/:categoryId', CategoryController.deleteCategory);

module.exports = router;
