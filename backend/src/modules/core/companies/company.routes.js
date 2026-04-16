const express = require('express');
const router = express.Router();
const controller = require('./company.controller');
const authMiddleware = require('../../../middleware/auth.middleware');
const checkPermission = require('../../../middleware/rbac.middleware');

router.post('/', authMiddleware, checkPermission('company', 'create'), controller.create);
router.get('/', authMiddleware, checkPermission('company', 'read'), controller.getAll);
router.get('/:id', authMiddleware, checkPermission('company', 'read'), controller.getById);
router.put('/:id', authMiddleware, checkPermission('company', 'update'), controller.update);
router.delete('/:id', authMiddleware, checkPermission('company', 'delete'), controller.remove);

module.exports = router;