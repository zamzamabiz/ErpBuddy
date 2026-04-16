const TrialBalanceService = require('../finance/trialBalance/trialBalance.service');
const AccountService = require('../accounting/account.service');

/**
 * DASHBOARD SERVICE
 * Calculates key metrics for the dashboard
 */
class DashboardService {
  /**
   * GET DASHBOARD METRICS
   * Calculates total sales, COGS, gross profit, and stock value
   * 
   * @param {string} tenantId - Tenant ID
   * @param {Date} asOfDate - Date to calculate metrics as of
   * @returns {Object} Dashboard metrics
   */
  static async getDashboardMetrics(tenantId, asOfDate = null) {
    // Get trial balance
    const trialBalance = await TrialBalanceService.getTrialBalance(tenantId, asOfDate);
    
    if (!trialBalance.isBalanced) {
      console.warn('Trial balance is not balanced, metrics may be inaccurate');
    }

    // Get system accounts for reference
    const systemAccounts = await AccountService.getSystemAccounts(tenantId);
    
    // Find specific account codes
    const inventoryAccountCode = this.findAccountCode(systemAccounts, 'ASSET', 'inventory');
    const cogsAccountCode = this.findAccountCode(systemAccounts, 'EXPENSE', 'cogs');

    // Calculate Total Sales (all INCOME accounts)
    const salesAccounts = trialBalance.accounts.filter(a => a.account.type === 'INCOME');
    const totalSales = salesAccounts.reduce((sum, a) => sum + (a.credit - a.debit), 0);

    // Calculate COGS (only COGS account)
    let cogs = 0;
    if (cogsAccountCode) {
      const cogsAccount = trialBalance.accounts.find(a => a.account.code === cogsAccountCode);
      if (cogsAccount) {
        cogs = cogsAccount.debit - cogsAccount.credit;
      }
    }

    // Calculate Gross Profit
    const grossProfit = totalSales - cogs;

    // Calculate Stock Value (only inventory account)
    let stockValue = 0;
    if (inventoryAccountCode) {
      const inventoryAccount = trialBalance.accounts.find(a => a.account.code === inventoryAccountCode);
      if (inventoryAccount) {
        stockValue = inventoryAccount.debit - inventoryAccount.credit;
      }
    }

    return {
      asOfDate: asOfDate || new Date(),
      totalSales: parseFloat(totalSales.toFixed(2)),
      cogs: parseFloat(cogs.toFixed(2)),
      grossProfit: parseFloat(grossProfit.toFixed(2)),
      stockValue: parseFloat(stockValue.toFixed(2)),
      isProfitable: grossProfit >= 0,
      trialBalanceBalanced: trialBalance.isBalanced
    };
  }

  /**
   * Find account code by type and keyword
   */
  static findAccountCode(accounts, type, keyword) {
    if (!accounts || typeof accounts !== 'object') return null;
    
    const accountEntries = Object.values(accounts);
    
    // First try to find account with keyword in name
    const byName = accountEntries.find(a => 
      a.type === type && 
      a.name && 
      a.name.toLowerCase().includes(keyword.toLowerCase())
    );
    
    if (byName) return byName.code;
    
    // Fallback: find first account of type that is system
    const byType = accountEntries.find(a => 
      a.type === type && a.isSystem
    );
    
    return byType ? byType.code : null;
  }
}

module.exports = DashboardService;