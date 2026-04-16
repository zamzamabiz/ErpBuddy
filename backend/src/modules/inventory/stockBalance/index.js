/**
 * Stock Balance Module - Index
 * Exports routes for stock inventory management
 */

const router = require('express').Router();
const stockRoutes = require('./stockBalance.routes');

// Register stock balance routes at /api/inventory
router.use('/', stockRoutes);

module.exports = router;
