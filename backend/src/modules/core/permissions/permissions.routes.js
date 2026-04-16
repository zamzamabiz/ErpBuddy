const express = require('express');
const router = express.Router();
const controller = require('./permissions.controller');
const authMiddleware = require('@middleware/auth.middleware');
// const permissionMiddleware = require('../../middleware/permission.middleware'); // Placeholder for future

router.post('/', authMiddleware, controller.create);
router.get('/', authMiddleware, controller.list);
router.put('/:id', authMiddleware, controller.update);
router.delete('/:id', authMiddleware, controller.delete);
router.post('/seed', authMiddleware, controller.seed);
router.post('/roles/:id/permissions', authMiddleware, controller.assignPermission);
router.delete('/roles/:id/permissions/:permissionId', authMiddleware, controller.removePermission);
router.get('/roles/:id/permissions', authMiddleware, controller.getRolePermissions);

module.exports = router;
