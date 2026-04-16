const express = require('express');
const router = express.Router();
const controller = require('./productionOrder.controller');
const auth = require('../../../middleware/auth.middleware');


router.post('/', auth, controller.create);
router.get('/', auth, controller.findAll);
router.get('/:id', auth, controller.findById);
router.put('/:id', auth, controller.update);
router.delete('/:id', auth, controller.remove);

// Production posting endpoint
router.post('/:id/post', auth, controller.postProductionOrder);

module.exports = router;
