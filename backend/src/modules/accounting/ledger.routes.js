const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const LedgerService = require('./ledger.service');
const TrialBalanceService = require('../finance/trialBalance/trialBalance.service');
const AccountService = require('./account.service');

// Auth middleware
const authMiddleware = require('../../middleware/auth.middleware');
router.use(authMiddleware);

/**
 * Validate ObjectId
 */
function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

/**
 * Validate date string (YYYY-MM-DD)
 */
function isValidDate(dateStr) {
  if (!dateStr) return true;
  const date = new Date(dateStr);
  return !isNaN(date.getTime());
}

/**
 * GET /api/ledger/:accountId
 * Get ledger for a specific account
 */
router.get('/:accountId', async (req, res) => {
  try {
    const { accountId } = req.params;
    const { fromDate, toDate } = req.query;
    const tenantId = req.user?.tenantId;

    // Validate tenantId
    if (!tenantId) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    // Validate accountId
    if (!accountId) {
      return res.status(400).json({ success: false, error: 'Account ID is required' });
    }
    if (!isValidObjectId(accountId)) {
      return res.status(400).json({ success: false, error: 'Invalid Account ID format' });
    }

    // Validate dates
    if (fromDate && !isValidDate(fromDate)) {
      return res.status(400).json({ success: false, error: 'Invalid fromDate format. Use YYYY-MM-DD' });
    }
    if (toDate && !isValidDate(toDate)) {
      return res.status(400).json({ success: false, error: 'Invalid toDate format. Use YYYY-MM-DD' });
    }

    const ledger = await LedgerService.getLedger(
      accountId,
      fromDate ? new Date(fromDate) : null,
      toDate ? new Date(toDate) : null,
      tenantId
    );

    res.json({ success: true, data: ledger, message: 'Ledger retrieved successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/ledger/:accountId/balance
 * Get account balance only
 */
router.get('/:accountId/balance', async (req, res) => {
  try {
    const { accountId } = req.params;
    const { asOfDate } = req.query;
    const tenantId = req.user?.tenantId;

    // Validate tenantId
    if (!tenantId) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    // Validate accountId
    if (!accountId) {
      return res.status(400).json({ success: false, error: 'Account ID is required' });
    }
    if (!isValidObjectId(accountId)) {
      return res.status(400).json({ success: false, error: 'Invalid Account ID format' });
    }

    // Validate date
    if (asOfDate && !isValidDate(asOfDate)) {
      return res.status(400).json({ success: false, error: 'Invalid asOfDate format. Use YYYY-MM-DD' });
    }

    const balance = await LedgerService.getAccountBalance(
      accountId,
      tenantId,
      asOfDate ? new Date(asOfDate) : null
    );

    res.json({ success: true, data: balance, message: 'Account balance retrieved successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;