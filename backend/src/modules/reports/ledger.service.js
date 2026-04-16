/**
 * 📊 LEDGER SERVICE
 * ========================
 * Generates General Ledger reports for specific accounts
 * Shows all transactions with running balance
 */

const Journal = require('@modules/finance/journal/journal.model');
const JournalLine = require('@modules/finance/journal/journalLine.model');
const Account = require('@modules/accounting/accounts/account.model');

/**
 * 🔷 GET GENERAL LEDGER FOR ACCOUNT
 * ========================
 * Fetches all journal lines for a specific account with running balance
 * 
 * @param {String} accountId - Account ObjectId
 * @param {String} tenantId - Tenant ObjectId
 * @param {Date} fromDate - Start date (optional)
 * @param {Date} toDate - End date (optional)
 * @returns {Object} - Ledger data with running balance
 */
async function getLedger(accountId, tenantId, fromDate = null, toDate = null) {
  try {
    console.log(`\n📖 Fetching General Ledger for Account: ${accountId}`);

    // ✅ STEP 1: Validate account exists
    const account = await Account.findOne({
      _id: accountId,
      tenantId,
      isActive: true,
      deletedAt: null
    });

    if (!account) {
      throw new Error(`Account not found or inactive: ${accountId}`);
    }

    console.log(`  ✓ Account: ${account.name} (${account.code}) - Type: ${account.type}, Normal Balance: ${account.normalBalance}`);

    // ✅ STEP 2: Build query for journal lines
    const query = {
      tenantId,
      accountId
    };

    if (fromDate || toDate) {
      query.journalDate = {};
      if (fromDate) query.journalDate.$gte = new Date(fromDate);
      if (toDate) {
        const endDate = new Date(toDate);
        endDate.setHours(23, 59, 59, 999);
        query.journalDate.$lte = endDate;
      }
    }

    // ✅ STEP 3: Fetch journal lines grouped by journal (to get dates)
    const journalLines = await JournalLine.find({
      tenantId,
      accountId
    }).populate({
      path: 'journalId',
      select: 'date description reference'
    }).sort({ journalId: 1, createdAt: 1 });

    if (journalLines.length === 0) {
      console.log('  ℹ️ No transactions found for this account');
      return {
        account: {
          id: account._id,
          code: account.code,
          name: account.name,
          type: account.type,
          normalBalance: account.normalBalance
        },
        ledgerEntries: [],
        openingBalance: 0,
        closingBalance: 0,
        totalDebit: 0,
        totalCredit: 0,
        period: {
          from: fromDate || 'Beginning',
          to: toDate || 'End'
        }
      };
    }

    // ✅ STEP 4: Calculate running balance
    let openingBalance = 0;
    let closingBalance = 0;
    let totalDebit = 0;
    let totalCredit = 0;

    const ledgerEntries = journalLines.map((line) => {
      const debit = line.debit || 0;
      const credit = line.credit || 0;

      // Add to totals
      totalDebit += debit;
      totalCredit += credit;

      // Calculate running balance based on account's normal balance
      let balanceChange = 0;
      if (account.normalBalance === 'Debit') {
        balanceChange = debit - credit;
      } else {
        balanceChange = credit - debit;
      }

      closingBalance += balanceChange;

      return {
        date: line.journalId?.date || line.createdAt,
        description: line.journalId?.description || line.description || '',
        reference: line.journalId?.reference || '',
        debit: debit > 0 ? debit : null,
        credit: credit > 0 ? credit : null,
        runningBalance: parseFloat(closingBalance.toFixed(2))
      };
    });

    console.log(`  ✓ Total Entries: ${ledgerEntries.length}`);
    console.log(`  ✓ Total Debit: ${totalDebit.toFixed(2)}`);
    console.log(`  ✓ Total Credit: ${totalCredit.toFixed(2)}`);
    console.log(`  ✓ Closing Balance: ${closingBalance.toFixed(2)}`);

    return {
      success: true,
      account: {
        id: account._id,
        code: account.code,
        name: account.name,
        type: account.type,
        normalBalance: account.normalBalance
      },
      ledgerEntries,
      openingBalance: parseFloat(openingBalance.toFixed(2)),
      closingBalance: parseFloat(closingBalance.toFixed(2)),
      totalDebit: parseFloat(totalDebit.toFixed(2)),
      totalCredit: parseFloat(totalCredit.toFixed(2)),
      period: {
        from: fromDate || null,
        to: toDate || null
      },
      entryCount: ledgerEntries.length
    };

  } catch (err) {
    console.error('❌ getLedger ERROR:', err.message);
    throw err;
  }
}

/**
 * 🔷 GET LEDGER WITH OPENING BALANCE
 * ========================
 * Calculates opening balance based on transactions before fromDate
 * 
 * @param {String} accountId - Account ObjectId
 * @param {String} tenantId - Tenant ObjectId
 * @param {Date} fromDate - Start date for period
 * @param {Date} toDate - End date for period
 * @returns {Object} - Ledger with opening balance
 */
async function getLedgerWithOpeningBalance(accountId, tenantId, fromDate, toDate) {
  try {
    // Validate account
    const account = await Account.findOne({
      _id: accountId,
      tenantId,
      isActive: true,
      deletedAt: null
    });

    if (!account) {
      throw new Error(`Account not found or inactive: ${accountId}`);
    }

    // ✅ Calculate opening balance (all transactions before fromDate)
    let openingBalance = 0;
    if (fromDate) {
      const openingLines = await JournalLine.find({
        tenantId,
        accountId,
        createdAt: { $lt: new Date(fromDate) }
      });

      openingLines.forEach(line => {
        const debit = line.debit || 0;
        const credit = line.credit || 0;

        if (account.normalBalance === 'Debit') {
          openingBalance += (debit - credit);
        } else {
          openingBalance += (credit - debit);
        }
      });
    }

    // ✅ Get period transactions
    const query = {
      tenantId,
      accountId
    };

    if (fromDate && toDate) {
      const endDate = new Date(toDate);
      endDate.setHours(23, 59, 59, 999);
      query.createdAt = {
        $gte: new Date(fromDate),
        $lte: endDate
      };
    }

    const journalLines = await JournalLine.find(query)
      .populate({
        path: 'journalId',
        select: 'date description reference'
      })
      .sort({ journalId: 1, createdAt: 1 });

    let runningBalance = openingBalance;
    let periodDebit = 0;
    let periodCredit = 0;

    const ledgerEntries = journalLines.map((line) => {
      const debit = line.debit || 0;
      const credit = line.credit || 0;

      periodDebit += debit;
      periodCredit += credit;

      let balanceChange = 0;
      if (account.normalBalance === 'Debit') {
        balanceChange = debit - credit;
      } else {
        balanceChange = credit - debit;
      }

      runningBalance += balanceChange;

      return {
        date: line.journalId?.date || line.createdAt,
        description: line.journalId?.description || line.description || '',
        reference: line.journalId?.reference || '',
        debit: debit > 0 ? debit : null,
        credit: credit > 0 ? credit : null,
        runningBalance: parseFloat(runningBalance.toFixed(2))
      };
    });

    console.log(`\n📖 Ledger with Opening Balance`);
    console.log(`  Account: ${account.name} (${account.code})`);
    console.log(`  Opening Balance: ${openingBalance.toFixed(2)}`);
    console.log(`  Period Debit: ${periodDebit.toFixed(2)}`);
    console.log(`  Period Credit: ${periodCredit.toFixed(2)}`);
    console.log(`  Closing Balance: ${runningBalance.toFixed(2)}`);

    return {
      success: true,
      account: {
        id: account._id,
        code: account.code,
        name: account.name,
        type: account.type,
        normalBalance: account.normalBalance
      },
      openingBalance: parseFloat(openingBalance.toFixed(2)),
      ledgerEntries,
      periodDebit: parseFloat(periodDebit.toFixed(2)),
      periodCredit: parseFloat(periodCredit.toFixed(2)),
      closingBalance: parseFloat(runningBalance.toFixed(2)),
      period: {
        from: fromDate || null,
        to: toDate || null
      },
      entryCount: ledgerEntries.length
    };

  } catch (err) {
    console.error('❌ getLedgerWithOpeningBalance ERROR:', err.message);
    throw err;
  }
}

module.exports = {
  getLedger,
  getLedgerWithOpeningBalance
};
