/**
 * 📊 REPORTS ROUTES
 * ========================
 * Routes for financial reports and ledgers
 */

const express = require('express');
const router = express.Router();
const controller = require('./reports.controller');
const auth = require('@middleware/auth.middleware');

// ✅ All report endpoints require authentication
router.use(auth);

/**
 * 🔷 GENERAL LEDGER ROUTES
 */

/**
 * GET /api/reports/ledger/:accountId
 * Fetch general ledger for a specific account
 * Query params: fromDate, toDate, includeOpening
 */
router.get('/ledger/:accountId', controller.getLedger);

/**
 * 🔷 TRIAL BALANCE ROUTES
 */

/**
 * GET /api/reports/trial-balance
 * Fetch trial balance (all accounts with debits/credits)
 * Query params: fromDate, toDate, byType
 */
router.get('/trial-balance', controller.getTrialBalance);

/**
 * 🔷 FINANCIAL SUMMARY ROUTES
 */

/**
 * GET /api/reports/summary
 * Fetch financial summary (quick overview)
 * Query params: fromDate, toDate
 */
router.get('/summary', controller.getSummary);

module.exports = router;

