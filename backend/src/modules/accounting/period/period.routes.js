const express = require('express');
const router = express.Router();
const authMiddleware = require('@middleware/auth.middleware');
const checkPermission = require('@middleware/rbac.middleware');
const periodController = require('./period.controller');

router.get('/', authMiddleware, checkPermission('view_periods'), periodController.getPeriods);

router.post('/:id/lock', authMiddleware, checkPermission('lock_period'), periodController.lockPeriod);

router.post('/:id/unlock', authMiddleware, checkPermission('unlock_period'), periodController.unlockPeriod);

module.exports = router;
