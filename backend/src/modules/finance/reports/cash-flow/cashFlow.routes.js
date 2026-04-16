const express = require('express');
const router = express.Router();
const cashFlowController = require('./cashFlow.controller');

// GET /api/finance/reports/cash-flow?fromDate=YYYY-MM-DD&toDate=YYYY-MM-DD
router.get('/', cashFlowController.getCashFlow);

module.exports = router;
