const AuditService = require('./audit.service');

class AuditController {
  static async getAuditLog(req, res) {
    try {
      const tenantId = req.user.tenantId;
      const { module, action, userId, recordId, dateFrom, dateTo, limit, skip } = req.query;

      const result = await AuditService.getAuditLog(tenantId, {
        module: module || null,
        action: action || null,
        userId: userId || null,
        recordId: recordId || null,
        dateFrom: dateFrom || null,
        dateTo: dateTo || null,
        limit: parseInt(limit) || 100,
        skip: parseInt(skip) || 0,
      });

      res.status(200).json({
        success: true,
        data: result.logs,
        pagination: {
          total: result.total,
          limit: result.limit,
          skip: result.skip,
          pages: result.pages,
        },
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        message: err.message,
      });
    }
  }

  static async getRecordHistory(req, res) {
    try {
      const tenantId = req.user.tenantId;
      const { recordId } = req.params;

      const logs = await AuditService.getRecordAuditHistory(tenantId, recordId);

      res.status(200).json({
        success: true,
        data: logs,
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        message: err.message,
      });
    }
  }
}

module.exports = AuditController;
