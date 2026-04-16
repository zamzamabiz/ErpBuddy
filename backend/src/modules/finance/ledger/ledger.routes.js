const express = require('express');
const router = express.Router();
const LedgerService = require('./ledger.service');
const TrialBalanceService = require('../trialBalance/trialBalance.service');
const authMiddleware = require('../../../middleware/auth.middleware');

/**
 * LEDGER ROUTES
 * Provides ledger and trial balance endpoints
 */

// Apply authentication middleware to all routes
router.use(authMiddleware);

/**
 * GET /api/ledger/:accountId
 * Get ledger for a specific account
 * 
 * Query parameters:
 * - fromDate: Start date (YYYY-MM-DD)
 * - toDate: End date (YYYY-MM-DD)
 * 
 * @param {string} accountId - Account ID
 * @returns {Object} Account ledger with entries and running balance
 */
router.get('/:accountId', async (req, res) => {
  try {
    const { accountId } = req.params;
    const { fromDate, toDate } = req.query;
    const tenantId = req.user.tenantId;

    // Validate required parameters
    if (!accountId) {
      return res.status(400).json({
        success: false,
        error: 'Account ID is required'
      });
    }

    // Validate tenantId
    if (!tenantId) {
      return res.status(400).json({
        success: false,
        error: 'Tenant ID is required'
      });
    }

    // Parse dates if provided
    const parsedFromDate = fromDate ? new Date(fromDate) : null;
    const parsedToDate = toDate ? new Date(toDate) : null;

    // Validate dates
    if (fromDate && isNaN(parsedFromDate)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid fromDate format. Use YYYY-MM-DD'
      });
    }

    if (toDate && isNaN(parsedToDate)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid toDate format. Use YYYY-MM-DD'
      });
    }

    // Get ledger
    const ledger = await LedgerService.getLedger(
      accountId,
      parsedFromDate,
      parsedToDate,
      tenantId
    );

    res.json({
      success: true,
      data: ledger
    });

  } catch (error) {
    console.error('Ledger error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/ledger/:accountId/balance
 * Get account balance only (no entries)
 * 
 * @param {string} accountId - Account ID
 * @returns {Object} Account balance summary
 */
router.get('/:accountId/balance', async (req, res) => {
  try {
    const { accountId } = req.params;
    const { asOfDate } = req.query;
    const tenantId = req.user.tenantId;

    // Validate required parameters
    if (!accountId) {
      return res.status(400).json({
        success: false,
        error: 'Account ID is required'
      });
    }

    if (!tenantId) {
      return res.status(400).json({
        success: false,
        error: 'Tenant ID is required'
      });
    }

    // Parse date if provided
    const parsedAsOfDate = asOfDate ? new Date(asOfDate) : null;

    if (asOfDate && isNaN(parsedAsOfDate)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid asOfDate format. Use YYYY-MM-DD'
      });
    }

    // Get account balance
    const balance = await LedgerService.getAccountBalance(
      accountId,
      tenantId,
      parsedAsOfDate
    );

    res.json({
      success: true,
      data: balance
    });

  } catch (error) {
    console.error('Account balance error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/trial-balance
 * Get trial balance for all accounts
 * 
 * Query parameters:
 * - asOfDate: Date to calculate balances as of (YYYY-MM-DD)
 * 
 * @returns {Object} Trial balance with all accounts and totals
 */
router.get('/trial-balance', async (req, res) => {
  try {
    const { asOfDate } = req.query;
    const tenantId = req.user.tenantId;

    // Validate tenantId
    if (!tenantId) {
      return res.status(400).json({
        success: false,
        error: 'Tenant ID is required'
      });
    }

    // Parse date if provided
    const parsedAsOfDate = asOfDate ? new Date(asOfDate) : null;

    if (asOfDate && isNaN(parsedAsOfDate)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid asOfDate format. Use YYYY-MM-DD'
      });
    }

    // Get trial balance
    const trialBalance = await TrialBalanceService.getTrialBalance(
      tenantId,
      parsedAsOfDate
    );

    res.json({
      success: true,
      data: trialBalance
    });

  } catch (error) {
    console.error('Trial balance error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/trial-balance/validate
 * Quick validation that trial balance is balanced
 * 
 * Query parameters:
 * - asOfDate: Date to validate as of (YYYY-MM-DD)
 * 
 * @returns {Object} Validation result with totals
 */
router.get('/trial-balance/validate', async (req, res) => {
  try {
    const { asOfDate } = req.query;
    const tenantId = req.user.tenantId;

    // Validate tenantId
    if (!tenantId) {
      return res.status(400).json({
        success: false,
        error: 'Tenant ID is required'
      });
    }

    // Parse date if provided
    const parsedAsOfDate = asOfDate ? new Date(asOfDate) : null;

    if (asOfDate && isNaN(parsedAsOfDate)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid asOfDate format. Use YYYY-MM-DD'
      });
    }

    // Validate trial balance
    const validation = await TrialBalanceService.validateTrialBalance(
      tenantId,
      parsedAsOfDate
    );

    res.json({
      success: true,
      data: validation
    });

  } catch (error) {
    console.error('Trial balance validation error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/trial-balance/by-type
 * Get trial balance grouped by account type
 * 
 * Query parameters:
 * - asOfDate: Date to calculate balances as of (YYYY-MM-DD)
 * 
 * @returns {Object} Trial balance grouped by account type
 */
router.get('/trial-balance/by-type', async (req, res) => {
  try {
    const { asOfDate } = req.query;
    const tenantId = req.user.tenantId;

    // Validate tenantId
    if (!tenantId) {
      return res.status(400).json({
        success: false,
        error: 'Tenant ID is required'
      });
    }

    // Parse date if provided
    const parsedAsOfDate = asOfDate ? new Date(asOfDate) : null;

    if (asOfDate && isNaN(parsedAsOfDate)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid asOfDate format. Use YYYY-MM-DD'
      });
    }

    // Get trial balance by type
    const trialBalanceByType = await TrialBalanceService.getTrialBalanceByType(
      tenantId,
      parsedAsOfDate
    );

    res.json({
      success: true,
      data: trialBalanceByType
    });

  } catch (error) {
    console.error('Trial balance by type error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;