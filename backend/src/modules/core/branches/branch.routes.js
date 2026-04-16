const express = require('express');
const router = express.Router();
const controller = require('./branch.controller');
const authMiddleware = require('../../../middleware/auth.middleware');
const checkPermission = require('../../../middleware/rbac.middleware');

router.post('/', authMiddleware, checkPermission('branch', 'create'), controller.create);
router.get('/', authMiddleware, checkPermission('branch', 'read'), controller.getAll);
router.get('/:id', authMiddleware, checkPermission('branch', 'read'), controller.getById);
router.put('/:id', authMiddleware, checkPermission('branch', 'update'), controller.update);
router.delete('/:id', authMiddleware, checkPermission('branch', 'delete'), controller.remove);

module.exports = router;