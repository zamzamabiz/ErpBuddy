const express = require('express');
const router = express.Router();
const trialBalanceController = require('./trialBalance.controller');

// GET /api/finance/reports/trial-balance?fromDate=YYYY-MM-DD&toDate=YYYY-MM-DD
router.get('/', trialBalanceController.getTrialBalance);

module.exports = router;
