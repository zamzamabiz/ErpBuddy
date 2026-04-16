const express = require('express');
const brandController = require('./brand.controller');

const router = express.Router();

router.post('/', (req, res) => brandController.createBrand(req, res));
router.get('/', (req, res) => brandController.getCategories(req, res));
router.get('/:id', (req, res) => brandController.getBrand(req, res));

module.exports = router;
