const express = require('express');
const router = express.Router();
const controller = require('./tenant.controller');
const authMiddleware = require('../../../middleware/auth.middleware');
const checkPermission = require('../../../middleware/rbac.middleware');

router.post('/', authMiddleware, checkPermission('tenant', 'create'), controller.create);
router.get('/', authMiddleware, checkPermission('tenant', 'read'), controller.getAll);
router.get('/:id', authMiddleware, checkPermission('tenant', 'read'), controller.getById);
router.put('/:id', authMiddleware, checkPermission('tenant', 'update'), controller.update);
router.delete('/:id', authMiddleware, checkPermission('tenant', 'delete'), controller.remove);

module.exports = router;