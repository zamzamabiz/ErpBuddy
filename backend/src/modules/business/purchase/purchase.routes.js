const express = require('express');
const router = express.Router();
const { createPurchase, getAllPurchases, getPurchaseById, updatePurchase } = require('./purchase.controller');
const allowRoles = require('../../../middleware/role.middleware');

// Admin only: Create purchase
router.post('/', allowRoles('admin'), createPurchase);

// Admin + Staff: View purchases
router.get('/', allowRoles('admin', 'staff'), getAllPurchases);

// Admin + Staff: Get single purchase
router.get('/:id', allowRoles('admin', 'staff'), getPurchaseById);

// Admin only: Update purchase
router.put('/:id', allowRoles('admin'), updatePurchase);

module.exports = router;
