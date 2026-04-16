const express = require('express');
const router = express.Router();
const authMiddleware = require('@middleware/auth.middleware');
const AuditController = require('./audit.controller');

router.get('/', authMiddleware, AuditController.getAuditLog);
router.get('/:recordId', authMiddleware, AuditController.getRecordHistory);

module.exports = router;
