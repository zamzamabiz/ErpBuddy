module.exports = function checkPermission(module, action) {
  return (req, res, next) => {
    const user = req.user;
    if (!user || !user.role || !user.role.permissions) {
      return res.status(403).json({ success: false, message: 'Access denied: No role or permissions' });
    }
    const hasPermission = user.role.permissions.some(
      (perm) => perm.module === module && perm.action === action
    );
    if (!hasPermission) {
      return res.status(403).json({ success: false, message: 'Access denied: Insufficient permission' });
    }
    next();
  };
};