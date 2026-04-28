/**
 * SEED SCRIPT FOR DASHBOARD TEST DATA
 * ====================================
 * This script creates test financial data to populate the dashboard
 * 
 * Run with: node seed-dashboard-data.js
 */

const mongoose = require('mongoose');
require('module-alias/register');
const dotenv = require('dotenv');

dotenv.config();

// Import models
const Journal = require('@modules/finance/journal/journal.model');
const JournalLine = require('@modules/finance/journal/journalLine.model');
const Account = require('@modules/accounting/accounts/account.model');
const User = require('@modules/core/users/user.model');

// Test tenant ID (from the admin user)
const TENANT_ID = '69d9ea2eeee9d3fd6f43ab6f';

async function seedDashboardData() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/erpbuddy');
    console.log('✅ Connected to MongoDB');

    // Get admin user to confirm tenant
    const adminUser = await User.findOne({ email: 'admin@erpbuddy.com' });
    if (!adminUser) {
      console.error('❌ Admin user not found');
      process.exit(1);
    }
    console.log(`📋 Using tenant ID: ${adminUser.tenantId}`);
    const tenantId = adminUser.tenantId.toString();
    const adminUserId = adminUser._id.toString();

    // Clear existing journal entries for clean test
    await JournalLine.deleteMany({ tenantId: new mongoose.Types.ObjectId(tenantId) });
    await Journal.deleteMany({ tenantId: new mongoose.Types.ObjectId(tenantId) });
    console.log('🧹 Cleared existing journal entries');

    // Ensure chart of accounts exists
    await ensureChartOfAccounts(tenantId);
    console.log('✅ Chart of accounts verified');

    // Create test journal entries
    await createTestJournalEntries(tenantId, adminUserId);
    console.log('✅ Test journal entries created');

    // Verify the data
    const summary = await testSummary(tenantId);
    console.log('\n📊 DASHBOARD SUMMARY:');
    console.log(`   Assets: $${summary.financialPosition.assets.toLocaleString()}`);
    console.log(`   Liabilities: $${summary.financialPosition.liabilities.toLocaleString()}`);
    console.log(`   Equity: $${summary.financialPosition.equity.toLocaleString()}`);
    console.log(`   Income: $${summary.profitAndLoss.income.toLocaleString()}`);
    console.log(`   Expenses: $${summary.profitAndLoss.expenses.toLocaleString()}`);
    console.log(`   Net Income: $${summary.profitAndLoss.netIncome.toLocaleString()}`);
    
    const equation = `   ${summary.financialPosition.assets} = ${summary.financialPosition.liabilities} + ${summary.financialPosition.equity}`;
    console.log(`\n   Accounting Equation: ${equation}`);

    console.log('\n✅ Dashboard seed complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  }
}

async function ensureChartOfAccounts(tenantId) {
  const accounts = [
    // Assets
    { code: '1000', name: 'Cash', type: 'asset', normalBalance: 'Debit', tenantId },
    { code: '1100', name: 'Accounts Receivable', type: 'asset', normalBalance: 'Debit', tenantId },
    { code: '1200', name: 'Inventory', type: 'asset', normalBalance: 'Debit', tenantId },
    { code: '1500', name: 'Equipment', type: 'asset', normalBalance: 'Debit', tenantId },
    
    // Liabilities
    { code: '2000', name: 'Accounts Payable', type: 'liability', normalBalance: 'Credit', tenantId },
    { code: '2100', name: 'Notes Payable', type: 'liability', normalBalance: 'Credit', tenantId },
    { code: '2200', name: 'Accrued Expenses', type: 'liability', normalBalance: 'Credit', tenantId },
    
    // Equity
    { code: '3000', name: 'Common Stock', type: 'equity', normalBalance: 'Credit', tenantId },
    { code: '3100', name: 'Retained Earnings', type: 'equity', normalBalance: 'Credit', tenantId },
    
    // Income
    { code: '4000', name: 'Sales Revenue', type: 'income', normalBalance: 'Credit', tenantId },
    { code: '4100', name: 'Service Revenue', type: 'income', normalBalance: 'Credit', tenantId },
    
    // Expenses
    { code: '5000', name: 'Cost of Goods Sold', type: 'expense', normalBalance: 'Debit', tenantId },
    { code: '5100', name: 'Salaries Expense', type: 'expense', normalBalance: 'Debit', tenantId },
    { code: '5200', name: 'Rent Expense', type: 'expense', normalBalance: 'Debit', tenantId },
    { code: '5300', name: 'Utilities Expense', type: 'expense', normalBalance: 'Debit', tenantId },
  ];

  for (const acc of accounts) {
    const existing = await Account.findOne({ code: acc.code, tenantId: new mongoose.Types.ObjectId(tenantId) });
    if (!existing) {
      await Account.create({ ...acc, tenantId: new mongoose.Types.ObjectId(tenantId) });
      console.log(`   Created account: ${acc.code} - ${acc.name}`);
    }
  }
}

async function createTestJournalEntries(tenantId, adminUserId) {
  const objectId = (id) => new mongoose.Types.ObjectId(id);
  const tenantObjId = objectId(tenantId);

  // Get accounts
  const accounts = await Account.find({ tenantId: tenantObjId });
  const getAccount = (code) => accounts.find(a => a.code === code);

  // Entry 1: Initial investment - Owner invests $50,000 cash
  const journal1 = await Journal.create({
    tenantId: tenantObjId,
    date: new Date('2024-01-01'),
    description: 'Owner initial investment',
    reference: 'JE-001',
    source: 'MANUAL',
    status: 'POSTED',
    createdBy: objectId(adminUserId),
    postedBy: objectId(adminUserId),
    postedAt: new Date(),
    totalDebit: 50000,
    totalCredit: 50000,
    isBalanced: true
  });

  await JournalLine.create([
    {
      journalId: journal1._id,
      tenantId: tenantObjId,
      accountId: getAccount('1000')._id,
      accountCode: '1000',
      accountName: 'Cash',
      accountType: 'asset',
      debit: 50000,
      credit: 0,
      description: 'Cash investment'
    },
    {
      journalId: journal1._id,
      tenantId: tenantObjId,
      accountId: getAccount('3000')._id,
      accountCode: '3000',
      accountName: 'Common Stock',
      accountType: 'equity',
      debit: 0,
      credit: 50000,
      description: 'Common stock issued'
    }
  ]);
  console.log('   Created JE-001: Owner investment $50,000');

  // Entry 2: Purchase equipment for cash - $15,000
  const journal2 = await Journal.create({
    tenantId: tenantObjId,
    date: new Date('2024-01-05'),
    description: 'Purchase equipment',
    reference: 'JE-002',
    source: 'MANUAL',
    status: 'POSTED',
    createdBy: objectId(adminUserId),
    postedBy: objectId(adminUserId),
    postedAt: new Date(),
    totalDebit: 15000,
    totalCredit: 15000,
    isBalanced: true
  });

  await JournalLine.create([
    {
      journalId: journal2._id,
      tenantId: tenantObjId,
      accountId: getAccount('1500')._id,
      accountCode: '1500',
      accountName: 'Equipment',
      accountType: 'asset',
      debit: 15000,
      credit: 0,
      description: 'Equipment purchase'
    },
    {
      journalId: journal2._id,
      tenantId: tenantObjId,
      accountId: getAccount('1000')._id,
      accountCode: '1000',
      accountName: 'Cash',
      accountType: 'asset',
      debit: 0,
      credit: 15000,
      description: 'Cash payment'
    }
  ]);
  console.log('   Created JE-002: Equipment purchase $15,000');

  // Entry 3: Sales revenue for cash - $25,000
  const journal3 = await Journal.create({
    tenantId: tenantObjId,
    date: new Date('2024-01-15'),
    description: 'Sales revenue',
    reference: 'JE-003',
    source: 'MANUAL',
    status: 'POSTED',
    createdBy: objectId(adminUserId),
    postedBy: objectId(adminUserId),
    postedAt: new Date(),
    totalDebit: 25000,
    totalCredit: 25000,
    isBalanced: true
  });

  await JournalLine.create([
    {
      journalId: journal3._id,
      tenantId: tenantObjId,
      accountId: getAccount('1000')._id,
      accountCode: '1000',
      accountName: 'Cash',
      accountType: 'asset',
      debit: 25000,
      credit: 0,
      description: 'Cash sales'
    },
    {
      journalId: journal3._id,
      tenantId: tenantObjId,
      accountId: getAccount('4000')._id,
      accountCode: '4000',
      accountName: 'Sales Revenue',
      accountType: 'income',
      debit: 0,
      credit: 25000,
      description: 'Revenue earned'
    }
  ]);
  console.log('   Created JE-003: Sales revenue $25,000');

  // Entry 4: Pay salaries expense - $8,000
  const journal4 = await Journal.create({
    tenantId: tenantObjId,
    date: new Date('2024-01-20'),
    description: 'Pay salaries',
    reference: 'JE-004',
    source: 'MANUAL',
    status: 'POSTED',
    createdBy: objectId(adminUserId),
    postedBy: objectId(adminUserId),
    postedAt: new Date(),
    totalDebit: 8000,
    totalCredit: 8000,
    isBalanced: true
  });

  await JournalLine.create([
    {
      journalId: journal4._id,
      tenantId: tenantObjId,
      accountId: getAccount('5100')._id,
      accountCode: '5100',
      accountName: 'Salaries Expense',
      accountType: 'expense',
      debit: 8000,
      credit: 0,
      description: 'Salary payment'
    },
    {
      journalId: journal4._id,
      tenantId: tenantObjId,
      accountId: getAccount('1000')._id,
      accountCode: '1000',
      accountName: 'Cash',
      accountType: 'asset',
      debit: 0,
      credit: 8000,
      description: 'Cash payment'
    }
  ]);
  console.log('   Created JE-004: Salaries expense $8,000');

  // Entry 5: Pay rent expense - $3,000
  const journal5 = await Journal.create({
    tenantId: tenantObjId,
    date: new Date('2024-01-25'),
    description: 'Pay rent',
    reference: 'JE-005',
    source: 'MANUAL',
    status: 'POSTED',
    createdBy: objectId(adminUserId),
    postedBy: objectId(adminUserId),
    postedAt: new Date(),
    totalDebit: 3000,
    totalCredit: 3000,
    isBalanced: true
  });

  await JournalLine.create([
    {
      journalId: journal5._id,
      tenantId: tenantObjId,
      accountId: getAccount('5200')._id,
      accountCode: '5200',
      accountName: 'Rent Expense',
      accountType: 'expense',
      debit: 3000,
      credit: 0,
      description: 'Rent payment'
    },
    {
      journalId: journal5._id,
      tenantId: tenantObjId,
      accountId: getAccount('1000')._id,
      accountCode: '1000',
      accountName: 'Cash',
      accountType: 'asset',
      debit: 0,
      credit: 3000,
      description: 'Cash payment'
    }
  ]);
  console.log('   Created JE-005: Rent expense $3,000');

  // Entry 6: Purchase inventory on credit - $10,000
  const journal6 = await Journal.create({
    tenantId: tenantObjId,
    date: new Date('2024-01-28'),
    description: 'Purchase inventory on credit',
    reference: 'JE-006',
    source: 'MANUAL',
    status: 'POSTED',
    createdBy: objectId(adminUserId),
    postedBy: objectId(adminUserId),
    postedAt: new Date(),
    totalDebit: 10000,
    totalCredit: 10000,
    isBalanced: true
  });

  await JournalLine.create([
    {
      journalId: journal6._id,
      tenantId: tenantObjId,
      accountId: getAccount('1200')._id,
      accountCode: '1200',
      accountName: 'Inventory',
      accountType: 'asset',
      debit: 10000,
      credit: 0,
      description: 'Inventory purchase'
    },
    {
      journalId: journal6._id,
      tenantId: tenantObjId,
      accountId: getAccount('2000')._id,
      accountCode: '2000',
      accountName: 'Accounts Payable',
      accountType: 'liability',
      debit: 0,
      credit: 10000,
      description: 'Credit purchase'
    }
  ]);
  console.log('   Created JE-006: Inventory purchase on credit $10,000');
}

async function testSummary(tenantId) {
  // Simple calculation based on journal lines
  const lines = await JournalLine.find({ tenantId: new mongoose.Types.ObjectId(tenantId) });
  
  const accounts = await Account.find({ tenantId: new mongoose.Types.ObjectId(tenantId) });
  
  const accountMap = new Map();
  for (const line of lines) {
    const acc = accounts.find(a => a._id.toString() === line.accountId.toString());
    if (!acc) continue;
    
    if (!accountMap.has(acc.code)) {
      accountMap.set(acc.code, {
        code: acc.code,
        name: acc.name,
        type: acc.type,
        debit: 0,
        credit: 0
      });
    }
    
    const a = accountMap.get(acc.code);
    a.debit += line.debit || 0;
    a.credit += line.credit || 0;
  }

  let assets = 0, liabilities = 0, equity = 0, income = 0, expenses = 0;
  
  for (const [code, acc] of accountMap) {
    const balance = acc.type === 'asset' || acc.type === 'expense' 
      ? acc.debit - acc.credit 
      : acc.credit - acc.debit;
    
    switch (acc.type) {
      case 'asset': assets += balance; break;
      case 'liability': liabilities += balance; break;
      case 'equity': equity += balance; break;
      case 'income': income += balance; break;
      case 'expense': expenses += balance; break;
    }
  }

  return {
    financialPosition: { assets, liabilities, equity },
    profitAndLoss: { income, expenses, netIncome: income - expenses }
  };
}

// Run the seed
seedDashboardData();