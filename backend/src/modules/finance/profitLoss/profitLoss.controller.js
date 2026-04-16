const ProfitLossService = require('./profitLoss.service');

module.exports = {
  /**
   * GET /api/profit-loss
   * Get Profit & Loss statement
   */
  async getProfitLoss(req, res, next) {
    try {
      const tenantId = req.user.tenantId;

      if (!tenantId) {
        return res.status(400).json({ message: 'Tenant ID not found in user context' });
      }

      const result = await ProfitLossService.getProfitLoss(tenantId);

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
   * GET /api/profit-loss/summary
   * Get P&L summary only
   */
  async getProfitLossSummary(req, res, next) {
    try {
      const tenantId = req.user.tenantId;

      if (!tenantId) {
        return res.status(400).json({ message: 'Tenant ID not found in user context' });
      }

      const result = await ProfitLossService.getProfitLossSummary(tenantId);

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
