const express = require('express');
const router = express.Router();
const controller = require('./balanceSheet.controller');
const auth = require('../../../middleware/auth.middleware');

// GET /api/balance-sheet/summary
router.get('/summary', auth, controller.getBalanceSheetSummary);

// GET /api/balance-sheet
router.get('/', auth, controller.getBalanceSheet);

module.exports = router;
