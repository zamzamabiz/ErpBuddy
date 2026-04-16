/**
 * ACCOUNT INITIALIZATION SERVICE
 * Creates default chart of accounts for new companies
 */

const Account = require('./account.model');
const Company = require('@modules/core/companies/company.model');

/**
 * INITIALIZE DEFAULT ACCOUNTS FOR COMPANY
 * Creates Purchase Expense, Payables, and Bank accounts
 * Returns: { expenseAccountId, payablesAccountId, bankAccountId }
 */
async function initializeDefaultAccounts(tenantId, companyId) {
  try {
    // Check if already initialized
    const company = await Company.findById(companyId);
    if (company?.expenseAccountId && company?.payablesAccountId && company?.bankAccountId) {
      return {
        expenseAccountId: company.expenseAccountId,
        payablesAccountId: company.payablesAccountId,
        bankAccountId: company.bankAccountId
      };
    }

    // Create default accounts if not exist
    const [expenseAccount, payablesAccount, bankAccount] = await Promise.all([
      getOrCreateAccount({
        tenantId,
        code: '5100',
        name: 'Purchase Expense',
        type: 'expense',
        normalBalance: 'Debit',
        isSystem: true
      }),
      getOrCreateAccount({
        tenantId,
        code: '2100',
        name: 'Accounts Payable',
        type: 'liability',
        normalBalance: 'Credit',
        isSystem: true
      }),
      getOrCreateAccount({
        tenantId,
        code: '1010',
        name: 'Bank Account',
        type: 'asset',
        normalBalance: 'Debit',
        isSystem: true
      })
    ]);

    // Update company with default account IDs
    await Company.findByIdAndUpdate(
      companyId,
      {
        expenseAccountId: expenseAccount._id,
        payablesAccountId: payablesAccount._id,
        bankAccountId: bankAccount._id
      },
      { new: true }
    );

    return {
      expenseAccountId: expenseAccount._id,
      payablesAccountId: payablesAccount._id,
      bankAccountId: bankAccount._id
    };
  } catch (error) {
    throw new Error(`Failed to initialize default accounts: ${error.message}`);
  }
}

/**
 * GET OR CREATE ACCOUNT
 * Idempotent - returns existing or creates new
 */
async function getOrCreateAccount({
  tenantId,
  code,
  name,
  type,
  normalBalance = 'Debit',
  isSystem = false
}) {
  try {
    // Try to find existing
    let account = await Account.findOne({
      tenantId,
      code,
      deletedAt: null
    });

    if (account) {
      return account;
    }

    // Create new
    account = new Account({
      tenantId,
      code,
      name,
      type,
      normalBalance,
      isSystem,
      allowPosting: true, // CRITICAL: Must allow posting
      isActive: true
    });

    return await account.save();
  } catch (error) {
    throw new Error(`Failed to get/create account [${code}]: ${error.message}`);
  }
}

/**
 * GET COMPANY ACCOUNTS
 * Retrieves default accounts for a company
 */
async function getCompanyAccounts(companyId) {
  try {
    const company = await Company.findById(companyId)
      .select('expenseAccountId payablesAccountId bankAccountId');

    if (!company) {
      throw new Error('Company not found');
    }

    return {
      expenseAccountId: company.expenseAccountId,
      payablesAccountId: company.payablesAccountId,
      bankAccountId: company.bankAccountId
    };
  } catch (error) {
    throw new Error(`Failed to get company accounts: ${error.message}`);
  }
}

module.exports = {
  initializeDefaultAccounts,
  getOrCreateAccount,
  getCompanyAccounts
};
