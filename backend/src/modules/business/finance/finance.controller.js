const financeService = require('./finance.service');
const validation = require('./finance.validation');

module.exports = {
  async generalLedger(req, res, next) {
    try {
      await validation.generalLedger.validateAsync(req.query);
      const result = await financeService.generalLedger(req.query);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },
  async trialBalance(req, res, next) {
    try {
      await validation.trialBalance.validateAsync(req.query);
      const result = await financeService.trialBalance(req.query);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },
  async profitLoss(req, res, next) {
    try {
      await validation.profitLoss.validateAsync(req.query);
      const result = await financeService.profitLoss(req.query);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },
  async balanceSheet(req, res, next) {
    try {
      await validation.balanceSheet.validateAsync(req.query);
      const result = await financeService.balanceSheet(req.query);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
};
