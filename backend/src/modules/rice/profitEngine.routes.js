const express = require('express');
const router = express.Router();
const profitEngineController = require('./profitEngine.controller');
const auth = require('../../middleware/auth.middleware');

router.use(auth);

router.post('/calculate/:lotId', profitEngineController.calculateProfit);
router.get('/summary/:lotId', profitEngineController.getProfitSummary);
router.get('/dashboard', profitEngineController.getDashboardProfit);

module.exports = router;