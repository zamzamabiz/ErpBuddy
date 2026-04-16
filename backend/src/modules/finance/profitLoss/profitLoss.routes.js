const express = require('express');
const router = express.Router();
const controller = require('./profitLoss.controller');
const auth = require('../../../middleware/auth.middleware');

// GET /api/profit-loss
router.get('/', auth, controller.getProfitLoss);

// GET /api/profit-loss/summary
router.get('/summary', auth, controller.getProfitLossSummary);

module.exports = router;
