/**
 * Reports Routes
 * API endpoints for financial reports
 */

const express = require('express');
const router = express.Router();
const reportsController = require('./reports.controller');
const authMiddleware = require('@middleware/auth.middleware.simple');

// All routes require authentication
router.use(authMiddleware);

/**
 * GET /api/reports/trial-balance
 * Get trial balance report
 * Query params: ?fromDate=YYYY-MM-DD&toDate=YYYY-MM-DD
 */
router.get('/trial-balance', reportsController.getTrialBalance);

/**
 * GET /api/reports/profit-loss
 * Get profit and loss report
 * Query params: ?fromDate=YYYY-MM-DD&toDate=YYYY-MM-DD
 */
router.get('/profit-loss', reportsController.getProfitAndLoss);

/**
 * GET /api/reports/account-detail/:accountCode
 * Get detailed entries for a specific account
 * Query params: ?fromDate=YYYY-MM-DD&toDate=YYYY-MM-DD
 */
router.get('/account-detail/:accountCode', reportsController.getAccountDetail);

module.exports = router;
