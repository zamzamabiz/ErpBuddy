const BaseService = require('@shared/base.service');
const RolesRepository = require('./roles.repository');
const apiResponse = require('@utils/apiResponse');
const auditLogService = require('@services/auditLog.service');

class RolesService extends BaseService {
  constructor() {
    super(RolesRepository);
  }

  async createRole(data, createdBy) {
    data.createdBy = createdBy;
    const role = await RolesRepository.create(data);
    await auditLogService.log({ action: 'CREATE_ROLE', userId: createdBy, entity: 'Role', entityId: role._id });
    return apiResponse({ success: true, message: 'Role created', data: role });
  }

  async updateRole(companyId, id, data, updatedBy) {
    data.updatedBy = updatedBy;
    const role = await RolesRepository.update(id, companyId, data);
    if (!role) throw new Error('Role not found or update failed');
    await auditLogService.log({ action: 'UPDATE_ROLE', userId: updatedBy, entity: 'Role', entityId: id });
    return apiResponse({ success: true, message: 'Role updated', data: role });
  }

  async getRoles(companyId, filter = {}) {
    const roles = await RolesRepository.findAll(companyId, filter);
    return apiResponse({ success: true, data: roles });
  }

  async getRoleById(companyId, id) {
    const role = await RolesRepository.findById(id, companyId);
    if (!role) throw new Error('Role not found');
    return apiResponse({ success: true, data: role });
  }

  async deleteRole(companyId, id, deletedBy) {
    const role = await RolesRepository.softDelete(id, companyId);
    if (!role) throw new Error('Role not found or delete failed');
    await auditLogService.log({ action: 'DELETE_ROLE', userId: deletedBy, entity: 'Role', entityId: id });
    return apiResponse({ success: true, message: 'Role deleted', data: role });
  }

  async assignPermissions(companyId, id, permissions, updatedBy) {
    const role = await RolesRepository.assignPermissions(id, companyId, permissions);
    if (!role) throw new Error('Role not found or assign failed');
    await auditLogService.log({ action: 'ASSIGN_PERMISSIONS', userId: updatedBy, entity: 'Role', entityId: id });
    return apiResponse({ success: true, message: 'Permissions assigned', data: role });
  }

  async getRolePermissions(companyId, id) {
    const role = await RolesRepository.getPermissions(id, companyId);
    if (!role) throw new Error('Role not found');
    return apiResponse({ success: true, data: role.permissions || [] });
  }

  async removePermission(companyId, id, permissionId, updatedBy) {
    const role = await RolesRepository.removePermission(id, companyId, permissionId);
    if (!role) throw new Error('Role not found or remove failed');
    await auditLogService.log({ action: 'REMOVE_PERMISSION', userId: updatedBy, entity: 'Role', entityId: id });
    return apiResponse({ success: true, message: 'Permission removed', data: role });
  }
}

module.exports = new RolesService();
