const express = require('express');
const router = express.Router();
const balanceSheetController = require('./balanceSheet.controller');

// GET /api/finance/reports/balance-sheet?toDate=YYYY-MM-DD
router.get('/', balanceSheetController.getBalanceSheet);

module.exports = router;
