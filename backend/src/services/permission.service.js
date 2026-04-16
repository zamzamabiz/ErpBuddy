// Generic Permission Service
class PermissionService {
  hasPermission(user, permission) {
    return user && user.permissions && user.permissions.includes(permission);
  }
}

module.exports = new PermissionService();
