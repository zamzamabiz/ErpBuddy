const express = require('express');
const router = express.Router();
const controller = require('./subscription.controller');
const authMiddleware = require('../../../middleware/auth.middleware');
const checkPermission = require('../../../middleware/rbac.middleware');

router.post('/', authMiddleware, checkPermission('subscription', 'create'), controller.create);
router.get('/', authMiddleware, checkPermission('subscription', 'read'), controller.getAll);
router.get('/:id', authMiddleware, checkPermission('subscription', 'read'), controller.getById);
router.put('/:id', authMiddleware, checkPermission('subscription', 'update'), controller.update);
router.delete('/:id', authMiddleware, checkPermission('subscription', 'delete'), controller.remove);

module.exports = router;