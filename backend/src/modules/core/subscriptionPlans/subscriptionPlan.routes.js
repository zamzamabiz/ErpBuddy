const express = require('express');
const router = express.Router();
const controller = require('./subscriptionPlan.controller');
const authMiddleware = require('../../../middleware/auth.middleware');
const checkPermission = require('../../../middleware/rbac.middleware');

router.post('/', authMiddleware, checkPermission('subscriptionPlan', 'create'), controller.create);
router.get('/', authMiddleware, checkPermission('subscriptionPlan', 'read'), controller.getAll);
router.get('/:id', authMiddleware, checkPermission('subscriptionPlan', 'read'), controller.getById);
router.put('/:id', authMiddleware, checkPermission('subscriptionPlan', 'update'), controller.update);
router.delete('/:id', authMiddleware, checkPermission('subscriptionPlan', 'delete'), controller.remove);

module.exports = router;