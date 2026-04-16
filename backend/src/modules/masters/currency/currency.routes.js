const express = require('express');
const router = express.Router();
const controller = require('./currency.controller');
const authMiddleware = require('@middleware/auth.middleware');
// const permissionMiddleware = require('@middleware/permission.middleware'); // Placeholder for future

router.post('/', authMiddleware, controller.create);
router.get('/', authMiddleware, controller.list);
router.get('/:id', authMiddleware, controller.get);
router.put('/:id', authMiddleware, controller.update);
router.delete('/:id', authMiddleware, controller.delete);

module.exports = router;
