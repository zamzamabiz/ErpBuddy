const express = require('express');
const router = express.Router();
const controller = require('./trialBalance.controller');
const auth = require('../../../middleware/auth.middleware');

// GET /api/trial-balance
router.get('/', auth, controller.getTrialBalance);

module.exports = router;
