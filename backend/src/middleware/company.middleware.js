const jwt = require('jsonwebtoken');
const jwtConfig = require('../config/jwt.config');

module.exports = async function companyMiddleware(req, res, next) {
  try {
    // Extract tenantId from token or header
    const authHeader = req.headers.authorization;
    let tenantId = null;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        const decoded = jwt.verify(token, jwtConfig.secret);
        tenantId = decoded.tenantId;
      } catch (err) {
        // Token verification failed, continue without tenantId
      }
    }
    
    // Fallback to header if not in token
    if (!tenantId) {
      tenantId = req.headers['x-tenant-id'] || req.headers['tenantid'];
    }
    
    // Attach tenantId to request for multi-tenant isolation
    req.tenantId = tenantId;
    
    next();
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};