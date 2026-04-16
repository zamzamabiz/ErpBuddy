const BalanceSheetService = require('./balanceSheet.service');

module.exports = {
  /**
   * GET /api/balance-sheet
   * Get full Balance Sheet
   */
  async getBalanceSheet(req, res, next) {
    try {
      const tenantId = req.user.tenantId;

      if (!tenantId) {
        return res.status(400).json({ message: 'Tenant ID not found in user context' });
      }

      const result = await BalanceSheetService.getBalanceSheet(tenantId);

      res.json({
        success: true,
        data: result,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/balance-sheet/summary
   * Get Balance Sheet summary
   */
  async getBalanceSheetSummary(req, res, next) {
    try {
      const tenantId = req.user.tenantId;

      if (!tenantId) {
        return res.status(400).json({ message: 'Tenant ID not found in user context' });
      }

      const result = await BalanceSheetService.getBalanceSheetSummary(tenantId);

      res.json({
        success: true,
        data: result,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }
};
