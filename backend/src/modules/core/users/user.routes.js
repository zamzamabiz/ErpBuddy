const express = require('express');
const router = express.Router();
const controller = require('./user.controller');
const authMiddleware = require('../../../middleware/auth.middleware');
const checkPermission = require('../../../middleware/rbac.middleware');

router.post('/', authMiddleware, checkPermission('users', 'create'), controller.create);
router.get('/', authMiddleware, checkPermission('users', 'read'), controller.getAll);
router.get('/:id', authMiddleware, checkPermission('users', 'read'), controller.getById);
router.put('/:id', authMiddleware, checkPermission('users', 'update'), controller.update);
router.delete('/:id', authMiddleware, checkPermission('users', 'delete'), controller.remove);

module.exports = router;