const mongoose = require('mongoose');
const Account = require('./account.model');

// ============================================
// CHART OF ACCOUNTS SEEDING
// ============================================

/**
 * Create Default Chart of Accounts for Tenant
 * Hierarchical structure: 5 root types with child hierarchy
 */
async function createDefaultChartOfAccounts(tenantId) {
  try {
    // Ensure tenantId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(tenantId)) {
      throw new Error(`Invalid tenantId: ${tenantId}`);
    }
    const tenantObjectId = new mongoose.Types.ObjectId(tenantId);

    // Check if accounts already exist for this tenant
    const existingCount = await Account.countDocuments({ tenantId: tenantObjectId, isSystem: true });
    if (existingCount > 0) {
      console.log(`✓ Chart of Accounts already exists for tenant ${tenantId}`);
      return null; // Already seeded
    }

    console.log(`Creating Chart of Accounts for tenant: ${tenantId}`);

    // Template structure with all levels
    const chartTemplate = [
      // ================================
      // 1. ASSETS (10000000)
      // ================================
      {
        code: '10000000',
        name: 'Assets',
        type: 'asset',
        category: 'Header',
        level: 1,
        parentId: null,
        allowPosting: false,
        normalBalance: 'Debit',
        children: [
          {
            code: '10010000',
            name: 'Current Assets',
            type: 'asset',
            category: 'Group',
            level: 2,
            allowPosting: false,
            normalBalance: 'Debit',
            children: [
              {
                code: '10010100',
                name: 'Cash and Bank',
                type: 'asset',
                category: 'Sub-group',
                level: 3,
                allowPosting: false,
                normalBalance: 'Debit',
                children: [
                  { code: '10010101', name: 'Cash in Hand', type: 'asset', category: 'Detail', level: 4, allowPosting: true, normalBalance: 'Debit' },
                  { code: '10010102', name: 'Bank Account - Current', type: 'asset', category: 'Detail', level: 4, allowPosting: true, normalBalance: 'Debit' },
                  { code: '10010103', name: 'Bank Account - Savings', type: 'asset', category: 'Detail', level: 4, allowPosting: true, normalBalance: 'Debit' }
                ]
              },
              {
                code: '10010200',
                name: 'Receivables',
                type: 'asset',
                category: 'Sub-group',
                level: 3,
                allowPosting: false,
                normalBalance: 'Debit',
                children: [
                  { code: '10010201', name: 'Accounts Receivable - Trade', type: 'asset', category: 'Detail', level: 4, allowPosting: true, normalBalance: 'Debit' },
                  { code: '10010202', name: 'Allowance for Doubtful Debts', type: 'asset', category: 'Detail', level: 4, allowPosting: true, normalBalance: 'Credit' }
                ]
              },
              {
                code: '10010300',
                name: 'Inventory',
                type: 'asset',
                category: 'Sub-group',
                level: 3,
                allowPosting: false,
                normalBalance: 'Debit',
                children: [
                  { code: '10010301', name: 'Raw Materials', type: 'asset', category: 'Detail', level: 4, allowPosting: true, normalBalance: 'Debit' },
                  { code: '10010302', name: 'Work in Progress', type: 'asset', category: 'Detail', level: 4, allowPosting: true, normalBalance: 'Debit' },
                  { code: '10010303', name: 'Finished Goods', type: 'asset', category: 'Detail', level: 4, allowPosting: true, normalBalance: 'Debit' }
                ]
              }
            ]
          },
          {
            code: '10020000',
            name: 'Fixed Assets',
            type: 'asset',
            category: 'Group',
            level: 2,
            allowPosting: false,
            normalBalance: 'Debit',
            children: [
              {
                code: '10020100',
                name: 'Property, Plant & Equipment',
                type: 'asset',
                category: 'Sub-group',
                level: 3,
                allowPosting: false,
                normalBalance: 'Debit',
                children: [
                  { code: '10020101', name: 'Building', type: 'asset', category: 'Detail', level: 4, allowPosting: true, normalBalance: 'Debit' },
                  { code: '10020102', name: 'Machinery', type: 'asset', category: 'Detail', level: 4, allowPosting: true, normalBalance: 'Debit' },
                  { code: '10020103', name: 'Equipment', type: 'asset', category: 'Detail', level: 4, allowPosting: true, normalBalance: 'Debit' },
                  { code: '10020104', name: 'Accumulated Depreciation', type: 'asset', category: 'Detail', level: 4, allowPosting: true, normalBalance: 'Credit' }
                ]
              }
            ]
          }
        ]
      },

      // ================================
      // 2. LIABILITIES (20000000)
      // ================================
      {
        code: '20000000',
        name: 'Liabilities',
        type: 'liability',
        category: 'Header',
        level: 1,
        parentId: null,
        allowPosting: false,
        normalBalance: 'Credit',
        children: [
          {
            code: '20010000',
            name: 'Current Liabilities',
            type: 'liability',
            category: 'Group',
            level: 2,
            allowPosting: false,
            normalBalance: 'Credit',
            children: [
              {
                code: '20010100',
                name: 'Payables',
                type: 'liability',
                category: 'Sub-group',
                level: 3,
                allowPosting: false,
                normalBalance: 'Credit',
                children: [
                  { code: '20010101', name: 'Accounts Payable - Trade', type: 'liability', category: 'Detail', level: 4, allowPosting: true, normalBalance: 'Credit' },
                  { code: '20010102', name: 'Accounts Payable - Other', type: 'liability', category: 'Detail', level: 4, allowPosting: true, normalBalance: 'Credit' }
                ]
              },
              {
                code: '20010200',
                name: 'Borrowings',
                type: 'liability',
                category: 'Sub-group',
                level: 3,
                allowPosting: false,
                normalBalance: 'Credit',
                children: [
                  { code: '20010201', name: 'Short-term Loans', type: 'liability', category: 'Detail', level: 4, allowPosting: true, normalBalance: 'Credit' },
                  { code: '20010202', name: 'Current Portion of Long-term Debt', type: 'liability', category: 'Detail', level: 4, allowPosting: true, normalBalance: 'Credit' }
                ]
              }
            ]
          },
          {
            code: '20020000',
            name: 'Long-term Liabilities',
            type: 'liability',
            category: 'Group',
            level: 2,
            allowPosting: false,
            normalBalance: 'Credit',
            children: [
              {
                code: '20020100',
                name: 'Long-term Borrowings',
                type: 'liability',
                category: 'Sub-group',
                level: 3,
                allowPosting: false,
                normalBalance: 'Credit',
                children: [
                  { code: '20020101', name: 'Long-term Loans', type: 'liability', category: 'Detail', level: 4, allowPosting: true, normalBalance: 'Credit' }
                ]
              }
            ]
          }
        ]
      },

      // ================================
      // 3. EQUITY (30000000)
      // ================================
      {
        code: '30000000',
        name: 'Equity',
        type: 'equity',
        category: 'Header',
        level: 1,
        parentId: null,
        allowPosting: false,
        normalBalance: 'Credit',
        children: [
          {
            code: '30010000',
            name: 'Capital',
            type: 'equity',
            category: 'Group',
            level: 2,
            allowPosting: false,
            normalBalance: 'Credit',
            children: [
              {
                code: '30010100',
                name: 'Paid-up Capital',
                type: 'equity',
                category: 'Sub-group',
                level: 3,
                allowPosting: false,
                normalBalance: 'Credit',
                children: [
                  { code: '30010101', name: 'Share Capital', type: 'equity', category: 'Detail', level: 4, allowPosting: true, normalBalance: 'Credit' },
                  { code: '30010102', name: 'Authorized Capital', type: 'equity', category: 'Detail', level: 4, allowPosting: true, normalBalance: 'Credit' }
                ]
              }
            ]
          },
          {
            code: '30020000',
            name: 'Retained Earnings',
            type: 'equity',
            category: 'Group',
            level: 2,
            allowPosting: false,
            normalBalance: 'Credit',
            children: [
              {
                code: '30020100',
                name: 'Profit/Loss',
                type: 'equity',
                category: 'Sub-group',
                level: 3,
                allowPosting: false,
                normalBalance: 'Credit',
                children: [
                  { code: '30020101', name: 'Retained Earnings', type: 'equity', category: 'Detail', level: 4, allowPosting: true, normalBalance: 'Credit' },
                  { code: '30020102', name: 'Current Year Profit/Loss', type: 'equity', category: 'Detail', level: 4, allowPosting: true, normalBalance: 'Credit' }
                ]
              }
            ]
          }
        ]
      },

      // ================================
      // 4. REVENUE (40000000)
      // ================================
      {
        code: '40000000',
        name: 'Revenue',
        type: 'income',
        category: 'Header',
        level: 1,
        parentId: null,
        allowPosting: false,
        normalBalance: 'Credit',
        children: [
          {
            code: '40010000',
            name: 'Sales Revenue',
            type: 'income',
            category: 'Group',
            level: 2,
            allowPosting: false,
            normalBalance: 'Credit',
            children: [
              {
                code: '40010100',
                name: 'Product Sales',
                type: 'income',
                category: 'Sub-group',
                level: 3,
                allowPosting: false,
                normalBalance: 'Credit',
                children: [
                  { code: '40010101', name: 'Domestic Sales', type: 'income', category: 'Detail', level: 4, allowPosting: true, normalBalance: 'Credit' },
                  { code: '40010102', name: 'Export Sales', type: 'income', category: 'Detail', level: 4, allowPosting: true, normalBalance: 'Credit' }
                ]
              },
              {
                code: '40010200',
                name: 'Service Revenue',
                type: 'income',
                category: 'Sub-group',
                level: 3,
                allowPosting: false,
                normalBalance: 'Credit',
                children: [
                  { code: '40010201', name: 'Service Income', type: 'income', category: 'Detail', level: 4, allowPosting: true, normalBalance: 'Credit' }
                ]
              }
            ]
          },
          {
            code: '40020000',
            name: 'Other Income',
            type: 'income',
            category: 'Group',
            level: 2,
            allowPosting: false,
            normalBalance: 'Credit',
            children: [
              {
                code: '40020100',
                name: 'Non-operating Income',
                type: 'income',
                category: 'Sub-group',
                level: 3,
                allowPosting: false,
                normalBalance: 'Credit',
                children: [
                  { code: '40020101', name: 'Interest Income', type: 'income', category: 'Detail', level: 4, allowPosting: true, normalBalance: 'Credit' },
                  { code: '40020102', name: 'Rental Income', type: 'income', category: 'Detail', level: 4, allowPosting: true, normalBalance: 'Credit' }
                ]
              }
            ]
          }
        ]
      },

      // ================================
      // 5. EXPENSES (50000000)
      // ================================
      {
        code: '50000000',
        name: 'Expenses',
        type: 'expense',
        category: 'Header',
        level: 1,
        parentId: null,
        allowPosting: false,
        normalBalance: 'Debit',
        children: [
          {
            code: '50010000',
            name: 'Cost of Goods Sold',
            type: 'expense',
            category: 'Group',
            level: 2,
            allowPosting: false,
            normalBalance: 'Debit',
            children: [
              {
                code: '50010100',
                name: 'Material Cost',
                type: 'expense',
                category: 'Sub-group',
                level: 3,
                allowPosting: false,
                normalBalance: 'Debit',
                children: [
                  { code: '50010101', name: 'Raw Material Used', type: 'expense', category: 'Detail', level: 4, allowPosting: true, normalBalance: 'Debit' }
                ]
              },
              {
                code: '50010200',
                name: 'Labor Cost',
                type: 'expense',
                category: 'Sub-group',
                level: 3,
                allowPosting: false,
                normalBalance: 'Debit',
                children: [
                  { code: '50010201', name: 'Direct Labor', type: 'expense', category: 'Detail', level: 4, allowPosting: true, normalBalance: 'Debit' }
                ]
              }
            ]
          },
          {
            code: '50020000',
            name: 'Operating Expenses',
            type: 'expense',
            category: 'Group',
            level: 2,
            allowPosting: false,
            normalBalance: 'Debit',
            children: [
              {
                code: '50020100',
                name: 'Salaries & Wages',
                type: 'expense',
                category: 'Sub-group',
                level: 3,
                allowPosting: false,
                normalBalance: 'Debit',
                children: [
                  { code: '50020101', name: 'Employee Salaries', type: 'expense', category: 'Detail', level: 4, allowPosting: true, normalBalance: 'Debit' },
                  { code: '50020102', name: 'Employee Benefits', type: 'expense', category: 'Detail', level: 4, allowPosting: true, normalBalance: 'Debit' }
                ]
              },
              {
                code: '50020200',
                name: 'Administrative Expenses',
                type: 'expense',
                category: 'Sub-group',
                level: 3,
                allowPosting: false,
                normalBalance: 'Debit',
                children: [
                  { code: '50020201', name: 'Office Rent', type: 'expense', category: 'Detail', level: 4, allowPosting: true, normalBalance: 'Debit' },
                  { code: '50020202', name: 'Utilities', type: 'expense', category: 'Detail', level: 4, allowPosting: true, normalBalance: 'Debit' },
                  { code: '50020203', name: 'Office Supplies', type: 'expense', category: 'Detail', level: 4, allowPosting: true, normalBalance: 'Debit' }
                ]
              },
              {
                code: '50020300',
                name: 'Sales & Marketing',
                type: 'expense',
                category: 'Sub-group',
                level: 3,
                allowPosting: false,
                normalBalance: 'Debit',
                children: [
                  { code: '50020301', name: 'Advertising', type: 'expense', category: 'Detail', level: 4, allowPosting: true, normalBalance: 'Debit' },
                  { code: '50020302', name: 'Travel & Entertainment', type: 'expense', category: 'Detail', level: 4, allowPosting: true, normalBalance: 'Debit' }
                ]
              },
              {
                code: '50020400',
                name: 'Depreciation & Amortization',
                type: 'expense',
                category: 'Sub-group',
                level: 3,
                allowPosting: false,
                normalBalance: 'Debit',
                children: [
                  { code: '50020401', name: 'Depreciation Expense', type: 'expense', category: 'Detail', level: 4, allowPosting: true, normalBalance: 'Debit' }
                ]
              }
            ]
          },
          {
            code: '50030000',
            name: 'Financial Expenses',
            type: 'expense',
            category: 'Group',
            level: 2,
            allowPosting: false,
            normalBalance: 'Debit',
            children: [
              {
                code: '50030100',
                name: 'Interest & Finance Charges',
                type: 'expense',
                category: 'Sub-group',
                level: 3,
                allowPosting: false,
                normalBalance: 'Debit',
                children: [
                  { code: '50030101', name: 'Interest Expense', type: 'expense', category: 'Detail', level: 4, allowPosting: true, normalBalance: 'Debit' }
                ]
              }
            ]
          }
        ]
      }
    ];

    // Insert accounts into database
    const insertedAccounts = await insertHierarchy(chartTemplate, tenantObjectId);

    console.log(`✓ Chart of Accounts created: ${insertedAccounts} accounts`);
    return {
      success: true,
      accountsCreated: insertedAccounts,
      tenantId: tenantObjectId
    };
  } catch (error) {
    console.error('Error creating Chart of Accounts:', error.message);
    throw error;
  }
}

/**
 * Recursively insert account hierarchy
 */
async function insertHierarchy(accounts, tenantId, parentId = null) {
  let totalInserted = 0;

  for (const account of accounts) {
    const children = account.children;
    delete account.children;

    // Create account document
    const accountDoc = new Account({
      ...account,
      tenantId,
      parentId: parentId || null,
      isSystem: true,
      isActive: true
      // createdBy and updatedBy will be null for system accounts
    });

    const savedAccount = await accountDoc.save();
    totalInserted++;

    // Recursively insert children
    if (children && children.length > 0) {
      totalInserted += await insertHierarchy(children, tenantId, savedAccount._id);
    }
  }

  return totalInserted;
}

/**
 * Get all system accounts for a tenant
 */
async function getSystemAccounts(tenantId) {
  return Account.find(
    { tenantId, isSystem: true, isActive: true },
    {},
    { sort: { code: 1 } }
  ).lean();
}

module.exports = {
  createDefaultChartOfAccounts,
  getSystemAccounts
};
