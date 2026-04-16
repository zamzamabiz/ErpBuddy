const ChartOfAccount = require('./coa.model');

/**
 * ACCOUNT SERVICE - Centralized account lookup and validation
 * Eliminates hardcoded account codes throughout the system
 */

/**
 * ACCOUNT CODE CONSTANTS
 * Standard account codes for system accounts
 */
const ACCOUNT_CODES = {
  // Assets
  INVENTORY: '1001',
  ACCOUNTS_RECEIVABLE: '1002',
  CASH: '1003',
  BANK: '1004',
  
  // Liabilities
  ACCOUNTS_PAYABLE: '2001',
  
  // Equity
  RETAINED_EARNINGS: '3001',
  
  // Income
  SALES_REVENUE: '4001',
  
  // Expenses
  PURCHASE_ACCOUNT: '5001',
  COST_OF_GOODS_SOLD: '5002'
};

/**
 * ACCOUNT TYPE VALIDATION MAP
 * Ensures accounts are used for correct purposes
 */
const ACCOUNT_TYPE_REQUIREMENTS = {
  INVENTORY: 'ASSET',
  ACCOUNTS_RECEIVABLE: 'ASSET',
  CASH: 'ASSET',
  BANK: 'ASSET',
  ACCOUNTS_PAYABLE: 'LIABILITY',
  RETAINED_EARNINGS: 'EQUITY',
  SALES_REVENUE: 'INCOME',
  PURCHASE_ACCOUNT: 'EXPENSE',
  COST_OF_GOODS_SOLD: 'EXPENSE'
};

/**
 * GET ACCOUNT BY CODE
 * Centralized account lookup with tenant isolation
 * 
 * @param {string} code - Account code (use ACCOUNT_CODES constants)
 * @param {string} tenantId - Tenant ID for isolation
 * @param {boolean} requirePosting - Whether account must allow posting (default: true)
 * @returns {Object} Account document
 */
async function getAccountByCode(code, tenantId, requirePosting = true) {
  if (!code) {
    throw new Error('Account code is required');
  }
  if (!tenantId) {
    throw new Error('Tenant ID is required');
  }

  const query = {
    tenantId,
    code,
    deletedAt: null
  };

  if (requirePosting) {
    query.allowPosting = true;
  }

  const account = await ChartOfAccount.findOne(query);

  if (!account) {
    throw new Error(`Account with code ${code} not found for tenant ${tenantId}`);
  }

  return account;
}

/**
 * GET MULTIPLE ACCOUNTS BY CODES
 * Efficiently fetch multiple accounts at once
 * 
 * @param {string[]} codes - Array of account codes
 * @param {string} tenantId - Tenant ID for isolation
 * @returns {Object} Map of code -> account
 */
async function getAccountsByCodes(codes, tenantId) {
  if (!Array.isArray(codes) || codes.length === 0) {
    throw new Error('Account codes array is required');
  }
  if (!tenantId) {
    throw new Error('Tenant ID is required');
  }

  const accounts = await ChartOfAccount.find({
    tenantId,
    code: { $in: codes },
    deletedAt: null,
    allowPosting: true
  });

  const accountMap = {};
  for (const account of accounts) {
    accountMap[account.code] = account;
  }

  // Verify all requested accounts were found
  for (const code of codes) {
    if (!accountMap[code]) {
      throw new Error(`Account with code ${code} not found for tenant ${tenantId}`);
    }
  }

  return accountMap;
}

/**
 * VALIDATE ACCOUNT TYPE
 * Ensures account is of the correct type for its intended use
 * 
 * @param {Object} account - Account document
 * @param {string} expectedType - Expected account type (ASSET, LIABILITY, etc.)
 * @throws {Error} If account type doesn't match
 */
function validateAccountType(account, expectedType) {
  if (!account) {
    throw new Error('Account is required for validation');
  }
  if (!expectedType) {
    throw new Error('Expected account type is required');
  }

  if (account.type !== expectedType) {
    throw new Error(
      `Account ${account.code} (${account.name}) is of type ${account.type}, ` +
      `but ${expectedType} is required`
    );
  }
}

/**
 * GET ACCOUNT WITH TYPE VALIDATION
 * Combines lookup and validation in one call
 * 
 * @param {string} code - Account code
 * @param {string} tenantId - Tenant ID
 * @param {string} expectedType - Expected account type
 * @returns {Object} Validated account document
 */
async function getAccountWithTypeValidation(code, tenantId, expectedType) {
  const account = await getAccountByCode(code, tenantId);
  validateAccountType(account, expectedType);
  return account;
}

/**
 * GET PURCHASE ACCOUNTS
 * Gets all accounts needed for purchase accounting
 * 
 * @param {string} tenantId - Tenant ID
 * @returns {Object} Object with inventory and payable accounts
 */
async function getPurchaseAccounts(tenantId) {
  const accounts = await getAccountsByCodes([
    ACCOUNT_CODES.INVENTORY,
    ACCOUNT_CODES.ACCOUNTS_PAYABLE
  ], tenantId);

  // Validate account types
  validateAccountType(accounts[ACCOUNT_CODES.INVENTORY], 'ASSET');
  validateAccountType(accounts[ACCOUNT_CODES.ACCOUNTS_PAYABLE], 'LIABILITY');

  return {
    inventoryAccount: accounts[ACCOUNT_CODES.INVENTORY],
    payableAccount: accounts[ACCOUNT_CODES.ACCOUNTS_PAYABLE]
  };
}

/**
 * GET SALES ACCOUNTS
 * Gets all accounts needed for sales accounting
 * 
 * @param {string} tenantId - Tenant ID
 * @returns {Object} Object with receivable, revenue, cogs, and inventory accounts
 */
async function getSalesAccounts(tenantId) {
  const accounts = await getAccountsByCodes([
    ACCOUNT_CODES.ACCOUNTS_RECEIVABLE,
    ACCOUNT_CODES.SALES_REVENUE,
    ACCOUNT_CODES.COST_OF_GOODS_SOLD,
    ACCOUNT_CODES.INVENTORY
  ], tenantId);

  // Validate account types
  validateAccountType(accounts[ACCOUNT_CODES.ACCOUNTS_RECEIVABLE], 'ASSET');
  validateAccountType(accounts[ACCOUNT_CODES.SALES_REVENUE], 'INCOME');
  validateAccountType(accounts[ACCOUNT_CODES.COST_OF_GOODS_SOLD], 'EXPENSE');
  validateAccountType(accounts[ACCOUNT_CODES.INVENTORY], 'ASSET');

  return {
    receivableAccount: accounts[ACCOUNT_CODES.ACCOUNTS_RECEIVABLE],
    revenueAccount: accounts[ACCOUNT_CODES.SALES_REVENUE],
    cogsAccount: accounts[ACCOUNT_CODES.COST_OF_GOODS_SOLD],
    inventoryAccount: accounts[ACCOUNT_CODES.INVENTORY]
  };
}

/**
 * GET SYSTEM ACCOUNTS FOR TENANT
 * Gets all system accounts for a tenant
 * 
 * @param {string} tenantId - Tenant ID
 * @returns {Object} Object with all system accounts
 */
async function getSystemAccounts(tenantId) {
  const accounts = await ChartOfAccount.find({
    tenantId,
    isSystem: true,
    allowPosting: true,
    deletedAt: null
  });

  const accountMap = {};
  for (const account of accounts) {
    accountMap[account.code] = account;
  }

  return accountMap;
}

module.exports = {
  // Constants
  ACCOUNT_CODES,
  ACCOUNT_TYPE_REQUIREMENTS,
  
  // Functions
  getAccountByCode,
  getAccountsByCodes,
  validateAccountType,
  getAccountWithTypeValidation,
  getPurchaseAccounts,
  getSalesAccounts,
  getSystemAccounts
};