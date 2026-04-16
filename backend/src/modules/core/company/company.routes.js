const express = require('express');
const router = express.Router();
const controller = require('./company.controller');
const authMiddleware = require('@middleware/auth.middleware');

router.post('/', authMiddleware, controller.create);
router.get('/', authMiddleware, controller.list);
router.get('/:id', authMiddleware, controller.get);
router.put('/:id', authMiddleware, controller.update);
router.delete('/:id', authMiddleware, controller.delete);

module.exports = router;
