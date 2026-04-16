const TrialBalanceService = require('../trialBalance/trialBalance.service');

class BalanceSheetService {
  /**
   * Get Balance Sheet for a tenant
   * Classifies accounts by type and ensures accounting equation: Assets = Liabilities + Equity
   * 
   * @param {ObjectId} tenantId - Tenant ID
   * @returns {Promise<Object>} - Balance sheet with assets, liabilities, equity
   */
  async getBalanceSheet(tenantId) {
    try {
      // 1. Get trial balance data
      const trialBalance = await TrialBalanceService.getTrialBalance(tenantId);

      // 2. Separate accounts by type
      const assets = [];
      const liabilities = [];
      const equity = [];

      let totalAssets = 0;
      let totalLiabilities = 0;
      let totalEquity = 0;

      for (const account of trialBalance.accounts) {
        const accountType = account.accountType?.toLowerCase() || '';
        // Use debit balance for balance sheet (debit - credit)
        const balance = account.totalDebit - account.totalCredit;
        
        const accountData = {
          accountId: account.accountId,
          accountCode: account.accountCode,
          accountName: account.accountName,
          accountType: account.accountType,
          debit: account.totalDebit,
          credit: account.totalCredit,
          balance: Math.round(balance * 100) / 100
        };

        if (accountType.includes('asset')) {
          // Assets: debit positive
          assets.push(accountData);
          totalAssets += Math.max(0, balance); // Only positive balance counts as asset
        } else if (accountType.includes('liability') || accountType.includes('payable')) {
          // Liabilities: credit positive (so negative balance in debit-credit model)
          liabilities.push(accountData);
          totalLiabilities += Math.max(0, -balance); // Reverse sign: liability is negative
        } else if (accountType.includes('equity') || accountType.includes('capital')) {
          // Equity: credit positive (so negative balance in debit-credit model)
          equity.push(accountData);
          totalEquity += Math.max(0, -balance); // Reverse sign: equity is negative
        } else if (balance > 0) {
          // Default: positive = asset
          assets.push(accountData);
          totalAssets += balance;
        } else if (balance < 0) {
          // Default: negative = liability/equity split
          // For simplicity, treat as liability
          liabilities.push(accountData);
          totalLiabilities += Math.abs(balance);
        }
      }

      // 3. Round totals
      totalAssets = Math.round(totalAssets * 100) / 100;
      totalLiabilities = Math.round(totalLiabilities * 100) / 100;
      totalEquity = Math.round(totalEquity * 100) / 100;

      // 4. Calculate difference (should be 0 if balanced)
      const equityFromBalance = totalAssets - totalLiabilities;
      const difference = Math.abs(equityFromBalance - totalEquity);
      const isBalanced = difference < 0.01;

      return {
        tenantId,
        assets: assets.sort((a, b) => b.balance - a.balance),
        totalAssets,
        liabilities: liabilities.sort((a, b) => b.balance - a.balance),
        totalLiabilities,
        equity: equity.sort((a, b) => b.balance - a.balance),
        totalEquity,
        equation: {
          assets: totalAssets,
          liabilities: totalLiabilities,
          equity: totalEquity,
          liabilitiesPlusEquity: Math.round((totalLiabilities + totalEquity) * 100) / 100,
          difference: Math.round(difference * 100) / 100,
          isBalanced
        },
        period: {
          asAtDate: new Date().toISOString().split('T')[0]
        }
      };
    } catch (error) {
      throw new Error(`Balance Sheet Service: ${error.message}`);
    }
  }

  /**
   * Get Balance Sheet Summary
   * @param {ObjectId} tenantId - Tenant ID
   * @returns {Promise<Object>} - Summary only
   */
  async getBalanceSheetSummary(tenantId) {
    try {
      const bs = await this.getBalanceSheet(tenantId);

      return {
        tenantId,
        totalAssets: bs.totalAssets,
        totalLiabilities: bs.totalLiabilities,
        totalEquity: bs.totalEquity,
        equation: bs.equation,
        period: bs.period
      };
    } catch (error) {
      throw new Error(`Balance Sheet Summary Service: ${error.message}`);
    }
  }
}

module.exports = new BalanceSheetService();
