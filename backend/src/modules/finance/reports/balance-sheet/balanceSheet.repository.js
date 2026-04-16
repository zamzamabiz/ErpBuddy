const ChartOfAccounts = require('../../../masters/chartOfAccounts/chartOfAccounts.model');
const JournalEntry = require('../../journal/journal.model');
const profitLossRepository = require('../profit-loss/profitLoss.repository');

class BalanceSheetRepository {
  async getBalanceSheet({ toDate }) {
    // Get relevant account types
    const accountTypes = ['Asset', 'Liability', 'Equity'];
    const accounts = await ChartOfAccounts.find({ type: { $in: accountTypes } });
    const accountMap = {};
    for (const acc of accounts) {
      accountMap[String(acc._id)] = acc;
    }
    // Aggregate journal lines by account
    const match = {};
    if (toDate) {
      match.date = { $lte: toDate };
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
    // Map balances
    const lineMap = {};
    for (const line of journalLines) {
      lineMap[String(line._id)] = line;
    }
    // Get Net Profit for retained earnings
    let netProfit = 0;
    try {
      const pl = await profitLossRepository.getProfitLoss({ toDate });
      netProfit = pl.netProfit || 0;
    } catch (e) {}
    // Build balance sheet
    const assets = [];
    const liabilities = [];
    const equity = [];
    let totalAssets = 0;
    let totalLiabilities = 0;
    let totalEquity = 0;
    for (const acc of accounts) {
      const line = lineMap[String(acc._id)] || { debit: 0, credit: 0 };
      let balance = 0;
      if (acc.type === 'Asset') {
        balance = line.debit - line.credit;
        assets.push({
          accountId: acc._id,
          accountCode: acc.code,
          accountName: acc.name,
          amount: balance,
        });
        totalAssets += balance;
      } else if (acc.type === 'Liability') {
        balance = line.credit - line.debit;
        liabilities.push({
          accountId: acc._id,
          accountCode: acc.code,
          accountName: acc.name,
          amount: balance,
        });
        totalLiabilities += balance;
      } else if (acc.type === 'Equity') {
        balance = line.credit - line.debit;
        equity.push({
          accountId: acc._id,
          accountCode: acc.code,
          accountName: acc.name,
          amount: balance,
        });
        totalEquity += balance;
      }
    }
    // Add retained earnings (net profit) to equity
    equity.push({
      accountId: null,
      accountCode: 'RETAINED',
      accountName: 'Retained Earnings',
      amount: netProfit,
    });
    totalEquity += netProfit;
    return {
      assets,
      liabilities,
      equity,
      totalAssets,
      totalLiabilities,
      totalEquity,
      isBalanced: totalAssets === totalLiabilities + totalEquity,
    };
  }
}

module.exports = new BalanceSheetRepository();
