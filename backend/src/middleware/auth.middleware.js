const jwt = require('jsonwebtoken');
const User = require('../modules/core/users/user.model');
const jwtConfig = require('../config/jwt.config');

module.exports = async function authMiddleware(req, res, next) {
  // DEV MODE bypass
  if (req.headers.authorization === 'Bearer dev-token' || req.headers['x-dev-mode'] === 'true') {
    console.log('🚀 Auth: DEV MODE bypass enabled');
    req.user = {
      id: 'dev-user-id',
      email: 'dev@erpbuddy.local',
      name: 'Development User',
      role: { name: 'admin', permissions: [] },
      tenantId: '69d41e8bef18c77b2b68baac'
    };
    req.tenantId = '69d41e8bef18c77b2b68baac';
    return next();
  }
  
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('❌ Auth: No Bearer token found in Authorization header');
    return res.status(401).json({ success: false, message: 'No token provided' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, jwtConfig.secret);
    
    // Check if tenantId exists in token
    if (!decoded.tenantId) {
      console.log('❌ Auth: Tenant not found in token');
      return res.status(403).json({ success: false, message: 'Tenant not found in token' });
    }
    
    // Find user without populating role (to avoid Role model dependency)
    const user = await User.findById(decoded.userId);
    if (!user) {
      console.log('❌ Auth: User not found for ID:', decoded.userId);
      return res.status(401).json({ success: false, message: 'User not found' });
    }
    console.log('✅ Auth: Request authorized for user:', user.email, '| tenantId:', decoded.tenantId);
    req.user = user;
    req.user.tenantId = decoded.tenantId;
    req.tenantId = decoded.tenantId; // Set tenantId directly on req for easy access
    next();
  } catch (err) {
    console.log('❌ Auth: Token verification failed:', err.message);
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
};
