const express = require('express');
const router = express.Router();
const profitLossController = require('./profitLoss.controller');

// GET /api/finance/reports/profit-loss?fromDate=YYYY-MM-DD&toDate=YYYY-MM-DD
router.get('/', profitLossController.getProfitLoss);

module.exports = router;
