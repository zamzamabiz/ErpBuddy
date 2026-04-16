const express = require('express');
const router = express.Router();
const controller = require('./users.controller');
const authMiddleware = require('@middleware/auth.middleware');
// const permissionMiddleware = require('../../middleware/permission.middleware'); // Placeholder for future

router.post('/', authMiddleware, controller.create);
router.get('/', authMiddleware, controller.list);
router.get('/:id', authMiddleware, controller.get);
router.put('/:id', authMiddleware, controller.update);
router.delete('/:id', authMiddleware, controller.delete);
router.put('/:id/activate', authMiddleware, controller.activate);
router.put('/:id/deactivate', authMiddleware, controller.deactivate);
router.put('/:id/change-password', authMiddleware, controller.changePassword);
router.put('/:id/reset-password', authMiddleware, controller.resetPassword);

module.exports = router;
