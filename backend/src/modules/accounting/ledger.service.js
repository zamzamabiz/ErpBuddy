const Journal = require('../finance/journal/journal.model');
const JournalLine = require('../finance/journal/journalLine.model');
const Account = require('./accounts/account.model');

/**
 * LEDGER SERVICE - Account Ledger Generation
 * Provides detailed transaction history for any account
 */
class LedgerService {
  /**
   * GET LEDGER FOR AN ACCOUNT
   * Returns all journal entries for an account with running balance
   * 
   * @param {string} accountId - Account ID to get ledger for
   * @param {Date} fromDate - Start date (optional)
   * @param {Date} toDate - End date (optional)
   * @param {string} tenantId - Tenant ID for isolation
   * @returns {Object} Ledger with entries and running balance
   */
  static async getLedger(accountId, fromDate, toDate, tenantId) {
    // Validate account exists and belongs to tenant
    const account = await Account.findOne({ 
      _id: accountId, 
      tenantId,
      deletedAt: null 
    });

    if (!account) {
      throw new Error('Account not found or does not belong to this tenant');
    }

    const isAssetOrExpense = ['ASSET', 'EXPENSE'].includes(account.type);

    // Step 1: Calculate opening balance (entries BEFORE fromDate)
    let openingBalance = 0;
    if (fromDate) {
      const preEntries = await JournalLine.find({
        accountId: accountId,
        tenantId: tenantId
      }).populate('journalId');

      for (const entry of preEntries) {
        if (!entry.journalId || !entry.journalId.date) continue;
        if (entry.journalId.date < new Date(fromDate)) {
          const debit = entry.debit || 0;
          const credit = entry.credit || 0;
          if (isAssetOrExpense) {
            openingBalance += debit - credit;
          } else {
            openingBalance += credit - debit;
          }
        }
      }
    }

    // Step 2: Build date filter for ledger entries
    const dateFilter = {};
    if (fromDate) dateFilter.$gte = new Date(fromDate);
    if (toDate) dateFilter.$lte = new Date(toDate);

    // Step 3: Get journal lines with journal details, sorted by date ASC, _id ASC
    const query = {
      accountId: accountId,
      tenantId: tenantId
    };

    const journalLines = await JournalLine.find(query)
      .populate({
        path: 'journalId',
        match: dateFilter ? { date: dateFilter } : {},
        select: 'date reference description source status'
      })
      .sort({ 'journalId.date': 1, '_id': 1 })
      .lean();

    // Filter out lines where journalId is null (didn't match date filter)
    const filteredLines = journalLines.filter(line => line.journalId !== null);

    // Step 4: Calculate running balance starting from opening balance
    let runningBalance = openingBalance;
    const entries = filteredLines.map(line => {
      const debit = line.debit || 0;
      const credit = line.credit || 0;

      // Update running balance based on account type
      if (isAssetOrExpense) {
        runningBalance += debit - credit;
      } else {
        runningBalance += credit - debit;
      }

      return {
        date: line.journalId.date,
        reference: line.journalId.reference,
        description: line.description || line.journalId.description,
        source: line.journalId.source,
        debit: debit,
        credit: credit,
        balance: runningBalance,
        journalId: line.journalId._id
      };
    });

    // Calculate totals
    const totalDebit = entries.reduce((sum, entry) => sum + entry.debit, 0);
    const totalCredit = entries.reduce((sum, entry) => sum + entry.credit, 0);

    return {
      account: {
        _id: account._id,
        code: account.code,
        name: account.name,
        type: account.type
      },
      fromDate: fromDate || null,
      toDate: toDate || null,
      openingBalance: openingBalance,
      totalDebit: totalDebit,
      totalCredit: totalCredit,
      closingBalance: runningBalance,
      entries: entries,
      entryCount: entries.length
    };
  }

  /**
   * GET TRIAL BALANCE
   * Returns all accounts with their balances for a period
   * Verifies total debit = total credit
   */
  static async getTrialBalance(tenantId, asOfDate = null) {
    const dateFilter = {};
    if (asOfDate) {
      dateFilter.date = { $lte: new Date(asOfDate) };
    }

    // Get all accounts for tenant
    const accounts = await Account.find({ 
      tenantId, 
      deletedAt: null,
      allowPosting: true
    }).lean();

    const trialBalance = [];

    for (const account of accounts) {
      // Get all journal lines for this account
      const query = {
        accountId: account._id,
        tenantId: tenantId
      };

      const lines = await JournalLine.find(query).lean();
      
      let totalDebit = 0;
      let totalCredit = 0;

      for (const line of lines) {
        totalDebit += line.debit || 0;
        totalCredit += line.credit || 0;
      }

      // Calculate balance based on account type
      const balance = account.type === 'ASSET' || account.type === 'EXPENSE'
        ? totalDebit - totalCredit
        : totalCredit - totalDebit;

      trialBalance.push({
        account: {
          _id: account._id,
          code: account.code,
          name: account.name,
          type: account.type
        },
        debit: totalDebit,
        credit: totalCredit,
        balance: balance,
        balanceType: balance >= 0 ? 'DEBIT' : 'CREDIT'
      });
    }

    // Calculate totals
    const totalDebits = trialBalance.reduce((sum, item) => sum + item.debit, 0);
    const totalCredits = trialBalance.reduce((sum, item) => sum + item.credit, 0);

    return {
      asOfDate: asOfDate || new Date(),
      accounts: trialBalance,
      totalDebits: totalDebits,
      totalCredits: totalCredits,
      isBalanced: Math.abs(totalDebits - totalCredits) < 0.01
    };
  }

  /**
   * GET ACCOUNT BALANCE
   * Quick balance check for an account
   */
  static async getAccountBalance(accountId, tenantId, asOfDate = null) {
    const account = await Account.findOne({ 
      _id: accountId, 
      tenantId,
      deletedAt: null 
    });

    if (!account) {
      throw new Error('Account not found');
    }

    const query = {
      accountId: accountId,
      tenantId: tenantId
    };

    const lines = await JournalLine.find(query).lean();
    
    let totalDebit = 0;
    let totalCredit = 0;

    for (const line of lines) {
      totalDebit += line.debit || 0;
      totalCredit += line.credit || 0;
    }

    const balance = account.type === 'ASSET' || account.type === 'EXPENSE'
      ? totalDebit - totalCredit
      : totalCredit - totalDebit;

    return {
      account: {
        _id: account._id,
        code: account.code,
        name: account.name,
        type: account.type
      },
      debit: totalDebit,
      credit: totalCredit,
      balance: balance,
      balanceType: balance >= 0 ? 'DEBIT' : 'CREDIT'
    };
  }
}

module.exports = LedgerService;