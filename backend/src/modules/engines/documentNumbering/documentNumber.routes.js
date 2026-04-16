const express = require('express');
const router = express.Router();
const controller = require('./documentNumber.controller');
const authMiddleware = require('../../../middleware/auth.middleware');
const rbac = require('../../../middleware/rbac.middleware');

/**
 * POST /api/document-number/generate
 * Generate next document number for a module
 * Requires: Authentication + ("document", "create") permission
 */
router.post(
  '/generate',
  authMiddleware,
  rbac('document', 'create'),
  controller.generateDocumentNumber
);

/**
 * GET /api/document-number/modules
 * Get list of supported modules and their prefixes
 * Requires: Authentication
 */
router.get(
  '/modules',
  authMiddleware,
  controller.getModules
);

module.exports = router;
