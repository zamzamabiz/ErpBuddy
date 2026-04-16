const express = require('express');
const itemController = require('./item.controller');

const router = express.Router();

router.post('/', (req, res) => itemController.createItem(req, res));
router.get('/', (req, res) => itemController.getItems(req, res));
router.get('/:id', (req, res) => itemController.getItem(req, res));

module.exports = router;
