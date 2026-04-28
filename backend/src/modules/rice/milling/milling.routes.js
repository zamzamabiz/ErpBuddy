const express = require('express');
const router = express.Router();
const millingController = require('./milling.controller');
const authMiddleware = require('../../../middleware/auth.middleware');

/**
 * MILLING ROUTES
 * API endpoints for rice milling operations
 * 
 * All routes require authentication and tenant isolation
 */

// Apply auth middleware to all milling routes
router.use(authMiddleware);

/**
 * POST /api/rice/milling
 * Create a new milling transaction (paddy → rice + broken + husk)
 * 
 * Request body:
 * {
 *   "paddyItemId": "item_id",
 *   "quantity": 1000,
 *   "godownId": "godown_id",
 *   "processingCost": 500,
 *   "riceItemId": "optional_rice_item_id",
 *   "brokenItemId": "optional_broken_item_id",
 *   "huskItemId": "optional_husk_item_id",
 *   "ratios": {
 *     "rice": 0.80,
 *     "broken": 0.15,
 *     "husk": 0.05
 *   },
 *   "millingDate": "2026-04-28"
 * }
 */
router.post('/', millingController.createMilling);

/**
 * GET /api/rice/milling
 * Get all milling transactions for the tenant
 */
router.get('/', millingController.getAllMillings);

/**
 * GET /api/rice/milling/:id
 * Get a specific milling transaction by ID
 */
router.get('/:id', millingController.getMillingById);

module.exports = router;