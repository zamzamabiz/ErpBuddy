/**
 * 📊 TRIAL BALANCE SERVICE
 * ========================
 * Generates Trial Balance reports
 * Summary of all accounts with debit/credit balances for verification
 */

const Journal = require('@modules/finance/journal/journal.model');
const JournalLine = require('@modules/finance/journal/journalLine.model');
const Account = require('@modules/accounting/accounts/account.model');

/**
 * 🔷 GET TRIAL BALANCE
 * ========================
 * Fetches all accounts with their debit/credit totals
 * Used to verify that debits = credits (balanced entries)
 * 
 * @param {String} tenantId - Tenant ObjectId
 * @param {Date} fromDate - Start date (optional)
 * @param {Date} toDate - End date (optional)
 * @returns {Object} - Trial balance report with validation
 */
async function getTrialBalance(tenantId, fromDate = null, toDate = null) {
  try {
    console.log(`\n📋 Generating Trial Balance for Tenant: ${tenantId}`);

    // ✅ STEP 1: Build query for journal lines
    const query = {
      tenantId
    };

    if (fromDate || toDate) {
      query.createdAt = {};
      if (fromDate) query.createdAt.$gte = new Date(fromDate);
      if (toDate) {
        const endDate = new Date(toDate);
        endDate.setHours(23, 59, 59, 999);
        query.createdAt.$lte = endDate;
      }
    }

    // ✅ STEP 2: Fetch all journal lines
    const journalLines = await JournalLine.find(query)
      .populate('accountId')
      .sort({ accountId: 1, createdAt: 1 });

    if (journalLines.length === 0) {
      console.log('  ℹ️ No transactions found in this period');
      return {
        success: true,
        accounts: [],
        totalDebit: 0,
        totalCredit: 0,
        isBalanced: true,
        variance: 0,
        period: {
          from: fromDate || 'Beginning',
          to: toDate || 'End'
        },
        message: 'No transactions found'
      };
    }

    // ✅ STEP 3: Group by account and calculate totals
    const accountMap = new Map();
    let grandTotalDebit = 0;
    let grandTotalCredit = 0;

    for (const line of journalLines) {
      const accountId = line.accountId?._id || line.accountId;
      // Skip lines without a valid account reference
      if (!accountId) {
        console.warn(`  ⚠️ Skipping journal line ${line._id} - no accountId`);
        continue;
      }
      const key = accountId.toString();

      if (!accountMap.has(key)) {
        accountMap.set(key, {
          id: line.accountId?._id || accountId,
          code: line.accountCode,
          name: line.accountName,
          type: line.accountType,
          debit: 0,
          credit: 0,
          balance: 0,
          normalBalance: null
        });
      }

      const account = accountMap.get(key);
      account.debit += line.debit || 0;
      account.credit += line.credit || 0;

      // Fetch full account to get normalBalance
      if (!account.normalBalance) {
        const fullAccount = await Account.findById(accountId);
        if (fullAccount) {
          account.normalBalance = fullAccount.normalBalance;
          account.type = fullAccount.type;
        }
      }

      grandTotalDebit += line.debit || 0;
      grandTotalCredit += line.credit || 0;
    }

    // ✅ STEP 4: Calculate net balance for each account
    const accounts = Array.from(accountMap.values())
      .map(account => {
        let balance = 0;
        if (account.normalBalance === 'Debit') {
          balance = account.debit - account.credit;
        } else {
          balance = account.credit - account.debit;
        }

        return {
          ...account,
          debit: parseFloat((account.debit).toFixed(2)),
          credit: parseFloat((account.credit).toFixed(2)),
          balance: parseFloat(balance.toFixed(2))
        };
      })
      .filter(account => account.debit !== 0 || account.credit !== 0) // Only non-zero accounts
      .sort((a, b) => a.code.localeCompare(b.code));

    // ✅ STEP 5: Validate balance
    const variance = parseFloat((grandTotalDebit - grandTotalCredit).toFixed(2));
    const isBalanced = variance === 0;

    console.log(`  ✓ Total Accounts: ${accounts.length}`);
    console.log(`  ✓ Total Debit: ${grandTotalDebit.toFixed(2)}`);
    console.log(`  ✓ Total Credit: ${grandTotalCredit.toFixed(2)}`);
    console.log(`  ✓ Balanced: ${isBalanced ? '✅ YES' : '❌ NO'}`);
    if (variance !== 0) {
      console.log(`  ⚠️  Variance: ${variance.toFixed(2)}`);
    }

    return {
      success: true,
      accounts,
      totalDebit: parseFloat(grandTotalDebit.toFixed(2)),
      totalCredit: parseFloat(grandTotalCredit.toFixed(2)),
      isBalanced,
      variance,
      period: {
        from: fromDate || null,
        to: toDate || null
      },
      summary: {
        accountCount: accounts.length,
        message: isBalanced
          ? '✅ Trial Balance is balanced (Debit = Credit)'
          : `❌ Trial Balance has variance: ${variance.toFixed(2)}`
      }
    };

  } catch (err) {
    console.error('❌ getTrialBalance ERROR:', err.message);
    throw err;
  }
}

/**
 * 🔷 GET TRIAL BALANCE WITH ACCOUNT HIERARCHY
 * ========================
 * Returns Trial Balance organized by account type
 * Useful for understanding account grouping
 * 
 * @param {String} tenantId - Tenant ObjectId
 * @param {Date} fromDate - Start date (optional)
 * @param {Date} toDate - End date (optional)
 * @returns {Object} - Trial balance grouped by type
 */
async function getTrialBalanceByType(tenantId, fromDate = null, toDate = null) {
  try {
    console.log(`\n📋 Trial Balance by Account Type`);

    // Get base trial balance
    const trialBalance = await getTrialBalance(tenantId, fromDate, toDate);

    if (!trialBalance.success) {
      return trialBalance;
    }

    // Group accounts by type
    const typeGroups = {
      asset: { debit: 0, credit: 0, accounts: [] },
      liability: { debit: 0, credit: 0, accounts: [] },
      equity: { debit: 0, credit: 0, accounts: [] },
      income: { debit: 0, credit: 0, accounts: [] },
      expense: { debit: 0, credit: 0, accounts: [] }
    };

    trialBalance.accounts.forEach(account => {
      const type = account.type.toLowerCase() || 'other';
      if (typeGroups[type]) {
        typeGroups[type].accounts.push(account);
        typeGroups[type].debit += account.debit;
        typeGroups[type].credit += account.credit;
      }
    });

    // Remove empty groups and format
    const summary = [];
    Object.entries(typeGroups).forEach(([type, data]) => {
      if (data.accounts.length > 0) {
        summary.push({
          type: type.toUpperCase(),
          accounts: data.accounts,
          subtotalDebit: parseFloat(data.debit.toFixed(2)),
          subtotalCredit: parseFloat(data.credit.toFixed(2))
        });
      }
    });

    console.log(`  ✓ Total Groups: ${summary.length}`);
    summary.forEach(group => {
      console.log(`  - ${group.type}: D=${group.subtotalDebit.toFixed(2)} C=${group.subtotalCredit.toFixed(2)}`);
    });

    return {
      success: true,
      summary,
      totals: {
        debit: trialBalance.totalDebit,
        credit: trialBalance.totalCredit,
        isBalanced: trialBalance.isBalanced,
        variance: trialBalance.variance
      },
      period: trialBalance.period
    };

  } catch (err) {
    console.error('❌ getTrialBalanceByType ERROR:', err.message);
    throw err;
  }
}

module.exports = {
  getTrialBalance,
  getTrialBalanceByType
};
