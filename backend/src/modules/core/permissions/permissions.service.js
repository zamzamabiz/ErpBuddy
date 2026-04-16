const BaseService = require('@shared/base.service');
const PermissionsRepository = require('./permissions.repository');
const Permission = require('./permissions.model');
const apiResponse = require('@utils/apiResponse');
const auditLogService = require('@services/auditLog.service');

class PermissionsService extends BaseService {
  constructor() {
    super(PermissionsRepository);
  }

  async createPermission(data, createdBy) {
    const permission = await PermissionsRepository.create(data);
    await auditLogService.log({ action: 'CREATE_PERMISSION', userId: createdBy, entity: 'Permission', entityId: permission._id });
    return apiResponse({ success: true, message: 'Permission created', data: permission });
  }

  async getPermissions(filter = {}) {
    const permissions = await Permission.find(filter);
    return apiResponse({ success: true, data: permissions });
  }

  async updatePermission(id, data, updatedBy) {
    const permission = await Permission.findByIdAndUpdate(id, data, { new: true });
    if (!permission) throw new Error('Permission not found or update failed');
    await auditLogService.log({ action: 'UPDATE_PERMISSION', userId: updatedBy, entity: 'Permission', entityId: id });
    return apiResponse({ success: true, message: 'Permission updated', data: permission });
  }

  async deletePermission(id, deletedBy) {
    const permission = await Permission.findByIdAndDelete(id);
    if (!permission) throw new Error('Permission not found or delete failed');
    await auditLogService.log({ action: 'DELETE_PERMISSION', userId: deletedBy, entity: 'Permission', entityId: id });
    return apiResponse({ success: true, message: 'Permission deleted', data: permission });
  }

  async seedPermissions(seedList, createdBy) {
    let created = 0;
    for (const perm of seedList) {
      const exists = await PermissionsRepository.findByName(perm.name);
      if (!exists) {
        await PermissionsRepository.create({ ...perm });
        created++;
      }
    }
    await auditLogService.log({ action: 'SEED_PERMISSIONS', userId: createdBy, entity: 'Permission', entityId: null });
    return apiResponse({ success: true, message: `${created} permissions seeded` });
  }

  async assignPermission(companyId, roleId, permissionId, assignedBy) {
    const rp = await PermissionsRepository.assignPermission(companyId, roleId, permissionId, assignedBy);
    await auditLogService.log({ action: 'ASSIGN_PERMISSION', userId: assignedBy, entity: 'RolePermission', entityId: rp._id });
    return apiResponse({ success: true, message: 'Permission assigned', data: rp });
  }

  async removePermission(companyId, roleId, permissionId, removedBy) {
    const rp = await PermissionsRepository.removePermission(companyId, roleId, permissionId);
    await auditLogService.log({ action: 'REMOVE_PERMISSION', userId: removedBy, entity: 'RolePermission', entityId: rp?._id });
    return apiResponse({ success: true, message: 'Permission removed', data: rp });
  }

  async getRolePermissions(companyId, roleId) {
    const perms = await PermissionsRepository.getRolePermissions(companyId, roleId);
    return apiResponse({ success: true, data: perms.map(rp => rp.permissionId) });
  }
}

module.exports = new PermissionsService();
