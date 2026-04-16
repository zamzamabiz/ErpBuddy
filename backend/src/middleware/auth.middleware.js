const jwt = require('jsonwebtoken');
const User = require('../modules/core/users/user.model');
const jwtConfig = require('../config/jwt.config');

module.exports = async function authMiddleware(req, res, next) {
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
    
    const user = await User.findById(decoded.userId).populate({ path: 'role', populate: { path: 'permissions' } });
    if (!user) {
      console.log('❌ Auth: User not found for ID:', decoded.userId);
      return res.status(401).json({ success: false, message: 'User not found' });
    }
    console.log('✅ Auth: Request authorized for user:', user.email);
    req.user = user;
    req.user.tenantId = decoded.tenantId;
    req.tenantId = decoded.tenantId; // Set tenantId directly on req for easy access
    next();
  } catch (err) {
    console.log('❌ Auth: Token verification failed:', err.message);
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
};
