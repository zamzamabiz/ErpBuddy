const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../users/user.model');

/**
 * DEV LOGIN ROUTE
 * ⚠️ ONLY works in development mode
 * ❌ Blocked in production for security
 */
router.post('/dev-login', async (req, res) => {
  try {
    // SECURITY CHECK: Only allow in development
    if (process.env.NODE_ENV !== 'development') {
      return res.status(403).json({
        success: false,
        error: 'Dev login is not allowed in production environment'
      });
    }

    // Find any existing user (prefer admin)
    let user = await User.findOne({ role: 'admin' });
    
    // If no admin, find any user
    if (!user) {
      user = await User.findOne();
    }

    // If still no user, create a default dev user
    if (!user) {
      const bcrypt = require('bcrypt');
      const hashedPassword = await bcrypt.hash('dev123', 10);
      
      user = await User.create({
        name: 'Dev User',
        email: 'dev@erpbuddy.com',
        password: hashedPassword,
        role: 'admin',
        userRole: 'admin',
        isActive: true
      });
      
      console.log('🔧 Created default dev user: dev@erpbuddy.com');
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user._id, 
        tenantId: user.tenantId,
        email: user.email,
        role: user.role
      },
      process.env.JWT_SECRET || 'dev-secret-key-change-in-production',
      { expiresIn: '24h' }
    );

    // Return success with token
    res.json({
      success: true,
      message: 'Dev login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        userRole: user.userRole,
        tenantId: user.tenantId
      }
    });

  } catch (err) {
    console.error('❌ Dev login error:', err.message);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

module.exports = router;