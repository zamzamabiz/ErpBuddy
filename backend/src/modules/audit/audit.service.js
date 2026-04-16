const Audit = require('./audit.model');

class AuditService {
  static async logAction({
    tenantId,
    userId,
    action,
    module,
    recordId,
    changes = null,
  }) {
    try {
      const audit = new Audit({
        tenantId,
        userId,
        action,
        module,
        recordId,
        changes,
      });

      await audit.save();
      return audit;
    } catch (err) {
      console.error('Audit logging error:', err.message);
      // Don't throw - audit failures should not block operations
    }
  }

  static async getAuditLog(
    tenantId,
    {
      module = null,
      action = null,
      userId = null,
      recordId = null,
      dateFrom = null,
      dateTo = null,
      limit = 100,
      skip = 0,
    } = {}
  ) {
    const query = { tenantId };

    if (module) query.module = module;
    if (action) query.action = action;
    if (userId) query.userId = userId;
    if (recordId) query.recordId = recordId;

    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
      if (dateTo) query.createdAt.$lte = new Date(dateTo);
    }

    const [logs, total] = await Promise.all([
      Audit.find(query)
        .populate('userId', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Math.min(limit, 1000))
        .lean(),
      Audit.countDocuments(query),
    ]);

    return {
      logs,
      total,
      skip,
      limit,
      pages: Math.ceil(total / limit),
    };
  }

  static async getRecordAuditHistory(tenantId, recordId) {
    const logs = await Audit.find({ tenantId, recordId })
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .lean();

    return logs;
  }
}

module.exports = AuditService;
