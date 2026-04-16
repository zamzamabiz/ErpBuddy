const express = require('express');
const router = express.Router();
const controller = require('./payroll.controller');
const auth = require('../../../middleware/auth.middleware');

router.post('/process', auth, controller.process);
router.post('/post/:id', auth, controller.post);
router.get('/', auth, controller.findAll);
router.get('/:id', auth, controller.findById);
router.put('/:id', auth, controller.update);
router.delete('/:id', auth, controller.remove);

module.exports = router;
