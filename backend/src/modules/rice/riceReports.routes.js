const express = require('express');
const router = express.Router();
const riceReportsController = require('./riceReports.controller');
const auth = require('../../middleware/auth.middleware');

router.use(auth);

router.get('/stock', riceReportsController.getStockReport);
router.get('/profit-loss', riceReportsController.getProfitLossReport);
router.get('/lot-performance', riceReportsController.getLotPerformanceReport);
router.get('/dashboard', riceReportsController.getDashboardReport);

module.exports = router;