const express = require('express');
const router = express.Router();
const controller = require('./permission.controller');
const authMiddleware = require('../../../middleware/auth.middleware');
const checkPermission = require('../../../middleware/rbac.middleware');

router.post('/', authMiddleware, checkPermission('permissions', 'create'), controller.create);
router.get('/', authMiddleware, checkPermission('permissions', 'read'), controller.getAll);
router.get('/:id', authMiddleware, checkPermission('permissions', 'read'), controller.getById);
router.put('/:id', authMiddleware, checkPermission('permissions', 'update'), controller.update);
router.delete('/:id', authMiddleware, checkPermission('permissions', 'delete'), controller.remove);

module.exports = router;