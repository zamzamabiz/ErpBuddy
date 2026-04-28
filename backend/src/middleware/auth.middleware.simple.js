const jwt = require('jsonwebtoken');
const jwtConfig = require('../config/jwt.config');

/**
 * Simple Auth Middleware (for basic API authentication)
 * This is a lightweight version that only validates the JWT token
 * without loading full user details and permissions
 */
module.exports = async function authMiddlewareSimple(req, res, next) {
  // DEV MODE bypass
  if (req.headers.authorization === 'Bearer dev-token' || req.headers['x-dev-mode'] === 'true') {
    console.log('🚀 Auth Simple: DEV MODE bypass enabled');
    req.user = {
      id: 'dev-user-id',
      email: 'dev@erpbuddy.local',
      name: 'Development User',
      role: 'admin',
      tenantId: '69d41e8bef18c77b2b68baac'
    };
    req.tenantId = '69d41e8bef18c77b2b68baac';
    return next();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('❌ Auth Simple: No Bearer token found');
    return res.status(401).json({ success: false, message: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, jwtConfig.secret);
    
    // Set basic user info from token
    req.user = {
      id: decoded.userId,
      email: decoded.email,
      tenantId: decoded.tenantId
    };
    req.tenantId = decoded.tenantId;
    
    console.log('✅ Auth Simple: Token verified for user:', decoded.email);
    next();
  } catch (err) {
    console.log('❌ Auth Simple: Token verification failed:', err.message);
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
};