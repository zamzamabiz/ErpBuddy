const BaseRepository = require('@shared/base.repository');
const Role = require('./roles.model');

class RolesRepository extends BaseRepository {
  constructor() {
    super(Role);
  }

  async findByName(companyId, name) {
    return this.model.findOne({ companyId, name, isDeleted: false });
  }

  async assignPermissions(roleId, companyId, permissions) {
    return this.model.findOneAndUpdate(
      { _id: roleId, companyId, isDeleted: false },
      { $addToSet: { permissions: { $each: permissions } } },
      { new: true }
    );
  }

  async removePermission(roleId, companyId, permissionId) {
    return this.model.findOneAndUpdate(
      { _id: roleId, companyId, isDeleted: false },
      { $pull: { permissions: permissionId } },
      { new: true }
    );
  }

  async getPermissions(roleId, companyId) {
    return this.model.findOne({ _id: roleId, companyId, isDeleted: false }, 'permissions');
  }
}

module.exports = new RolesRepository();
