const TrialBalanceService = require('./trialBalance.service');

module.exports = {
  /**
   * GET /api/trial-balance
   * Get trial balance for tenant
   */
  async getTrialBalance(req, res, next) {
    try {
      const tenantId = req.user.tenantId;
      
      if (!tenantId) {
        return res.status(400).json({ message: 'Tenant ID not found in user context' });
      }

      const result = await TrialBalanceService.getTrialBalance(tenantId);
      
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
