const LedgerService = require('./ledger.service');

module.exports = {
  /**
   * GET /api/ledger/:accountId
   * Get ledger (account statement) for an account
   */
  async getLedger(req, res, next) {
    try {
      const tenantId = req.user.tenantId;
      const accountId = req.params.accountId;

      if (!tenantId) {
        return res.status(400).json({ message: 'Tenant ID not found in user context' });
      }

      if (!accountId) {
        return res.status(400).json({ message: 'Account ID is required' });
      }

      const result = await LedgerService.getLedger(tenantId, accountId);

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
   * GET /api/ledger/:accountId/summary
   * Get ledger summary (quick lookup without full entries)
   */
  async getLedgerSummary(req, res, next) {
    try {
      const tenantId = req.user.tenantId;
      const accountId = req.params.accountId;

      if (!tenantId) {
        return res.status(400).json({ message: 'Tenant ID not found in user context' });
      }

      if (!accountId) {
        return res.status(400).json({ message: 'Account ID is required' });
      }

      const result = await LedgerService.getLedgerSummary(tenantId, accountId);

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
