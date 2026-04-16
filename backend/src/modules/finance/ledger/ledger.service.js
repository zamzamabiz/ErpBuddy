const JournalLine = require('../journal/journalLine.model');

class LedgerService {
  /**
   * Get Ledger (Account Statement) for a specific account
   * Calculates running balance by processing journal lines chronologically
   * 
   * @param {ObjectId} tenantId - Tenant ID
   * @param {ObjectId} accountId - Account ID
   * @returns {Promise<Array>} - Ledger entries with running balance
   */
  async getLedger(tenantId, accountId) {
    try {
      // 1. Fetch all journal lines for this account and tenant, sorted by date
      const lines = await JournalLine.find({
        tenantId,
        accountId
      })
        .populate('journalId', 'date description')
        .sort({ createdAt: 1 })
        .lean();

      // 2. Build ledger with running balance
      let runningBalance = 0;
      const ledgerEntries = [];

      for (const line of lines) {
        const entryDebit = line.debit || 0;
        const entryCredit = line.credit || 0;
        
        // Calculate running balance: debit increases, credit decreases
        runningBalance += entryDebit - entryCredit;

        ledgerEntries.push({
          journalLineId: line._id,
          journalId: line.journalId?._id || line.journalId,
          date: line.journalId?.date || line.createdAt,
          description: line.journalId?.description || line.description || '',
          debit: Math.round(entryDebit * 100) / 100,
          credit: Math.round(entryCredit * 100) / 100,
          balance: Math.round(runningBalance * 100) / 100
        });
      }

      return {
        tenantId,
        accountId,
        entries: ledgerEntries,
        totalDebit: Math.round(
          ledgerEntries.reduce((sum, e) => sum + e.debit, 0) * 100
        ) / 100,
        totalCredit: Math.round(
          ledgerEntries.reduce((sum, e) => sum + e.credit, 0) * 100
        ) / 100,
        finalBalance: runningBalance >= 0 ? Math.round(runningBalance * 100) / 100 : Math.round(runningBalance * 100) / 100,
        entryCount: ledgerEntries.length
      };
    } catch (error) {
      throw new Error(`Ledger Service: ${error.message}`);
    }
  }

  /**
   * Get Ledger Summary (without full entries - for quick lookup)
   * @param {ObjectId} tenantId - Tenant ID
   * @param {ObjectId} accountId - Account ID
   * @returns {Promise<Object>} - Summary only
   */
  async getLedgerSummary(tenantId, accountId) {
    try {
      const lines = await JournalLine.find({
        tenantId,
        accountId
      }).lean();

      let totalDebit = 0;
      let totalCredit = 0;

      for (const line of lines) {
        totalDebit += line.debit || 0;
        totalCredit += line.credit || 0;
      }

      return {
        tenantId,
        accountId,
        totalDebit: Math.round(totalDebit * 100) / 100,
        totalCredit: Math.round(totalCredit * 100) / 100,
        balance: Math.round((totalDebit - totalCredit) * 100) / 100,
        entryCount: lines.length
      };
    } catch (error) {
      throw new Error(`Ledger Summary Service: ${error.message}`);
    }
  }
}

module.exports = new LedgerService();
