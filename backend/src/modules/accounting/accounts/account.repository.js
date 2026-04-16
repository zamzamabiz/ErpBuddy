const Account = require('./account.model');

/**
 * Create new account
 * @param {Object} data - Account data
 * @returns {Object} Created account
 */
async function createAccount(data) {
  try {
    const account = await Account.create({
      tenantId: data.tenantId,
      code: data.code,
      name: data.name,
      type: data.type,
      parentId: data.parentId || null,
      level: data.level || 0,
      description: data.description || '',
      isActive: true,
      createdBy: data.createdBy
    });
    return account;
  } catch (error) {
    if (error.code === 11000) {
      throw new Error(`Account code '${data.code}' already exists for this tenant`);
    }
    throw new Error(`Repository: Error creating account - ${error.message}`);
  }
}

/**
 * Find account by ID
 * @param {ObjectId} accountId - Account ID
 * @returns {Object} Account record
 */
async function findAccountById(accountId) {
  try {
    const account = await Account.findById(accountId);
    return account;
  } catch (error) {
    throw new Error(`Repository: Error finding account - ${error.message}`);
  }
}

/**
 * Find account by code for tenant
 * @param {ObjectId} tenantId - Tenant ID
 * @param {string} code - Account code
 * @returns {Object} Account record
 */
async function findByCode(tenantId, code) {
  try {
    const account = await Account.findOne({ tenantId, code, isActive: true });
    return account;
  } catch (error) {
    throw new Error(`Repository: Error finding account by code - ${error.message}`);
  }
}

/**
 * Get all accounts as tree for tenant
 * @param {ObjectId} tenantId - Tenant ID
 * @returns {Array} All accounts
 */
async function getAllAccounts(tenantId) {
  try {
    const accounts = await Account.find({
      tenantId,
      isActive: true
    }).sort({ code: 1 });
    return accounts;
  } catch (error) {
    throw new Error(`Repository: Error getting all accounts - ${error.message}`);
  }
}

/**
 * Get accounts by type
 * @param {ObjectId} tenantId - Tenant ID
 * @param {string} type - Account type
 * @returns {Array} Accounts of type
 */
async function getAccountsByType(tenantId, type) {
  try {
    const accounts = await Account.find({
      tenantId,
      type,
      isActive: true
    }).sort({ code: 1 });
    return accounts;
  } catch (error) {
    throw new Error(`Repository: Error getting accounts by type - ${error.message}`);
  }
}

/**
 * Get child accounts
 * @param {ObjectId} parentId - Parent account ID
 * @returns {Array} Child accounts
 */
async function getChildAccounts(parentId) {
  try {
    const accounts = await Account.find({
      parentId,
      isActive: true
    }).sort({ code: 1 });
    return accounts;
  } catch (error) {
    throw new Error(`Repository: Error getting child accounts - ${error.message}`);
  }
}

/**
 * Update account
 * @param {ObjectId} accountId - Account ID
 * @param {Object} data - Update data
 * @returns {Object} Updated account
 */
async function updateAccount(accountId, data) {
  try {
    const updateData = {
      name: data.name,
      description: data.description,
      parentId: data.parentId || null,
      level: data.level,
      updatedBy: data.updatedBy,
      updatedAt: new Date()
    };

    const account = await Account.findByIdAndUpdate(
      accountId,
      updateData,
      { new: true, runValidators: true }
    );

    if (!account) {
      throw new Error('Account not found');
    }

    return account;
  } catch (error) {
    throw new Error(`Repository: Error updating account - ${error.message}`);
  }
}

/**
 * Deactivate account
 * @param {ObjectId} accountId - Account ID
 * @returns {Object} Updated account
 */
async function deactivateAccount(accountId) {
  try {
    const account = await Account.findByIdAndUpdate(
      accountId,
      { isActive: false, updatedAt: new Date() },
      { new: true }
    );

    if (!account) {
      throw new Error('Account not found');
    }

    return account;
  } catch (error) {
    throw new Error(`Repository: Error deactivating account - ${error.message}`);
  }
}

/**
 * Check if account has children
 * @param {ObjectId} accountId - Account ID
 * @returns {Boolean} True if has children
 */
async function hasChildren(accountId) {
  try {
    const count = await Account.countDocuments({
      parentId: accountId,
      isActive: true
    });
    return count > 0;
  } catch (error) {
    throw new Error(`Repository: Error checking children - ${error.message}`);
  }
}

module.exports = {
  createAccount,
  findAccountById,
  findByCode,
  getAllAccounts,
  getAccountsByType,
  getChildAccounts,
  updateAccount,
  deactivateAccount,
  hasChildren
};
