const express = require('express');
const router = express.Router();
const controller = require('./role.controller');
const authMiddleware = require('../../../middleware/auth.middleware');
const checkPermission = require('../../../middleware/rbac.middleware');

router.post('/', authMiddleware, checkPermission('roles', 'create'), controller.create);
router.get('/', authMiddleware, checkPermission('roles', 'read'), controller.getAll);
router.get('/:id', authMiddleware, checkPermission('roles', 'read'), controller.getById);
router.put('/:id', authMiddleware, checkPermission('roles', 'update'), controller.update);
router.delete('/:id', authMiddleware, checkPermission('roles', 'delete'), controller.remove);

module.exports = router;