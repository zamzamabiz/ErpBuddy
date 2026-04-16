const express = require('express');
const router = express.Router();
const controller = require('./journalEntry.controller');
const auth = require('../../../middleware/auth.middleware');

router.post('/', auth, controller.create);
router.get('/', auth, controller.findAll);
router.get('/:id', auth, controller.findById);
router.put('/:id', auth, controller.update);
router.delete('/:id', auth, controller.remove);

module.exports = router;
