const JournalEntry = require('../../engines/accountingEngine/journalEntry.model');
const ChartOfAccounts = require('../../masters/chartOfAccounts/chartOfAccounts.model');
const mongoose = require('mongoose');

class FinanceService {
  async generalLedger({ accountId, fromDate, toDate }) {
    const match = { 'lines.account': mongoose.Types.ObjectId(accountId) };
    if (fromDate) match.journalDate = { $gte: new Date(fromDate) };
    if (toDate) match.journalDate = Object.assign(match.journalDate || {}, { $lte: new Date(toDate) });
    const entries = await JournalEntry.find(match, { lines: 1, journalDate: 1, journalNumber: 1, description: 1 })
      .sort({ journalDate: 1 });
    let runningBalance = 0;
    const ledger = [];
    for (const entry of entries) {
      for (const line of entry.lines.filter(l => l.account.toString() === accountId)) {
        runningBalance += (line.debit || 0) - (line.credit || 0);
        ledger.push({
          journalDate: entry.journalDate,
          journalNumber: entry.journalNumber,
          description: entry.description,
          debit: line.debit,
          credit: line.credit,
          balance: runningBalance
        });
      }
    }
    return { ledger };
  }

  async trialBalance({ fromDate, toDate }) {
    const match = {};
    if (fromDate) match.journalDate = { $gte: new Date(fromDate) };
    if (toDate) match.journalDate = Object.assign(match.journalDate || {}, { $lte: new Date(toDate) });
    const accounts = await ChartOfAccounts.find();
    const balances = [];
    for (const account of accounts) {
      const pipeline = [
        { $match: Object.assign({ 'lines.account': account._id }, match) },
        { $unwind: '$lines' },
        { $match: { 'lines.account': account._id } },
        { $group: {
          _id: '$lines.account',
          debit: { $sum: '$lines.debit' },
          credit: { $sum: '$lines.credit' }
        }}
      ];
      const result = await JournalEntry.aggregate(pipeline);
      balances.push({
        account: account.name,
        debit: result[0]?.debit || 0,
        credit: result[0]?.credit || 0
      });
    }
    const totalDebit = balances.reduce((sum, a) => sum + a.debit, 0);
    const totalCredit = balances.reduce((sum, a) => sum + a.credit, 0);
    return { balances, totalDebit, totalCredit };
  }

  async profitLoss({ fromDate, toDate }) {
    // Placeholder: implement logic based on account types
    return { revenue: 0, expenses: 0, costOfSales: 0, profit: 0 };
  }

  async balanceSheet({ date }) {
    // Placeholder: implement logic based on account types
    return { assets: 0, liabilities: 0, equity: 0 };
  }
}

module.exports = new FinanceService();
