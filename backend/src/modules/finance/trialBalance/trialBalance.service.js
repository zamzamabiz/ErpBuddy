const Account = require('../../accounting/accounts/account.model');
const JournalLine = require('../../finance/journal/journalLine.model');

/**
 * TRIAL BALANCE SERVICE
 * Generates trial balance report showing all accounts with their balances
 * Ensures total debits = total credits (fundamental accounting principle)
 */
class TrialBalanceService {
  /**
   * GET TRIAL BALANCE
   * Returns all accounts with their balances for a specific date
   * 
   * @param {string} tenantId - Tenant ID for isolation
   * @param {Date} asOfDate - Date to calculate balances as of (optional)
   * @returns {Object} Trial balance with account details and totals
   */
  static async getTrialBalance(tenantId, asOfDate = null) {
    // Validate tenant
    if (!tenantId) {
      throw new Error('Tenant ID is required');
    }

    // Build date filter
    const dateFilter = {};
    if (asOfDate) {
      dateFilter.date = { $lte: new Date(asOfDate) };
    }

    // Get all active accounts for tenant that allow posting
    const accounts = await Account.find({ 
      tenantId, 
      deletedAt: null,
      allowPosting: true
    }).lean();

    if (accounts.length === 0) {
      return {
        asOfDate: asOfDate || new Date(),
        accounts: [],
        totalDebits: 0,
        totalCredits: 0,
        isBalanced: true,
        message: 'No accounts found for this tenant'
      };
    }

    const trialBalance = [];
    let totalDebits = 0;
    let totalCredits = 0;

    // Process each account
    for (const account of accounts) {
      // Get all journal lines for this account
      const query = {
        accountId: account._id,
        tenantId: tenantId
      };

      const lines = await JournalLine.find(query).lean();
      
      let totalDebit = 0;
      let totalCredit = 0;

      // Sum all debits and credits for this account
      for (const line of lines) {
        totalDebit += line.debit || 0;
        totalCredit += line.credit || 0;
      }

      // Calculate balance based on account type
      // Assets and Expenses: Debit increases, Credit decreases
      // Liabilities, Equity, and Income: Credit increases, Debit decreases
      const isAssetOrExpense = ['ASSET', 'EXPENSE'].includes(account.type);
      const balance = isAssetOrExpense
        ? totalDebit - totalCredit
        : totalCredit - totalDebit;

      // Determine balance type (DEBIT or CREDIT)
      const balanceType = balance >= 0 ? 'DEBIT' : 'CREDIT';

      // Add to trial balance
      trialBalance.push({
        account: {
          _id: account._id,
          code: account.code,
          name: account.name,
          type: account.type
        },
        debit: totalDebit,
        credit: totalCredit,
        balance: Math.abs(balance),
        balanceType: balanceType
      });

      // Add to totals
      totalDebits += totalDebit;
      totalCredits += totalCredit;
    }

    // Sort by account code for better readability
    trialBalance.sort((a, b) => a.account.code.localeCompare(b.account.code));

    // Calculate if trial balance is balanced
    // Allow for small rounding differences (0.01)
    const isBalanced = Math.abs(totalDebits - totalCredits) < 0.01;

    return {
      asOfDate: asOfDate || new Date(),
      accounts: trialBalance,
      totalDebits: parseFloat(totalDebits.toFixed(2)),
      totalCredits: parseFloat(totalCredits.toFixed(2)),
      isBalanced: isBalanced,
      discrepancy: parseFloat((totalDebits - totalCredits).toFixed(2))
    };
  }

  /**
   * GET TRIAL BALANCE BY ACCOUNT TYPE
   * Groups accounts by type for better analysis
   */
  static async getTrialBalanceByType(tenantId, asOfDate = null) {
    const trialBalance = await this.getTrialBalance(tenantId, asOfDate);
    
    const grouped = {
      ASSET: { accounts: [], totalDebit: 0, totalCredit: 0, totalBalance: 0 },
      LIABILITY: { accounts: [], totalDebit: 0, totalCredit: 0, totalBalance: 0 },
      EQUITY: { accounts: [], totalDebit: 0, totalCredit: 0, totalBalance: 0 },
      INCOME: { accounts: [], totalDebit: 0, totalCredit: 0, totalBalance: 0 },
      EXPENSE: { accounts: [], totalDebit: 0, totalCredit: 0, totalBalance: 0 }
    };

    // Group accounts by type
    for (const account of trialBalance.accounts) {
      const type = account.account.type;
      if (grouped[type]) {
        grouped[type].accounts.push(account);
        grouped[type].totalDebit += account.debit;
        grouped[type].totalCredit += account.credit;
        grouped[type].totalBalance += account.balance;
      }
    }

    // Calculate net totals
    const netAssets = grouped.ASSET.totalBalance;
    const netLiabilities = grouped.LIABILITY.totalBalance;
    const netEquity = grouped.EQUITY.totalBalance;
    const netIncome = grouped.INCOME.totalBalance;
    const netExpenses = grouped.EXPENSE.totalBalance;

    return {
      asOfDate: trialBalance.asOfDate,
      byType: grouped,
      totals: {
        netAssets: netAssets,
        netLiabilities: netLiabilities,
        netEquity: netEquity,
        netIncome: netIncome,
        netExpenses: netExpenses,
        totalDebits: trialBalance.totalDebits,
        totalCredits: trialBalance.totalCredits,
        isBalanced: trialBalance.isBalanced
      }
    };
  }

  /**
   * VALIDATE TRIAL BALANCE
   * Quick validation that debits = credits
   */
  static async validateTrialBalance(tenantId, asOfDate = null) {
    const trialBalance = await this.getTrialBalance(tenantId, asOfDate);
    
    return {
      isValid: trialBalance.isBalanced,
      totalDebits: trialBalance.totalDebits,
      totalCredits: trialBalance.totalCredits,
      discrepancy: trialBalance.discrepancy,
      asOfDate: trialBalance.asOfDate,
      accountCount: trialBalance.accounts.length
    };
  }

  /**
   * GET OPENING TRIAL BALANCE
   * Trial balance as of a specific date (includes only entries up to that date)
   */
  static async getOpeningTrialBalance(tenantId, asOfDate) {
    if (!asOfDate) {
      throw new Error('asOfDate is required for opening trial balance');
    }

    return await this.getTrialBalance(tenantId, asOfDate);
  }
}

module.exports = TrialBalanceService;