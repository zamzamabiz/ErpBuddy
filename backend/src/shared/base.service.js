class BaseService {
  constructor(repository) {
    this.repository = repository;
  }

  async validate(data, validator) {
    if (!validator) return data;
    return validator.validateAsync(data);
  }

  async checkPermission(user, permission) {
    if (!user.permissions || !user.permissions.includes(permission)) {
      throw new Error('Permission denied');
    }
  }

  async auditLog(action, userId, entity, entityId, details = {}) {
    // Placeholder: integrate with auditLog.service.js
    // await auditLogService.log({ action, userId, entity, entityId, details });
  }

  // Business logic hooks can be added here
}

module.exports = BaseService;
