const express = require('express');
const router = express.Router();
const controller = require('./payment.controller');
const auth = require('../../../middleware/auth.middleware');

router.post('/', auth, controller.create);
router.get('/', auth, controller.findAll);
router.get('/:id', auth, controller.findById);
router.put('/:id', auth, controller.update);
router.delete('/:id', auth, controller.remove);
router.post('/:id/post', auth, controller.post);

module.exports = router;
