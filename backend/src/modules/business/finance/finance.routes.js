const express = require('express');
const router = express.Router();
const controller = require('./finance.controller');
const auth = require('../../../middleware/auth.middleware');

router.get('/general-ledger', auth, controller.generalLedger);
router.get('/trial-balance', auth, controller.trialBalance);
router.get('/profit-loss', auth, controller.profitLoss);
router.get('/balance-sheet', auth, controller.balanceSheet);

module.exports = router;
