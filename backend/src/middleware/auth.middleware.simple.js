const jwt = require('jsonwebtoken');
const jwtConfig = require('../config/jwt.config');

const JWT_SECRET = jwtConfig.secret;

/**
 * Auth middleware - Verify JWT token and attach user data to request
 * Expects: Authorization: Bearer <token>
 */
function authMiddleware(req, res, next) {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'No token provided. Include "Authorization: Bearer <token>" header'
      });
    }

    const token = authHeader.split(' ')[1];

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);

    // Attach user data to request
    req.userId = decoded.userId;
    req.tenantId = decoded.tenantId;
    req.companyId = decoded.companyId || decoded.tenantId;  // Map tenantId to companyId
    req.email = decoded.email;
    req.userRole = decoded.userRole;  // Attach role from JWT

    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      return res.status(401).json({
        success: false,
        error: 'Token expired'
      });
    }
    return res.status(401).json({
      success: false,
      error: 'Invalid token'
    });
  }
}

module.exports = authMiddleware;
