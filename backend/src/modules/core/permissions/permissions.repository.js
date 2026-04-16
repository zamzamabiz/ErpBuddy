const BaseRepository = require('@shared/base.repository');
const Permission = require('./permissions.model');
const RolePermission = require('./rolePermission.model');

class PermissionsRepository extends BaseRepository {
  constructor() {
    super(Permission);
  }

  async findByName(name) {
    return this.model.findOne({ name });
  }

  async assignPermission(companyId, roleId, permissionId, assignedBy) {
    return RolePermission.create({ companyId, roleId, permissionId, assignedBy });
  }

  async removePermission(companyId, roleId, permissionId) {
    return RolePermission.findOneAndDelete({ companyId, roleId, permissionId });
  }

  async getRolePermissions(companyId, roleId) {
    return RolePermission.find({ companyId, roleId }).populate('permissionId');
  }
}

module.exports = new PermissionsRepository();
