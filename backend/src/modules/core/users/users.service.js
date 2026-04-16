const BaseService = require('@shared/base.service');
const UsersRepository = require('./users.repository');
const apiResponse = require('@utils/apiResponse');
const auditLogService = require('@services/auditLog.service');
const fileUploadService = require('@services/fileUpload.service');
const bcrypt = require('bcryptjs');

class UsersService extends BaseService {
  constructor() {
    super(UsersRepository);
  }

  async createUser(data, createdBy) {
    // Avatar upload handled externally, expects avatar path in data.avatar
    data.createdBy = createdBy;
    const user = await UsersRepository.create(data);
    await auditLogService.log({ action: 'CREATE_USER', userId: createdBy, entity: 'User', entityId: user._id });
    return apiResponse({ success: true, message: 'User created', data: user });
  }

  async updateUser(companyId, id, data, updatedBy) {
    data.updatedBy = updatedBy;
    const user = await UsersRepository.update(id, companyId, data);
    if (!user) throw new Error('User not found or update failed');
    await auditLogService.log({ action: 'UPDATE_USER', userId: updatedBy, entity: 'User', entityId: id });
    return apiResponse({ success: true, message: 'User updated', data: user });
  }

  async getUsers(companyId, filter = {}) {
    const users = await UsersRepository.findAll(companyId, filter);
    return apiResponse({ success: true, data: users });
  }

  async getUserById(companyId, id) {
    const user = await UsersRepository.findById(id, companyId);
    if (!user) throw new Error('User not found');
    return apiResponse({ success: true, data: user });
  }

  async activateUser(companyId, id, updatedBy) {
    const user = await UsersRepository.update(id, companyId, { isActive: true, status: 'active', updatedBy });
    if (!user) throw new Error('User not found or activate failed');
    await auditLogService.log({ action: 'ACTIVATE_USER', userId: updatedBy, entity: 'User', entityId: id });
    return apiResponse({ success: true, message: 'User activated', data: user });
  }

  async deactivateUser(companyId, id, updatedBy) {
    const user = await UsersRepository.update(id, companyId, { isActive: false, status: 'inactive', updatedBy });
    if (!user) throw new Error('User not found or deactivate failed');
    await auditLogService.log({ action: 'DEACTIVATE_USER', userId: updatedBy, entity: 'User', entityId: id });
    return apiResponse({ success: true, message: 'User deactivated', data: user });
  }

  async changePassword(companyId, id, oldPassword, newPassword, updatedBy) {
    const user = await UsersRepository.findByIdWithPassword(companyId, id);
    if (!user) throw new Error('User not found');
    const valid = await bcrypt.compare(oldPassword, user.password);
    if (!valid) throw new Error('Old password is incorrect');
    user.password = newPassword;
    await user.save();
    await auditLogService.log({ action: 'CHANGE_PASSWORD', userId: updatedBy, entity: 'User', entityId: id });
    return apiResponse({ success: true, message: 'Password changed successfully' });
  }

  async resetPassword(companyId, id, newPassword, updatedBy) {
    const user = await UsersRepository.findByIdWithPassword(companyId, id);
    if (!user) throw new Error('User not found');
    user.password = newPassword;
    await user.save();
    await auditLogService.log({ action: 'RESET_PASSWORD', userId: updatedBy, entity: 'User', entityId: id });
    return apiResponse({ success: true, message: 'Password reset successfully' });
  }

  async deleteUser(companyId, id, deletedBy) {
    const user = await UsersRepository.softDelete(id, companyId);
    if (!user) throw new Error('User not found or delete failed');
    await auditLogService.log({ action: 'DELETE_USER', userId: deletedBy, entity: 'User', entityId: id });
    return apiResponse({ success: true, message: 'User deleted', data: user });
  }
}

module.exports = new UsersService();
