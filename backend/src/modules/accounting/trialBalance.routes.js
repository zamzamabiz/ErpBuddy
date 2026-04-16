const express = require('express');
const router = express.Router();
const TrialBalanceService = require('../finance/trialBalance/trialBalance.service');
const AccountService = require('./account.service');

// Auth middleware
const authMiddleware = require('../../middleware/auth.middleware');
router.use(authMiddleware);

/**
 * Validate date string (YYYY-MM-DD)
 */
function isValidDate(dateStr) {
  if (!dateStr) return true;
  const date = new Date(dateStr);
  return !isNaN(date.getTime());
}

/**
 * GET /api/trial-balance
 * Get trial balance for all accounts
 */
router.get('/', async (req, res) => {
  try {
    const { asOfDate } = req.query;
    const tenantId = req.user?.tenantId;

    // Validate tenantId
    if (!tenantId) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    // Validate date
    if (asOfDate && !isValidDate(asOfDate)) {
      return res.status(400).json({ success: false, error: 'Invalid asOfDate format. Use YYYY-MM-DD' });
    }

    const trialBalance = await TrialBalanceService.getTrialBalance(
      tenantId,
      asOfDate ? new Date(asOfDate) : null
    );

    res.json({ success: true, data: trialBalance, message: 'Trial balance retrieved successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/trial-balance/validate
 * Quick validation that trial balance is balanced
 */
router.get('/validate', async (req, res) => {
  try {
    const { asOfDate } = req.query;
    const tenantId = req.user?.tenantId;

    // Validate tenantId
    if (!tenantId) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    // Validate date
    if (asOfDate && !isValidDate(asOfDate)) {
      return res.status(400).json({ success: false, error: 'Invalid asOfDate format. Use YYYY-MM-DD' });
    }

    const validation = await TrialBalanceService.validateTrialBalance(
      tenantId,
      asOfDate ? new Date(asOfDate) : null
    );

    res.json({ success: true, data: validation, message: 'Trial balance validated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/trial-balance/by-type
 * Get trial balance grouped by account type
 */
router.get('/by-type', async (req, res) => {
  try {
    const { asOfDate } = req.query;
    const tenantId = req.user?.tenantId;

    // Validate tenantId
    if (!tenantId) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    // Validate date
    if (asOfDate && !isValidDate(asOfDate)) {
      return res.status(400).json({ success: false, error: 'Invalid asOfDate format. Use YYYY-MM-DD' });
    }

    const trialBalanceByType = await TrialBalanceService.getTrialBalanceByType(
      tenantId,
      asOfDate ? new Date(asOfDate) : null
    );

    res.json({ success: true, data: trialBalanceByType, message: 'Trial balance by type retrieved successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/accounts/system
 * Get all system accounts for tenant
 */
router.get('/accounts/system', async (req, res) => {
  try {
    const tenantId = req.user?.tenantId;

    // Validate tenantId
    if (!tenantId) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const accounts = await AccountService.getSystemAccounts(tenantId);

    res.json({ success: true, data: accounts, message: 'System accounts retrieved successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;