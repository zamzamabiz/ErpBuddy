const Expense = require('./expense.model');
const Account = require('@modules/accounting/accounts/account.model');
const JournalService = require('../journal/journal.service');
const mongoose = require('mongoose');

/**
 * EXPENSE SERVICE
 * Handles expense creation with proper accounting integration
 * 
 * BUSINESS LOGIC:
 * - Track business expenses (transport, labour, packing, etc.)
 * - Create automatic journal entries
 * - Link expenses to sales/purchases when applicable
 */

/**
 * CREATE EXPENSE WITH ACCOUNTING ENTRY
 */
async function createExpense(data, req = {}) {
  // CRITICAL: Tenant ID must be provided
  if (!req.tenantId) {
    throw new Error('Tenant ID missing — unauthorized');
  }
  const tenantId = req.tenantId;
  const companyId = req.companyId || tenantId;
  const userId = req.userId || 'system';

  // Validate required fields
  if (!data.expenseType) {
    throw new Error('Expense type is required');
  }
  if (!data.amount || data.amount <= 0) {
    throw new Error('Amount must be positive');
  }
  if (!data.expenseAccountId) {
    throw new Error('Expense account ID is required');
  }
  if (!data.paymentAccountId) {
    throw new Error('Payment account ID is required');
  }

  const session = await mongoose.startSession();
  
  try {
    return await session.withTransaction(async () => {
      // 1. Validate accounts
      const expenseAccount = await Account.findOne({
        _id: data.expenseAccountId,
        tenantId,
        isActive: true,
        allowPosting: true
      }).session(session);

      if (!expenseAccount) {
        throw new Error('Expense account not found or inactive');
      }

      const paymentAccount = await Account.findOne({
        _id: data.paymentAccountId,
        tenantId,
        isActive: true,
        allowPosting: true
      }).session(session);

      if (!paymentAccount) {
        throw new Error('Payment account not found or inactive');
      }

      // 2. Create expense record
      const expenseData = {
        tenantId,
        companyId,
        expenseDate: data.expenseDate || new Date(),
        expenseType: data.expenseType,
        amount: data.amount,
        description: data.description || '',
        paymentAccountId: data.paymentAccountId,
        expenseAccountId: data.expenseAccountId,
        referenceId: data.referenceId || null,
        referenceType: data.referenceType || 'GENERAL',
        vendorId: data.vendorId || null,
        invoiceNumber: data.invoiceNumber || '',
        createdBy: userId
      };

      const expense = new Expense(expenseData);
      const savedExpense = await expense.save({ session });

      // 3. Create journal entry
      const journalEntry = await createExpenseJournalEntry(savedExpense, tenantId, companyId, userId, session);
      savedExpense.journalId = journalEntry.journalId;
      savedExpense.status = 'Posted';
      await savedExpense.save({ session });

      console.log('✅ Expense created with journal entry:', {
        expenseId: savedExpense._id,
        type: savedExpense.expenseType,
        amount: savedExpense.amount,
        journalId: journalEntry.journalId
      });

      return {
        success: true,
        data: savedExpense,
        journal: journalEntry
      };
    });
  } finally {
    await session.endSession();
  }
}

/**
 * CREATE EXPENSE JOURNAL ENTRY
 * DR Expense Account
 * CR Cash/Bank/Payable
 */
async function createExpenseJournalEntry(expense, tenantId, companyId, userId, session) {
  try {
    const journalResult = await JournalService.createJournal({
      tenantId,
      entries: [
        {
          accountId: expense.expenseAccountId,
          debit: expense.amount,
          credit: 0,
          description: `${expense.expenseType} expense: ${expense.description || expense._id}`
        },
        {
          accountId: expense.paymentAccountId,
          debit: 0,
          credit: expense.amount,
          description: `Payment for ${expense.expenseType} expense`
        }
      ],
      reference: `EXP-${expense._id.toString().slice(-6)}`,
      description: `${expense.expenseType} expense - ${expense.description || ''}`,
      source: 'EXPENSE',
      sourceId: expense._id,
      createdBy: userId
    });

    return {
      journalId: journalResult.journal._id,
      status: journalResult.journal.status,
      amount: expense.amount
    };
  } catch (error) {
    console.error('❌ Expense journal creation failed:', error.message);
    throw new Error(`Journal creation failed: ${error.message}`);
  }
}

/**
 * GET ALL EXPENSES
 */
async function getAllExpenses(req) {
  if (!req.tenantId) {
    throw new Error('Tenant ID missing — unauthorized');
  }
  const tenantId = req.tenantId;
  const companyId = req.companyId || tenantId;

  return await Expense.find({
    tenantId,
    companyId,
    deletedAt: null
  }).sort({ expenseDate: -1 });
}

/**
 * GET EXPENSE BY ID
 */
async function getExpenseById(id, req) {
  if (!req.tenantId) {
    throw new Error('Tenant ID missing — unauthorized');
  }
  const tenantId = req.tenantId;
  const companyId = req.companyId || tenantId;

  return await Expense.findOne({
    _id: id,
    tenantId,
    companyId,
    deletedAt: null
  });
}

/**
 * GET EXPENSES BY REFERENCE
 */
async function getExpensesByReference(referenceId, referenceType, req) {
  if (!req.tenantId) {
    throw new Error('Tenant ID missing — unauthorized');
  }
  const tenantId = req.tenantId;

  return await Expense.find({
    tenantId,
    referenceId,
    referenceType,
    deletedAt: null
  });
}

/**
 * DELETE EXPENSE (SOFT DELETE)
 */
async function deleteExpense(id, req) {
  if (!req.tenantId) {
    throw new Error('Tenant ID missing — unauthorized');
  }
  const tenantId = req.tenantId;
  const companyId = req.companyId || tenantId;
  const userId = req.userId || 'system';

  const expense = await Expense.findOne({
    _id: id,
    tenantId,
    companyId,
    deletedAt: null
  });

  if (!expense) {
    throw new Error('Expense not found');
  }

  if (expense.status !== 'Draft') {
    throw new Error('Only Draft expenses can be deleted');
  }

  const session = await mongoose.startSession();
  
  try {
    return await session.withTransaction(async () => {
      // Reverse journal entry if exists
      if (expense.journalId) {
        // Mark journal as reversed (implementation depends on journal service)
        console.log(`Reversing journal entry: ${expense.journalId}`);
      }

      // Soft delete expense
      await Expense.findOneAndUpdate(
        { _id: id, tenantId, companyId },
        { deletedAt: new Date(), updatedBy: userId },
        { session }
      );

      return { success: true, message: 'Expense deleted' };
    });
  } finally {
    await session.endSession();
  }
}

module.exports = {
  createExpense,
  getAllExpenses,
  getExpenseById,
  getExpensesByReference,
  deleteExpense
};