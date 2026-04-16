const ChartOfAccounts = require('../../../masters/chartOfAccounts/chartOfAccounts.model');
const JournalEntry = require('../../journal/journal.model');

// Helper: classify account for cash flow
function classifyAccount(account) {
  // This logic can be extended based on account code, name, or custom field
  if (account.type === 'Asset' && /cash|bank/i.test(account.name)) return 'cash';
  if (account.type === 'Asset') return 'operating';
  if (account.type === 'Liability') return 'financing';
  if (account.type === 'Equity') return 'financing';
  if (account.type === 'Expense') return 'operating';
  if (account.type === 'Revenue') return 'operating';
  return 'other';
}

class CashFlowRepository {
  async getCashFlow({ fromDate, toDate }) {
    // 1. Identify cash/bank accounts
    const cashAccounts = await ChartOfAccounts.find({ type: 'Asset', name: { $regex: /cash|bank/i } });
    const cashAccountIds = cashAccounts.map(acc => acc._id);
    // 2. Get all accounts
    const allAccounts = await ChartOfAccounts.find({});
    const accountMap = {};
    for (const acc of allAccounts) accountMap[String(acc._id)] = acc;
    // 3. Get all journal entries in range
    const match = {};
    if (fromDate || toDate) {
      match.date = {};
      if (fromDate) match.date.$gte = fromDate;
      if (toDate) match.date.$lte = toDate;
    }
    const journals = await JournalEntry.find(match);
    // 4. Calculate opening cash balance (before fromDate)
    let openingBalance = 0;
    if (fromDate) {
      const openingLines = await JournalEntry.aggregate([
        { $match: { date: { $lt: fromDate } } },
        { $unwind: '$lines' },
        { $match: { 'lines.accountId': { $in: cashAccountIds } } },
        {
          $group: {
            _id: '$lines.accountId',
            debit: { $sum: '$lines.debit' },
            credit: { $sum: '$lines.credit' },
          },
        },
      ]);
      for (const line of openingLines) {
        openingBalance += (line.debit - line.credit);
      }
    }
    // 5. Classify cash flows
    let operating = 0, investing = 0, financing = 0;
    for (const journal of journals) {
      for (const line of journal.lines) {
        if (!cashAccountIds.some(id => id.equals(line.accountId))) continue;
        // Find the counter account(s) in this journal
        for (const counter of journal.lines) {
          if (counter.accountId.equals(line.accountId)) continue;
          const acc = accountMap[String(counter.accountId)];
          const classification = classifyAccount(acc);
          const amount = line.debit - line.credit;
          if (classification === 'operating') operating += amount;
          else if (classification === 'investing') investing += amount;
          else if (classification === 'financing') financing += amount;
        }
      }
    }
    // 6. Calculate closing cash balance (toDate)
    let closingBalance = openingBalance + operating + investing + financing;
    // 7. Net cash flow
    const netCashFlow = operating + investing + financing;
    return {
      openingBalance,
      operating,
      investing,
      financing,
      netCashFlow,
      closingBalance,
    };
  }
}

module.exports = new CashFlowRepository();
