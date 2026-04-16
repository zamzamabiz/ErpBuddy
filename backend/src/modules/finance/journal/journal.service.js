const mongoose = require('mongoose');
const Journal = require('./journal.model');
const JournalLine = require('./journalLine.model');
const Account = require('../../accounting/accounts/account.model');
const AuditService = require('../../audit/audit.service');
const documentNumberService = require('../../engines/documentNumbering/documentNumber.service');

/**
 * JOURNAL SERVICE - Core Accounting Engine
 * Handles journal creation, validation, and posting
 */
class JournalService {
  /**
   * VALIDATE JOURNAL ENTRIES (CRITICAL)
   * Enforces double-entry bookkeeping rules
   */
  static async validateJournalEntries(entries, tenantId) {
    const errors = [];

    // Check minimum entries
    if (!entries || entries.length < 2) {
      throw new Error('Journal must have at least 2 entries');
    }

    // Track totals
    let totalDebit = 0;
    let totalCredit = 0;
    const accountIds = new Set();

    // Validate each entry
    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];

      // Check required fields
      if (!entry.accountId) {
        errors.push(`Entry ${i + 1}: Account ID is required`);
        continue;
      }

      // Check debit/credit
      const debit = parseFloat(entry.debit) || 0;
      const credit = parseFloat(entry.credit) || 0;

      if (debit < 0 || credit < 0) {
        errors.push(`Entry ${i + 1}: Negative amounts not allowed`);
      }

      if (debit === 0 && credit === 0) {
        errors.push(`Entry ${i + 1}: Either debit or credit must be specified`);
      }

      if (debit > 0 && credit > 0) {
        errors.push(`Entry ${i + 1}: Cannot have both debit and credit`);
      }

      // Prevent zero-value entries
      if (debit === 0 && credit === 0) {
        errors.push(`Entry ${i + 1}: Zero-value entries not allowed`);
      }

      accountIds.add(entry.accountId);
      totalDebit += debit;
      totalCredit += credit;
    }

    // If validation errors exist, throw
    if (errors.length > 0) {
      throw new Error(`Validation failed:\n${errors.join('\n')}`);
    }

    // CHECK BALANCE (Most critical rule)
    const tolerance = 0.01; // Allow for rounding
    if (Math.abs(totalDebit - totalCredit) > tolerance) {
      throw new Error(
        `Journal not balanced. Total Debit: ${totalDebit.toFixed(2)}, Total Credit: ${totalCredit.toFixed(2)}`
      );
    }

    // FETCH ALL ACCOUNTS AT ONCE (for validation)
    const accounts = await Account.find(
      {
        _id: { $in: Array.from(accountIds) },
        tenantId: tenantId
      },
      'code name type allowPosting'
    );

    const accountMap = new Map(accounts.map(a => [a._id.toString(), a]));

    // VALIDATE EACH ACCOUNT
    for (const accountId of accountIds) {
      const account = accountMap.get(accountId.toString());

      if (!account) {
        throw new Error(`Account ${accountId} not found or invalid for this tenant`);
      }

      if (!account.allowPosting) {
        throw new Error(
          `Cannot post to account [${account.code}] ${account.name} - parent accounts not allowed`
        );
      }
    }

    return {
      valid: true,
      totalDebit,
      totalCredit,
      isBalanced: Math.abs(totalDebit - totalCredit) < tolerance,
      accountMap
    };
  }

  /**
   * CREATE JOURNAL ENTRY (GENERIC)
   * For manual journal entries
   */
  static async createJournal({
    tenantId,
    entries,
    reference = null,
    description = '',
    source = 'MANUAL',
    sourceId = null,
    createdBy
  }) {
    // Validate entries
    const validation = await JournalService.validateJournalEntries(entries, tenantId);

    // Generate reference if not provided
    if (!reference) {
      const docResult = await documentNumberService.generateDocumentNumber('journal', tenantId);
      reference = docResult.documentNumber;
    }

    // Use mongoose session for atomic transaction
    const session = await mongoose.startSession();
    
    try {
      return await session.withTransaction(async () => {
        // Create journal master
        const journal = new Journal({
          tenantId,
          date: new Date(),
          reference,
          description,
          source,
          sourceId,
          status: 'DRAFT',
          totalDebit: validation.totalDebit,
          totalCredit: validation.totalCredit,
          isBalanced: validation.isBalanced,
          createdBy
        });

        const savedJournal = await journal.save({ session });

        // Create journal entries
        const journalEntries = [];
        for (const entry of entries) {
          const account = validation.accountMap.get(entry.accountId.toString());

          const debit = parseFloat(entry.debit) || 0;
          const credit = parseFloat(entry.credit) || 0;

          const journalEntry = new JournalLine({
            journalId: savedJournal._id,
            tenantId,
            accountId: entry.accountId,
            accountCode: account.code,
            accountName: account.name,
            accountType: account.type,
            debit,
            credit,
            description: entry.description || ''
          });

          journalEntries.push(journalEntry);
        }

        await JournalLine.insertMany(journalEntries, { session });

        // Audit log (within transaction)
        try {
          await AuditService.logAction({
            tenantId,
            userId: createdBy,
            action: 'CREATE',
            module: 'journal',
            recordId: savedJournal._id,
            changes: {
              reference,
              totalDebit: validation.totalDebit,
              totalCredit: validation.totalCredit,
            },
          });
        } catch (auditError) {
          console.warn('Audit log failed but journal created:', auditError.message);
        }

        return {
          success: true,
          journal: {
            _id: savedJournal._id,
            reference: savedJournal.reference,
            totalDebit: savedJournal.totalDebit,
            totalCredit: savedJournal.totalCredit,
            isBalanced: savedJournal.isBalanced,
            status: savedJournal.status
          },
          entriesCount: journalEntries.length
        };
      });
    } finally {
      await session.endSession();
    }
  }

  /**
   * POST SALE JOURNAL
   * Auto-create journal for sales invoice
   */
  static async postSaleJournal({
    tenantId,
    saleId,
    customerAccountId,
    revenueAccountId,
    amount,
    reference,
    createdBy
  }) {
    if (!amount || amount <= 0) {
      throw new Error('Sale amount must be greater than 0');
    }

    // Validate accounts exist and belong to tenant
    const [customerAccount, revenueAccount] = await Promise.all([
      Account.findOne({ _id: customerAccountId, tenantId, allowPosting: true }),
      Account.findOne({ _id: revenueAccountId, tenantId, allowPosting: true })
    ]);

    if (!customerAccount) {
      throw new Error('Customer Account not found or invalid');
    }
    if (!revenueAccount) {
      throw new Error('Revenue Account not found or invalid');
    }

    // Create journal with sale source
    const journal = new Journal({
      tenantId,
      date: new Date(),
      reference,
      description: `Sales Invoice - ${reference}`,
      source: 'SALE',
      sourceId: saleId,
      status: 'POSTED',
      totalDebit: amount,
      totalCredit: amount,
      isBalanced: true,
      createdBy,
      postedBy: createdBy,
      postedAt: new Date()
    });

    const savedJournal = await journal.save();

    // Create entries
    const journalEntries = [
      new JournalLine({
        journalId: savedJournal._id,
        tenantId,
        accountId: customerAccountId,
        accountCode: customerAccount.code,
        accountName: customerAccount.name,
        accountType: customerAccount.type,
        debit: amount,
        credit: 0,
        description: `Sale - ${reference}`
      }),
      new JournalLine({
        journalId: savedJournal._id,
        tenantId,
        accountId: revenueAccountId,
        accountCode: revenueAccount.code,
        accountName: revenueAccount.name,
        accountType: revenueAccount.type,
        debit: 0,
        credit: amount,
        description: `Sale Income - ${reference}`
      })
    ];

    await JournalLine.insertMany(journalEntries);

    // Audit log
    await AuditService.logAction({
      action: 'SALE_POSTED',
      userId: createdBy,
      tenantId,
      entity: 'SalesInvoice',
      entityId: saleId,
      reference
    }).catch(() => {});

    return {
      success: true,
      journalId: savedJournal._id,
      status: 'POSTED',
      amount
    };
  }

  /**
   * POST PURCHASE JOURNAL
   * Auto-create journal for purchase bill
   */
  static async postPurchaseJournal({
    tenantId,
    purchaseId,
    expenseAccountId,
    supplierAccountId,
    amount,
    reference,
    createdBy
  }) {
    if (!amount || amount <= 0) {
      throw new Error('Purchase amount must be greater than 0');
    }

    // Validate accounts exist and belong to tenant
    const [expenseAccount, supplierAccount] = await Promise.all([
      Account.findOne({ _id: expenseAccountId, tenantId, allowPosting: true }),
      Account.findOne({ _id: supplierAccountId, tenantId, allowPosting: true })
    ]);

    if (!expenseAccount) {
      throw new Error('Expense Account not found or invalid');
    }
    if (!supplierAccount) {
      throw new Error('Supplier Account not found or invalid');
    }

    // Create journal (Purchase: Debit Expense, Credit Liability)
    const journal = new Journal({
      tenantId,
      date: new Date(),
      reference,
      description: `Purchase Bill - ${reference}`,
      source: 'PURCHASE',
      sourceId: purchaseId,
      status: 'POSTED',
      totalDebit: amount,
      totalCredit: amount,
      isBalanced: true,
      createdBy,
      postedBy: createdBy,
      postedAt: new Date()
    });

    const savedJournal = await journal.save();

    // Create entries
    const journalEntries = [
      new JournalLine({
        journalId: savedJournal._id,
        tenantId,
        accountId: expenseAccountId,
        accountCode: expenseAccount.code,
        accountName: expenseAccount.name,
        accountType: expenseAccount.type,
        debit: amount,
        credit: 0,
        description: `Purchase - ${reference}`
      }),
      new JournalLine({
        journalId: savedJournal._id,
        tenantId,
        accountId: supplierAccountId,
        accountCode: supplierAccount.code,
        accountName: supplierAccount.name,
        accountType: supplierAccount.type,
        debit: 0,
        credit: amount,
        description: `Supplier Liability - ${reference}`
      })
    ];

    await JournalLine.insertMany(journalEntries);

    // Audit log
    await AuditService.logAction({
      action: 'PURCHASE_POSTED',
      userId: createdBy,
      tenantId,
      entity: 'PurchaseBill',
      entityId: purchaseId,
      reference
    }).catch(() => {});

    return {
      success: true,
      journalId: savedJournal._id,
      status: 'POSTED',
      amount
    };
  }

  /**
   * GET JOURNAL WITH ENTRIES
   */
  static async getJournal(journalId, tenantId) {
    const journal = await Journal.findOne(
      { _id: journalId, tenantId, deletedAt: null },
      null,
      { lean: true }
    );

    if (!journal) {
      throw new Error('Journal not found');
    }

    const entries = await JournalLine.find(
      { journalId, tenantId },
      null,
      { lean: true }
    );

    return {
      ...journal,
      entries
    };
  }

  /**
   * LIST JOURNALS (with pagination)
   */
  static async listJournals(tenantId, { status = null, source = null, skip = 0, limit = 50 } = {}) {
    const query = { tenantId, deletedAt: null };
    if (status) query.status = status;
    if (source) query.source = source;

    const journals = await Journal.find(query, null, {
      sort: { date: -1, createdAt: -1 },
      skip,
      limit,
      lean: true
    });

    const total = await Journal.countDocuments(query);

    return {
      journals,
      total,
      skip,
      limit
    };
  }

  /**
   * POST JOURNAL (mark status as POSTED)
   * For draft journals - makes them official
   */
  static async postJournal(journalId, tenantId, userId) {
    const journal = await Journal.findOne({ _id: journalId, tenantId, deletedAt: null });

    if (!journal) {
      throw new Error('Journal not found');
    }

    if (journal.status === 'POSTED') {
      throw new Error('Journal already posted');
    }

    journal.status = 'POSTED';
    journal.postedBy = userId;
    journal.postedAt = new Date();

    await journal.save();

    await AuditService.logAction({
      tenantId,
      userId,
      action: 'POST',
      module: 'journal',
      recordId: journalId,
    }).catch(() => {});

    return {
      success: true,
      status: 'POSTED'
    };
  }

  /**
   * DELETE JOURNAL (soft delete - only if DRAFT)
   */
  static async deleteJournal(journalId, tenantId, userId) {
    const journal = await Journal.findOne({ _id: journalId, tenantId, deletedAt: null });

    if (!journal) {
      throw new Error('Journal not found');
    }

    if (journal.status === 'POSTED') {
      throw new Error('Cannot delete posted journal');
    }

    // Soft delete journal
    await Journal.findOneAndUpdate(
      { _id: journalId, tenantId, deletedAt: null },
      { deletedAt: new Date() },
      { new: true }
    );

    await AuditService.logAction({
      tenantId,
      userId,
      action: 'DELETE',
      module: 'journal',
      recordId: journalId,
    }).catch(() => {});

    return {
      success: true,
      message: 'Journal deleted'
    };
  }

  /**
   * RESTORE JOURNAL (undo soft delete)
   */
  static async restoreJournal(journalId, tenantId, userId) {
    const journal = await Journal.findOne({ _id: journalId, tenantId, deletedAt: { $ne: null } });

    if (!journal) {
      throw new Error('Deleted journal not found');
    }

    // Restore journal
    await Journal.findOneAndUpdate(
      { _id: journalId, tenantId },
      { deletedAt: null },
      { new: true }
    );

    await AuditService.logAction({
      tenantId,
      userId,
      action: 'RESTORE',
      module: 'journal',
      recordId: journalId,
    }).catch(() => {});

    return {
      success: true,
      message: 'Journal restored'
    };
  }

  /**
   * GET JOURNALS BY SOURCE ID (For purchase, sale, etc.)
   * Links journals to their source documents
   */
  static async getJournalsBySourceId(sourceId, tenantId) {
    const journal = await Journal.findOne(
      { sourceId, tenantId, deletedAt: null }
    );

    if (!journal) {
      return null;
    }

    const lines = await JournalLine.find(
      { journalId: journal._id, deletedAt: null }
    );

    return {
      ...journal.toObject(),
      lines
    };
  }
}

module.exports = JournalService;
