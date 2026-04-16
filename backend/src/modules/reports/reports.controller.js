/**
 * 📊 REPORTS CONTROLLER
 * ========================
 * Handles HTTP requests for financial reports
 * Ledger, Trial Balance, and other accounting reports
 */

const ledgerService = require('./ledger.service');
const trialBalanceService = require('./trialBalance.service');
const mongoose = require('mongoose');

module.exports = {
  /**
   * 🔷 GET GENERAL LEDGER FOR ACCOUNT
   * GET /api/reports/ledger/:accountId
   * Query params: fromDate, toDate
   */
  async getLedger(req, res, next) {
    try {
      const { accountId } = req.params;
      const { fromDate, toDate, includeOpening } = req.query;
      const tenantId = req.user.tenantId;

      // Validate account ID format
      if (!mongoose.Types.ObjectId.isValid(accountId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid account ID format'
        });
      }

      console.log(`\n🔵 Ledger Report Request`);
      console.log(`  Account ID: ${accountId}`);
      console.log(`  From Date: ${fromDate || 'N/A'}`);
      console.log(`  To Date: ${toDate || 'N/A'}`);
      console.log(`  Include Opening: ${includeOpening || 'false'}`);

      let result;
      if (includeOpening && fromDate) {
        result = await ledgerService.getLedgerWithOpeningBalance(
          accountId,
          tenantId,
          fromDate,
          toDate
        );
      } else {
        result = await ledgerService.getLedger(
          accountId,
          tenantId,
          fromDate || null,
          toDate || null
        );
      }

      res.json(result);
    } catch (err) {
      console.error('❌ getLedger Error:', err.message);
      next(err);
    }
  },

  /**
   * 🔷 GET TRIAL BALANCE
   * GET /api/reports/trial-balance
   * Query params: fromDate, toDate, byType
   */
  async getTrialBalance(req, res, next) {
    try {
      const { fromDate, toDate, byType } = req.query;
      const tenantId = req.user.tenantId;

      console.log(`\n🔵 Trial Balance Report Request`);
      console.log(`  From Date: ${fromDate || 'N/A'}`);
      console.log(`  To Date: ${toDate || 'N/A'}`);
      console.log(`  By Type: ${byType === 'true' ? 'YES' : 'NO'}`);

      let result;
      if (byType === 'true') {
        result = await trialBalanceService.getTrialBalanceByType(
          tenantId,
          fromDate || null,
          toDate || null
        );
      } else {
        result = await trialBalanceService.getTrialBalance(
          tenantId,
          fromDate || null,
          toDate || null
        );
      }

      res.json(result);
    } catch (err) {
      console.error('❌ getTrialBalance Error:', err.message);
      next(err);
    }
  },

  /**
   * 🔷 GET FINANCIAL SUMMARY
   * GET /api/reports/summary
   * Quick financial overview
   */
  async getSummary(req, res, next) {
    try {
      const tenantId = req.user.tenantId;
      const { fromDate, toDate } = req.query;

      console.log(`\n🔵 Financial Summary Request`);

      const trialBalance = await trialBalanceService.getTrialBalance(
        tenantId,
        fromDate || null,
        toDate || null
      );

      // Calculate summary metrics
      const assets = trialBalance.accounts
        .filter(a => a.type === 'asset')
        .reduce((sum, a) => sum + a.balance, 0);

      const liabilities = trialBalance.accounts
        .filter(a => a.type === 'liability')
        .reduce((sum, a) => sum + a.balance, 0);

      const equity = trialBalance.accounts
        .filter(a => a.type === 'equity')
        .reduce((sum, a) => sum + a.balance, 0);

      const income = trialBalance.accounts
        .filter(a => a.type === 'income')
        .reduce((sum, a) => sum + Math.abs(a.balance), 0);

      const expenses = trialBalance.accounts
        .filter(a => a.type === 'expense')
        .reduce((sum, a) => sum + a.balance, 0);

      const netIncome = income - expenses;

      res.json({
        success: true,
        period: trialBalance.period,
        financialPosition: {
          assets: parseFloat(assets.toFixed(2)),
          liabilities: parseFloat(liabilities.toFixed(2)),
          equity: parseFloat(equity.toFixed(2))
        },
        profitAndLoss: {
          income: parseFloat(income.toFixed(2)),
          expenses: parseFloat(expenses.toFixed(2)),
          netIncome: parseFloat(netIncome.toFixed(2))
        },
        verification: {
          isBalanced: trialBalance.isBalanced,
          variance: trialBalance.variance
        }
      });
    } catch (err) {
      console.error('❌ getSummary Error:', err.message);
      next(err);
    }
  }
};

