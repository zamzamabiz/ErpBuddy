const express = require('express');
const router = express.Router();
const controller = require('./roles.controller');
const authMiddleware = require('@middleware/auth.middleware');
// const permissionMiddleware = require('../../middleware/permission.middleware'); // Placeholder for future

router.post('/', authMiddleware, controller.create);
router.get('/', authMiddleware, controller.list);
router.get('/:id', authMiddleware, controller.get);
router.put('/:id', authMiddleware, controller.update);
router.delete('/:id', authMiddleware, controller.delete);
router.post('/:id/permissions', authMiddleware, controller.assignPermissions);
router.get('/:id/permissions', authMiddleware, controller.getPermissions);
router.delete('/:id/permissions/:permissionId', authMiddleware, controller.removePermission);

module.exports = router;
