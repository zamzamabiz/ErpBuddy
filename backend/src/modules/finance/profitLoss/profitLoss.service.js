const TrialBalanceService = require('../trialBalance/trialBalance.service');

class ProfitLossService {
  /**
   * Get Profit & Loss Statement for a tenant
   * Calculates revenue, expenses, and net profit
   * 
   * @param {ObjectId} tenantId - Tenant ID
   * @returns {Promise<Object>} - P&L statement with revenue, expenses, net profit
   */
  async getProfitLoss(tenantId) {
    try {
      // 1. Get trial balance data
      const trialBalance = await TrialBalanceService.getTrialBalance(tenantId);

      // 2. Separate accounts by type
      // Revenue: typically credit balance (when credit > debit)
      // Expenses: typically debit balance (when debit > credit)
      
      let totalRevenue = 0;
      let totalExpenses = 0;
      
      const revenueAccounts = [];
      const expenseAccounts = [];

      for (const account of trialBalance.accounts) {
        const balance = account.totalCredit - account.totalDebit; // Credit - Debit for P&L
        
        // Account type determines classification
        // If no type specified, use balance sign: positive = revenue, negative = expense
        const accountType = account.accountType?.toLowerCase() || '';
        
        if (accountType.includes('revenue') || accountType.includes('income') || balance > 0) {
          // Revenue account
          revenueAccounts.push({
            accountId: account.accountId,
            accountCode: account.accountCode,
            accountName: account.accountName,
            accountType: account.accountType,
            amount: Math.abs(balance)
          });
          totalRevenue += Math.abs(balance);
        } else if (accountType.includes('expense') || accountType.includes('cost') || balance < 0) {
          // Expense account
          expenseAccounts.push({
            accountId: account.accountId,
            accountCode: account.accountCode,
            accountName: account.accountName,
            accountType: account.accountType,
            amount: Math.abs(balance)
          });
          totalExpenses += Math.abs(balance);
        }
      }

      // 3. Calculate net profit
      const netProfit = totalRevenue - totalExpenses;

      return {
        tenantId,
        revenueAccounts: revenueAccounts.sort((a, b) => b.amount - a.amount),
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        expenseAccounts: expenseAccounts.sort((a, b) => b.amount - a.amount),
        totalExpenses: Math.round(totalExpenses * 100) / 100,
        netProfit: Math.round(netProfit * 100) / 100,
        profitMarginPercent: totalRevenue > 0 
          ? Math.round((netProfit / totalRevenue * 100) * 100) / 100 
          : 0,
        period: {
          from: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
          to: new Date().toISOString().split('T')[0]
        }
      };
    } catch (error) {
      throw new Error(`Profit Loss Service: ${error.message}`);
    }
  }

  /**
   * Get P&L Summary (simplified view)
   * @param {ObjectId} tenantId - Tenant ID
   * @returns {Promise<Object>} - Summary only
   */
  async getProfitLossSummary(tenantId) {
    try {
      const pl = await this.getProfitLoss(tenantId);
      
      return {
        tenantId,
        totalRevenue: pl.totalRevenue,
        totalExpenses: pl.totalExpenses,
        netProfit: pl.netProfit,
        profitMarginPercent: pl.profitMarginPercent,
        period: pl.period
      };
    } catch (error) {
      throw new Error(`Profit Loss Summary Service: ${error.message}`);
    }
  }
}

module.exports = new ProfitLossService();
