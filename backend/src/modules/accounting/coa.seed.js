const ChartOfAccount = require('./coa.model');

/**
 * DEFAULT CHART OF ACCOUNTS
 * Complete accounting structure for standard business operations
 */
const defaultAccounts = [
  // ASSETS (1xxx)
  { 
    name: 'Current Assets', 
    code: '1000', 
    type: 'ASSET', 
    isSystem: true,
    allowPosting: false,  // Parent account
    level: 0,
    normalBalance: 'DEBIT'
  },
  { 
    name: 'Inventory', 
    code: '1001', 
    type: 'ASSET', 
    isSystem: true,
    allowPosting: true,
    level: 1,
    normalBalance: 'DEBIT'
  },
  { 
    name: 'Accounts Receivable', 
    code: '1002', 
    type: 'ASSET', 
    isSystem: true,
    allowPosting: true,
    level: 1,
    normalBalance: 'DEBIT'
  },
  { 
    name: 'Cash', 
    code: '1003', 
    type: 'ASSET', 
    isSystem: true,
    allowPosting: true,
    level: 1,
    normalBalance: 'DEBIT'
  },
  { 
    name: 'Bank', 
    code: '1004', 
    type: 'ASSET', 
    isSystem: true,
    allowPosting: true,
    level: 1,
    normalBalance: 'DEBIT'
  },
  
  // LIABILITIES (2xxx)
  { 
    name: 'Current Liabilities', 
    code: '2000', 
    type: 'LIABILITY', 
    isSystem: true,
    allowPosting: false,  // Parent account
    level: 0,
    normalBalance: 'CREDIT'
  },
  { 
    name: 'Accounts Payable', 
    code: '2001', 
    type: 'LIABILITY', 
    isSystem: true,
    allowPosting: true,
    level: 1,
    normalBalance: 'CREDIT'
  },
  
  // EQUITY (3xxx)
  { 
    name: 'Equity', 
    code: '3000', 
    type: 'EQUITY', 
    isSystem: true,
    allowPosting: false,  // Parent account
    level: 0,
    normalBalance: 'CREDIT'
  },
  { 
    name: 'Retained Earnings', 
    code: '3001', 
    type: 'EQUITY', 
    isSystem: true,
    allowPosting: true,
    level: 1,
    normalBalance: 'CREDIT'
  },
  
  // INCOME (4xxx)
  { 
    name: 'Revenue', 
    code: '4000', 
    type: 'INCOME', 
    isSystem: true,
    allowPosting: false,  // Parent account
    level: 0,
    normalBalance: 'CREDIT'
  },
  { 
    name: 'Sales Revenue', 
    code: '4001', 
    type: 'INCOME', 
    isSystem: true,
    allowPosting: true,
    level: 1,
    normalBalance: 'CREDIT'
  },
  
  // EXPENSES (5xxx)
  { 
    name: 'Cost of Goods Sold', 
    code: '5000', 
    type: 'EXPENSE', 
    isSystem: true,
    allowPosting: false,  // Parent account
    level: 0,
    normalBalance: 'DEBIT'
  },
  { 
    name: 'Purchase Account', 
    code: '5001', 
    type: 'EXPENSE', 
    isSystem: true,
    allowPosting: true,
    level: 1,
    normalBalance: 'DEBIT'
  },
  { 
    name: 'Cost of Goods Sold', 
    code: '5002', 
    type: 'EXPENSE', 
    isSystem: true,
    allowPosting: true,
    level: 1,
    normalBalance: 'DEBIT'
  }
];

/**
 * SEED DEFAULT ACCOUNTS
 * Creates standard chart of accounts for a tenant if they don't exist
 * @param {string} tenantId - The tenant ID to seed accounts for
 * @param {string} companyId - Optional company ID to associate with accounts
 */
async function seedDefaultAccounts(tenantId, companyId = null) {
  if (!tenantId) {
    throw new Error('tenantId is required for seeding accounts');
  }

  try {
    console.log(`🌱 Seeding default accounts for tenant: ${tenantId}`);
    
    const createdAccounts = [];
    const existingAccounts = [];

    for (const account of defaultAccounts) {
      // Check if account already exists for this tenant
      const exists = await ChartOfAccount.findOne({ 
        tenantId, 
        code: account.code,
        deletedAt: null
      });

      if (!exists) {
        // Create new account
        const accountData = {
          ...account,
          tenantId,
          companyId: companyId || null
        };

        const created = await ChartOfAccount.create(accountData);
        createdAccounts.push(created);
        console.log(`✅ Created account: ${account.name} (${account.code})`);
      } else {
        existingAccounts.push(exists);
        console.log(`ℹ️  Account already exists: ${account.name} (${account.code})`);
      }
    }

    console.log(`✅ Seeding complete: ${createdAccounts.length} created, ${existingAccounts.length} already existed`);
    
    return {
      success: true,
      created: createdAccounts.length,
      existing: existingAccounts.length,
      accounts: [...createdAccounts, ...existingAccounts]
    };
  } catch (error) {
    console.error('❌ Error seeding accounts:', error.message);
    throw error;
  }
}

/**
 * GET SYSTEM ACCOUNTS
 * Returns all system accounts for a tenant
 */
async function getSystemAccounts(tenantId) {
  return await ChartOfAccount.find({
    tenantId,
    isSystem: true,
    deletedAt: null
  }).sort({ code: 1 });
}

/**
 * FIND ACCOUNT BY CODE
 * Safe lookup that ensures tenant isolation
 */
async function findAccountByCode(tenantId, code) {
  return await ChartOfAccount.findOne({
    tenantId,
    code,
    deletedAt: null
  });
}

/**
 * VALIDATE ACCOUNT EXISTS AND ALLOWS POSTING
 * Ensures account is valid for journal entries
 */
async function validatePostingAccount(tenantId, accountId) {
  const account = await ChartOfAccount.findOne({
    _id: accountId,
    tenantId,
    allowPosting: true,
    deletedAt: null
  });

  if (!account) {
    throw new Error(`Account ${accountId} not found or does not allow posting`);
  }

  return account;
}

module.exports = { 
  seedDefaultAccounts,
  getSystemAccounts,
  findAccountByCode,
  validatePostingAccount
};