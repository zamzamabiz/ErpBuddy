const express = require('express');
const router = express.Router();
const { register, login } = require('./auth.controller.simple');
const authMiddlewareSimple = require('../../../middleware/auth.middleware.simple');

// Registration endpoint
router.post('/register', register);

// Login endpoint
router.post('/login', login);

// Get current user endpoint (protected)
router.get('/me', authMiddlewareSimple, (req, res) => {
  res.json({
    success: true,
    data: {
      userId: req.userId,
      email: req.email,
      tenantId: req.tenantId,
      companyId: req.companyId,
      userRole: req.userRole
    }
  });
});

module.exports = router;
