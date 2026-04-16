// Generic Audit Log Service
class AuditLogService {
  async log({ action, userId, entity, entityId, details = {} }) {
    // Placeholder: integrate with AuditLog model in future
    // Example: await AuditLog.create({ action, userId, entity, entityId, details });
    // For now, just print to console
    console.log('[AUDIT]', { action, userId, entity, entityId, details });
  }
}

module.exports = new AuditLogService();
