const express = require('express');
const router = express.Router();
const riceLotController = require('./riceLot.controller');
const auth = require('../../middleware/auth.middleware');

router.use(auth);

router.post('/lots', riceLotController.createLot);
router.get('/lots', riceLotController.getAllLots);
router.get('/lots/available', riceLotController.getAvailableLots);
router.get('/lots/:id', riceLotController.getLotById);
router.put('/lots/:id', riceLotController.updateLot);
router.delete('/lots/:id', riceLotController.deleteLot);
router.post('/lots/:id/sell', riceLotController.sellFromLot);

// Sales integration endpoints
router.post('/lots/:id/reserve', riceLotController.reserveForSale);
router.post('/lots/:id/confirm-sale', riceLotController.confirmSale);
router.get('/lots/:id/profit', riceLotController.getLotProfit);

module.exports = router;
