const express = require('express');
const router = express.Router();
const profitController = require('./profit.controller');
const authMiddleware = require('../../../middleware/auth.middleware');

/**
 * PROFIT REPORT ROUTES
 * All routes require authentication and tenant context
 */

// Apply auth middleware to all profit routes
router.use(authMiddleware);

/**
 * @route   GET /api/profit/sale/:saleId
 * @desc    Get profit calculation for a specific sale
 * @access  Private
 */
router.get('/sale/:saleId', profitController.getProfitBySale);

/**
 * @route   GET /api/profit/summary
 * @desc    Get overall profit summary with optional date filters
 * @query   fromDate - Start date (YYYY-MM-DD)
 * @query   toDate - End date (YYYY-MM-DD)
 * @access  Private
 */
router.get('/summary', profitController.getOverallProfit);

/**
 * @route   GET /api/profit/by-item
 * @desc    Get profit breakdown by item
 * @query   fromDate - Start date (YYYY-MM-DD)
 * @query   toDate - End date (YYYY-MM-DD)
 * @access  Private
 */
router.get('/by-item', profitController.getProfitByItem);

module.exports = router;