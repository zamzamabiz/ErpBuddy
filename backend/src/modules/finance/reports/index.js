const express = require('express');
const router = express.Router();

// General Reports (Trial Balance, P&L, Account Detail)
router.use('/', require('./reports.routes'));

// General Ledger Report
// router.use('/general-ledger', require('./general-ledger/generalLedger.routes'));


// Trial Balance Report
router.use('/trial-balance', require('./trial-balance/trialBalance.routes'));

// Profit & Loss Report
router.use('/profit-loss', require('./profit-loss/profitLoss.routes'));


// Balance Sheet Report
router.use('/balance-sheet', require('./balance-sheet/balanceSheet.routes'));


// Cash Flow Statement Report
router.use('/cash-flow', require('./cash-flow/cashFlow.routes'));

module.exports = router;
