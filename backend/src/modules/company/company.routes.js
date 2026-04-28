const express = require('express');
const router = express.Router();
const companyMiddleware = require('../../middleware/company.middleware');

// Apply company middleware to all routes
router.use(companyMiddleware);

// Placeholder route
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Company route working',
    companyId: req.companyId
  });
});

module.exports = router;