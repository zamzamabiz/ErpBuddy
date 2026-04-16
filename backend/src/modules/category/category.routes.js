const express = require('express');
const router = express.Router();
const categoryController = require('./category.controller');

/**
 * 🌳 CATEGORY ROUTES
 * 
 * Base: /api/categories
 * 
 * Endpoints:
 * POST   /                    → Create category
 * GET    /                    → Get all categories (flat or tree)
 * GET    /:id                 → Get category by ID
 * GET    /:id/children        → Get direct children
 */

/**
 * POST /api/categories
 * Create a new category
 * 
 * Body:
 * {
 *   "name": "Root Category",
 *   "parentId": "optional_parent_id"
 * }
 */
router.post('/', categoryController.createCategory.bind(categoryController));

/**
 * GET /api/categories
 * Get all categories
 * 
 * Query params:
 * ?tree=true  → Return hierarchical tree structure
 * (default) → Return flat list
 */
router.get('/', categoryController.getCategories.bind(categoryController));

/**
 * GET /api/categories/:id
 * Get single category by ID
 */
router.get('/:id', categoryController.getCategory.bind(categoryController));

/**
 * GET /api/categories/:id/children
 * Get direct children of category
 */
router.get('/:id/children', categoryController.getChildren.bind(categoryController));

module.exports = router;
