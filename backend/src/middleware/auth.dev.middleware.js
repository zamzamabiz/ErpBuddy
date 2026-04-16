// Dev mode auth middleware - bypass for testing
function authDevMiddleware(req, res, next) {
  // Check for any authorization header (dev mode bypass)
  const authHeader = req.headers.authorization;
  
  // DEV MODE: Always allow access with dev user
  // This bypasses JWT validation for development
  req.user = {
    id: 'dev-user-id',
    role: 'admin',
    tenantId: '69dd0cb31c5468a5b63511b7',
    companyId: '69dd0cb31c5468a5b63511b7',
    userId: 'dev-user-id',
    email: 'dev@erpbuddy.com'
  };
  // Set userRole for role middleware compatibility
  req.userRole = 'admin';
  console.log('🔓 DEV MODE: Auth bypassed for', req.path);
  return next();
}

module.exports = authDevMiddleware;