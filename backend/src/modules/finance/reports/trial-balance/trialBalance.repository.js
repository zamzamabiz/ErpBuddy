const ChartOfAccounts = require('../../../masters/chartOfAccounts/chartOfAccounts.model');
const JournalEntry = require('../../journal/journal.model');

class TrialBalanceRepository {
  async getTrialBalance({ fromDate, toDate }) {
    // Fetch all accounts
    const accounts = await ChartOfAccounts.find({});
    // Aggregate journal lines by account
    const match = {};
    if (fromDate || toDate) {
      match.date = {};
      if (fromDate) match.date.$gte = fromDate;
      if (toDate) match.date.$lte = toDate;
    }
    const journalLines = await JournalEntry.aggregate([
      { $match: match },
      { $unwind: '$lines' },
      {
        $group: {
          _id: '$lines.accountId',
          debit: { $sum: '$lines.debit' },
          credit: { $sum: '$lines.credit' },
        },
      },
    ]);
    // Map by accountId
    const lineMap = {};
    for (const line of journalLines) {
      lineMap[String(line._id)] = line;
    }
    // Build trial balance
    const trialBalance = [];
    let totalDebit = 0;
    let totalCredit = 0;
    for (const acc of accounts) {
      const line = lineMap[String(acc._id)] || { debit: 0, credit: 0 };
      const balance = line.debit - line.credit;
      let debit = 0, credit = 0;
      if (balance > 0) debit = balance;
      else credit = -balance;
      totalDebit += debit;
      totalCredit += credit;
      trialBalance.push({
        accountId: acc._id,
        accountCode: acc.code,
        accountName: acc.name,
        debit,
        credit,
      });
    }
    return { trialBalance, totalDebit, totalCredit };
  }
}

module.exports = new TrialBalanceRepository();
