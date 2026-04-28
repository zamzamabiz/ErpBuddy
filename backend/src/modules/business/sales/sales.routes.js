const express = require('express');
const router = express.Router();
const controller = require('./sales.controller');
const auth = require('../../../middleware/auth.middleware');
const periodLock = require('../../../middleware/periodLock.middleware');

router.post('/', auth, periodLock, controller.create);
router.get('/', auth, controller.findAll);
router.get('/:id', auth, controller.findById);
router.put('/:id', auth, periodLock, controller.update);
router.delete('/:id', auth, periodLock, controller.remove);
router.post('/:id/restore', auth, controller.restore);
router.post('/:id/post', auth, periodLock, controller.post);

module.exports = router;
