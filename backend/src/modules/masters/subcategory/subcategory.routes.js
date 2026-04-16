const express = require('express');
const router = express.Router();
const SubCategoryController = require('./subcategory.controller');
const authMiddleware = require('../../../middleware/auth.middleware');

// All routes require authentication
router.use(authMiddleware);

/**
 * POST /sub-categories
 * Create a new sub-category
 */
router.post('/', SubCategoryController.createSubCategory);

/**
 * GET /sub-categories
 * List all sub-categories for tenant (optionally filtered by categoryId)
 */
router.get('/', SubCategoryController.listSubCategories);

/**
 * GET /sub-categories/:subCategoryId
 * Get single sub-category with category details
 */
router.get('/:subCategoryId', SubCategoryController.getSubCategory);

/**
 * PUT /sub-categories/:subCategoryId
 * Update sub-category
 */
router.put('/:subCategoryId', SubCategoryController.updateSubCategory);

/**
 * DELETE /sub-categories/:subCategoryId
 * Delete (soft delete) sub-category
 */
router.delete('/:subCategoryId', SubCategoryController.deleteSubCategory);

module.exports = router;
