const jwt = require('jsonwebtoken');
const jwtConfig = require('@config/jwt.config');

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('[AuthVal] ❌ No Bearer token in header');
    return res.status(401).json({ success: false, message: 'No token provided' });
  }
  const token = authHeader.split(' ')[1];
  console.log('[AuthVal] Verifying token with secret:', jwtConfig.secret ? 'SET' : 'MISSING');
  try {
    const decoded = jwt.verify(token, jwtConfig.secret);
    console.log('[AuthVal] ✅ Token verified for user:', decoded.email);
    req.user = decoded;
    next();
  } catch (err) {
    console.log('[AuthVal] ❌ Token verification failed:', err.message);
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

module.exports = { authMiddleware };
