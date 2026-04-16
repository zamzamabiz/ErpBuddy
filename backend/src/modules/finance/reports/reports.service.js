/**
 * Reports Service
 * Handles trial balance, P&L, and other financial reports
 */

const Journal = require('../journal/journal.model');
const JournalLine = require('../journal/journalLine.model');

/**
 * Calculate Trial Balance
 * Aggregates all posted journal entries by account
 * 
 * Returns:
 * - Account Code
 * - Account Name
 * - Account Type
 * - Total Debit
 * - Total Credit
 * - Closing Balance (Debit - Credit)
 */
async function getTrialBalance(tenantId, filters = {}) {
  try {
    // Query for posted journals
    const journalsQuery = {
      tenantId: tenantId,
      status: 'POSTED'
    };

    // Apply date filters if provided
    if (filters.fromDate || filters.toDate) {
      journalsQuery.date = {};
      if (filters.fromDate) {
        journalsQuery.date.$gte = new Date(filters.fromDate);
      }
      if (filters.toDate) {
        const toDate = new Date(filters.toDate);
        toDate.setHours(23, 59, 59, 999); // End of day
        journalsQuery.date.$lte = toDate;
      }
    }

    // Fetch all posted journals IDs
    const journals = await Journal.find(journalsQuery).select('_id');
    const journalIds = journals.map(j => j._id);

    // If no journals found, return empty trial balance
    if (journalIds.length === 0) {
      return {
        accounts: [],
        summary: {
          totalDebit: 0,
          totalCredit: 0,
          isBalanced: true,
          recordCount: 0
        }
      };
    }

    // Query journal lines for these journals
    const linesQuery = {
      journalId: { $in: journalIds },
      tenantId: tenantId
    };

    const lines = await JournalLine.find(linesQuery);

    // Aggregate accounts
    const accountMap = {};

    lines.forEach(line => {
      const accountCode = line.accountCode || line.code;
      const accountName = line.accountName || line.name;
      const accountType = line.accountType || line.type;

      if (!accountCode) return; // Skip if no account code

      if (!accountMap[accountCode]) {
        accountMap[accountCode] = {
          code: accountCode,
          name: accountName,
          type: accountType,
          totalDebit: 0,
          totalCredit: 0
        };
      }

      accountMap[accountCode].totalDebit += parseFloat(line.debit) || 0;
      accountMap[accountCode].totalCredit += parseFloat(line.credit) || 0;
    });

    // Calculate closing balances and create trial balance array
    const trialBalance = Object.values(accountMap).map(account => {
      const closingBalance = account.totalDebit - account.totalCredit;

      return {
        code: account.code,
        name: account.name,
        type: account.type,
        debit: parseFloat(account.totalDebit.toFixed(2)),
        credit: parseFloat(account.totalCredit.toFixed(2)),
        balance: parseFloat(closingBalance.toFixed(2))
      };
    });

    // Calculate totals
    const totalDebit = trialBalance.reduce((sum, acc) => sum + acc.debit, 0);
    const totalCredit = trialBalance.reduce((sum, acc) => sum + acc.credit, 0);
    const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01;

    return {
      accounts: trialBalance,
      summary: {
        totalDebit: parseFloat(totalDebit.toFixed(2)),
        totalCredit: parseFloat(totalCredit.toFixed(2)),
        isBalanced,
        recordCount: trialBalance.length
      }
    };
  } catch (error) {
    throw new Error(`Trial balance calculation failed: ${error.message}`);
  }
}

/**
 * Calculate Profit & Loss (Income Statement)
 * 
 * Returns:
 * - Revenue/Income total
 * - Expense total
 * - Net Profit (Revenue - Expense)
 */
async function getProfitAndLoss(tenantId, filters = {}) {
  try {
    // Get trial balance first
    const trialBalance = await getTrialBalance(tenantId, filters);
    const accounts = trialBalance.accounts || [];

    // Classify accounts
    const revenue = [];
    const expenses = [];
    const other = [];

    accounts.forEach(account => {
      const type = (account.type || '').toLowerCase();

      if (type === 'revenue' || type === 'income' || type === 'sales') {
        revenue.push(account);
      } else if (type === 'expense' || type === 'cost') {
        expenses.push(account);
      } else {
        other.push(account);
      }
    });

    // Calculate totals
    const revenueTotal = revenue.reduce((sum, acc) => sum + acc.credit, 0); // Revenue is typically credit
    const expenseTotal = expenses.reduce((sum, acc) => sum + acc.debit, 0); // Expense is typically debit
    const netProfit = revenueTotal - expenseTotal;

    return {
      revenue: {
        accounts: revenue,
        total: parseFloat(revenueTotal.toFixed(2))
      },
      expenses: {
        accounts: expenses,
        total: parseFloat(expenseTotal.toFixed(2))
      },
      netProfit: parseFloat(netProfit.toFixed(2)),
      revenueCount: revenue.length,
      expenseCount: expenses.length
    };
  } catch (error) {
    throw new Error(`P&L calculation failed: ${error.message}`);
  }
}

/**
 * Get account details from trial balance
 */
async function getAccountDetail(tenantId, accountCode, filters = {}) {
  try {
    // Query for posted journals
    const journalsQuery = {
      tenantId: tenantId,
      status: 'POSTED'
    };

    // Apply date filters
    if (filters.fromDate || filters.toDate) {
      journalsQuery.date = {};
      if (filters.fromDate) {
        journalsQuery.date.$gte = new Date(filters.fromDate);
      }
      if (filters.toDate) {
        const toDate = new Date(filters.toDate);
        toDate.setHours(23, 59, 59, 999);
        journalsQuery.date.$lte = toDate;
      }
    }

    // Get journal IDs
    const journals = await Journal.find(journalsQuery).select('_id date reference source sourceId description');
    const journalIds = journals.map(j => j._id);

    // If no journals, return empty result
    if (journalIds.length === 0) {
      return {
        code: accountCode,
        entries: [],
        summary: {
          totalDebit: 0,
          totalCredit: 0,
          balance: 0,
          entryCount: 0
        }
      };
    }

    // Get journal lines for this account
    const lines = await JournalLine.find({
      journalId: { $in: journalIds },
      tenantId: tenantId,
      accountCode: accountCode
    }).sort({ createdAt: 1 });

    // Build account lines with journal context
    const journalMap = {};
    journals.forEach(j => {
      journalMap[j._id] = j;
    });

    const accountLines = [];
    let totalDebit = 0;
    let totalCredit = 0;

    lines.forEach(line => {
      const journal = journalMap[line.journalId];
      const debit = parseFloat(line.debit) || 0;
      const credit = parseFloat(line.credit) || 0;

      accountLines.push({
        date: journal ? journal.date : line.date,
        journalId: line.journalId,
        description: line.description || (journal ? journal.description : ''),
        debit,
        credit,
        source: journal ? journal.source : 'MANUAL',
        sourceId: journal ? journal.sourceId : null
      });

      totalDebit += debit;
      totalCredit += credit;
    });

    return {
      code: accountCode,
      entries: accountLines,
      summary: {
        totalDebit: parseFloat(totalDebit.toFixed(2)),
        totalCredit: parseFloat(totalCredit.toFixed(2)),
        balance: parseFloat((totalDebit - totalCredit).toFixed(2)),
        entryCount: accountLines.length
      }
    };
  } catch (error) {
    throw new Error(`Account detail retrieval failed: ${error.message}`);
  }
}

module.exports = {
  getTrialBalance,
  getProfitAndLoss,
  getAccountDetail
};
