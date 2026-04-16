/**
 * Role-based access control middleware
 * Checks if user has one of the required roles
 * Usage: allowRoles('admin'), allowRoles('admin', 'staff')
 */
function allowRoles(...requiredRoles) {
  return (req, res, next) => {
    if (!req.userRole) {
      return res.status(401).json({
        success: false,
        error: 'User role not found in token'
      });
    }

    if (!requiredRoles.includes(req.userRole)) {
      return res.status(403).json({
        success: false,
        error: 'Access Denied: Insufficient permissions',
        requiredRoles,
        userRole: req.userRole
      });
    }

    next();
  };
}

module.exports = allowRoles;
