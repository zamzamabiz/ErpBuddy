const Account = require('./account.model');
const AuditService = require('../../audit/audit.service');

// ============================================
// ACCOUNT SERVICE - PRODUCTION GRADE
// ============================================

class AccountService {
  /**
   * GENERATE ACCOUNT CODE (CORE ALGORITHM)
   *
   * Format: 8-digit hierarchical
   * LLMMSSQQ where:
   *   LL = Level prefix (10-90)
   *   MM = Level 2 group (01-99)
   *   SS = Level 3 subgroup (01-99)
   *   QQ = Level 4 detail (01-99)
   *
   * Example hierarchy:
   * 10000000 = Assets (Level 1)
   * 10010000 = Current Assets (Level 2)
   * 10010100 = Cash (Level 3)
   * 10010101 = Cash in Hand (Level 4)
   */
  static async generateAccountCode(parentId, tenantId) {
    let code;

    if (!parentId) {
      // Root level accounts (Level 1)
      // Predefined prefixes: 10, 20, 30, 40, 50, 60, 70
      const existingRoots = await Account.find(
        { tenantId, level: 1 },
        { code: 1 },
        { sort: { code: -1 }, limit: 1 }
      );

      if (existingRoots.length === 0) {
        code = '10000000'; // First root is Assets
      } else {
        const lastCode = existingRoots[0].code;
        const prefix = parseInt(lastCode.substring(0, 2));
        const nextPrefix = prefix + 10; // Jump by 10 (10, 20, 30, 40, etc.)

        if (nextPrefix > 90) {
          throw new Error('Maximum chart of accounts root levels reached');
        }
        code = `${nextPrefix}000000`;
      }
    } else {
      // Child accounts (Level 2, 3, 4)
      const parent = await Account.findById(parentId);
      if (!parent) {
        throw new Error('Parent account not found');
      }

      if (parent.level >= 4) {
        throw new Error('Cannot create accounts below level 4');
      }

      // Find all children of this parent sorted by code descending
      const children = await Account.find(
        { tenantId, parentId },
        { code: 1 },
        { sort: { code: -1 } }
      );

      const parentPrefix = parent.code.substring(0, 2 * parent.level);

      if (children.length === 0) {
        // First child: increment to next segment
        if (parent.level === 1) {
          code = `${parentPrefix}010000`;
        } else if (parent.level === 2) {
          code = `${parentPrefix}0100`;
        } else if (parent.level === 3) {
          code = `${parentPrefix}01`;
        }
      } else {
        // Subsequent children: increment last 2 digits
        const lastChild = children[0].code;
        const lastSegmentStart = 2 * parent.level;
        const lastSegment = parseInt(lastChild.substring(lastSegmentStart, lastSegmentStart + 2));

        if (lastSegment >= 99) {
          throw new Error('Maximum child accounts under this parent reached');
        }

        const nextSegment = String(lastSegment + 1).padStart(2, '0');
        code = lastChild.substring(0, lastSegmentStart) + nextSegment + lastChild.substring(lastSegmentStart + 2);
      }
    }

    return code;
  }

  /**
   * CREATE ACCOUNT
   */
  static async createAccount(data, user, tenantId) {
    // Check authorization
    if (!user || user.role?.name !== 'Admin') {
      throw new Error('Permission denied: Only administrators can create accounts');
    }

    // Validate parent exists (if provided)
    if (data.parentId) {
      const parent = await Account.findOne({
        _id: data.parentId,
        tenantId
      });
      if (!parent) {
        throw new Error('Parent account not found');
      }

      // Calculate level
      data.level = parent.level + 1;
    } else {
      data.level = 1;
    }

    // Generate code
    data.code = await this.generateAccountCode(data.parentId, tenantId);

    // Set system fields
    data.tenantId = tenantId;
    data.createdBy = user._id;
    data.isSystem = false;
    data.normalBalance = data.normalBalance || this.getNormalBalance(data.type);

    // Create account
    const account = new Account(data);
    await account.save();

    // Log action
    await AuditService.logAction({
      tenantId,
      userId: user._id,
      action: 'CREATE',
      module: 'account',
      recordId: account._id,
      changes: {
        code: account.code,
        name: account.name,
        type: account.type,
      },
    }).catch(err => console.log('Audit log error:', err));

    return account;
  }

  /**
   * GET CHART OF ACCOUNTS (TREE VIEW)
   */
  static async getAccountTree(tenantId, type = null) {
    const query = { tenantId, isActive: true, level: 1, deletedAt: null };
    if (type) query.type = type;

    const rootAccounts = await Account.find(query).lean();

    const tree = [];
    for (const root of rootAccounts) {
      const treeNode = await this.buildAccountTree(root._id, tenantId);
      tree.push(treeNode);
    }

    return tree;
  }

  /**
   * HELPER: Build tree recursively
   */
  static async buildAccountTree(accountId, tenantId) {
    const account = await Account.findOne({ _id: accountId, deletedAt: null }).lean();
    if (!account) return null;

    const children = await Account.find(
      { tenantId, parentId: accountId, isActive: true, deletedAt: null },
      {},
      { sort: { code: 1 } }
    ).lean();

    account.children = [];
    for (const child of children) {
      const childTree = await this.buildAccountTree(child._id, tenantId);
      if (childTree) account.children.push(childTree);
    }

    return account;
  }

  /**
   * GET ACCOUNTS (FLAT LIST WITH FILTERS)
   */
  static async listAccounts(tenantId, filters = {}) {
    const query = { tenantId, deletedAt: null };

    if (filters.type) query.type = filters.type;
    if (filters.category) query.category = filters.category;
    if (filters.level) query.level = filters.level;
    if (typeof filters.isActive === 'boolean') query.isActive = filters.isActive;
    if (typeof filters.allowPosting === 'boolean') query.allowPosting = filters.allowPosting;

    if (filters.parentId) {
      query.parentId = filters.parentId === 'null' ? null : filters.parentId;
    }

    if (filters.search) {
      query.$or = [
        { name: { $regex: filters.search, $options: 'i' } },
        { code: { $regex: filters.search, $options: 'i' } }
      ];
    }

    const limit = Math.min(filters.limit || 100, 1000);
    const offset = filters.offset || 0;

    const [accounts, total] = await Promise.all([
      Account.find(query)
        .sort({ code: 1 })
        .skip(offset)
        .limit(limit)
        .lean(),

      Account.countDocuments(query)
    ]);

    return {
      data: accounts,
      pagination: {
        total,
        limit,
        offset,
        pages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * GET SINGLE ACCOUNT WITH HIERARCHY
   */
  static async getAccountWithHierarchy(accountId, tenantId) {
    const account = await Account.findOne({
      _id: accountId,
      tenantId,
      deletedAt: null
    }).lean();

    if (!account) throw new Error('Account not found');

    const ancestors = [];
    let current = account;
    while (current.parentId) {
      const parent = await Account.findOne({ _id: current.parentId, deletedAt: null }).lean();
      if (!parent) break;
      ancestors.unshift(parent);
      current = parent;
    }

    const descendants = await Account.find({
      tenantId,
      parentId: accountId,
      isActive: true,
      deletedAt: null
    })
      .sort({ code: 1 })
      .lean();

    return {
      account,
      ancestors,
      descendants,
      path: [...ancestors, account]
    };
  }

  /**
   * DISABLE ACCOUNT (NOT DELETE)
   */
  static async disableAccount(accountId, tenantId, user, reason = '') {
    if (!user || user.role?.name !== 'Admin') {
      throw new Error('Permission denied: Only administrators can disable accounts');
    }

    const account = await Account.findOne({
      _id: accountId,
      tenantId
    });

    if (!account) throw new Error('Account not found');

    if (account.isSystem) {
      throw new Error('System accounts cannot be disabled');
    }

    const childCount = await Account.countDocuments({
      parentId: accountId,
      isActive: true,
      tenantId
    });

    if (childCount > 0) {
      throw new Error('Cannot disable account that has active child accounts. Disable children first.');
    }

    Object.assign(account, {
      isActive: false,
      disabledBy: user._id,
      disabledAt: new Date()
    });

    await account.save();

    await AuditLog.log({
      userId: user._id,
      action: 'ACCOUNT_DISABLED',
      module: 'accounts',
      documentId: account._id,
      reference: account.code,
      details: {
        code: account.code,
        name: account.name,
        reason
      },
      tenantId
    }).catch(err => console.log('Audit log error:', err));

    return account;
  }

  /**
   * UPDATE ACCOUNT
   */
  static async updateAccount(accountId, data, tenantId, user) {
    const account = await Account.findOne({
      _id: accountId,
      tenantId
    });

    if (!account) throw new Error('Account not found');

    if (account.isSystem) {
      throw new Error('System accounts cannot be modified');
    }

    const allowedFields = ['name', 'description', 'category', 'subCategory', 'allowPosting', 'tags', 'notes'];
    allowedFields.forEach(field => {
      if (data[field] !== undefined) {
        account[field] = data[field];
      }
    });

    account.updatedBy = user._id;
    await account.save();

    await AuditService.logAction({
      tenantId,
      userId: user._id,
      action: 'UPDATE',
      module: 'account',
      recordId: account._id,
      changes: {
        before: Object.keys(data).reduce((acc, key) => {
          acc[key] = data[key];
          return acc;
        }, {}),
        after: data,
      },
    }).catch(err => console.log('Audit log error:', err));

    return account;
  }

  /**
   * DETERMINE NORMAL BALANCE SIDE
   */
  static getNormalBalance(type) {
    const balanceMap = {
      'Asset': 'Debit',
      'Expense': 'Debit',
      'Liability': 'Credit',
      'Equity': 'Credit',
      'Revenue': 'Credit'
    };
    return balanceMap[type] || 'Debit';
  }

  /**
   * GET ACCOUNTS BY TYPE
   */
  static async getAccountsByType(tenantId, type) {
    const validTypes = ['Asset', 'Liability', 'Equity', 'Revenue', 'Expense'];
    if (!validTypes.includes(type)) {
      throw new Error(`Invalid account type: ${type}`);
    }

    const accounts = await Account.find({
      tenantId,
      type,
      isActive: true,
      allowPosting: true
    })
      .sort({ code: 1 })
      .lean();

    return accounts;
  }

  /**
   * VALIDATE CODE UNIQUENESS
   */
  static async validateCodeUniqueness(code, tenantId, excludeId = null) {
    const query = { code, tenantId };
    if (excludeId) query._id = { $ne: excludeId };

    const existing = await Account.findOne(query);
    return !existing;
  }
}

module.exports = AccountService;

/**
 * Get accounts by type
 * @param {ObjectId} tenantId - Tenant ID
 * @param {string} type - Account type
 * @returns {Array} Accounts
 */
