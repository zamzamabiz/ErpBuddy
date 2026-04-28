const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth.middleware');
const tenantMiddleware = require('../middleware/tenant.middleware');
const {
  createLot,
  getAllLots,
  getLotById,
  updateLot,
  deleteLot,
  sellFromLot,
  getAvailableLots,
  getInventoryValue,
  getProfitSummary
} = require('../controllers/riceLot.controller');

// Apply auth and tenant middleware to all routes
router.use(authMiddleware, tenantMiddleware);

// POST / - Create new rice lot
router.post('/', createLot);

// GET / - List all rice lots with pagination/filtering
router.get('/', getAllLots);

// GET /available - Get available lots (remaining quantity > 0)
router.get('/available', getAvailableLots);

// GET /inventory-value - Get total inventory value
router.get('/inventory-value', getInventoryValue);

// GET /profit-summary - Get profit summary with date range
router.get('/profit-summary', getProfitSummary);

// GET /:id - Get single rice lot by ID
router.get('/:id', getLotById);

// PUT /:id - Update rice lot
router.put('/:id', updateLot);

// DELETE /:id - Delete rice lot
router.delete('/:id', deleteLot);

// POST /:id/sell - Sell from rice lot and calculate profit
router.post('/:id/sell', sellFromLot);

module.exports = router;