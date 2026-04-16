const ChartOfAccounts = require('../../../masters/chartOfAccounts/chartOfAccounts.model');
const JournalEntry = require('../../journal/journal.model');

class ProfitLossRepository {
  async getProfitLoss({ fromDate, toDate }) {
    // Get relevant account types
    const accountTypes = ['Revenue', 'Cost of Sales', 'Expense'];
    const accounts = await ChartOfAccounts.find({ type: { $in: accountTypes } });
    const accountMap = {};
    for (const acc of accounts) {
      accountMap[String(acc._id)] = acc;
    }
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
    // Group by account type
    const result = {
      revenue: [],
      costOfSales: [],
      expense: [],
      totalRevenue: 0,
      totalCostOfSales: 0,
      totalExpense: 0,
      grossProfit: 0,
      netProfit: 0,
    };
    for (const line of journalLines) {
      const acc = accountMap[String(line._id)];
      if (!acc) continue;
      const balance = line.credit - line.debit;
      if (acc.type === 'Revenue') {
        result.revenue.push({
          accountId: acc._id,
          accountCode: acc.code,
          accountName: acc.name,
          amount: balance,
        });
        result.totalRevenue += balance;
      } else if (acc.type === 'Cost of Sales') {
        result.costOfSales.push({
          accountId: acc._id,
          accountCode: acc.code,
          accountName: acc.name,
          amount: -balance, // cost is debit > credit
        });
        result.totalCostOfSales += -balance;
      } else if (acc.type === 'Expense') {
        result.expense.push({
          accountId: acc._id,
          accountCode: acc.code,
          accountName: acc.name,
          amount: -balance, // expense is debit > credit
        });
        result.totalExpense += -balance;
      }
    }
    result.grossProfit = result.totalRevenue - result.totalCostOfSales;
    result.netProfit = result.grossProfit - result.totalExpense;
    return result;
  }
}

module.exports = new ProfitLossRepository();
