const Journal = require('./journal.model');
const JournalLine = require('./journalLine.model');

class JournalRepository {
  /**
   * Create a draft journal entry with lines
   * Tries transaction first, falls back to non-transactional if needed
   */
  async createJournal(journalData, lines) {
    let session = null;
    
    try {
      // Attempt transactional creation
      session = await Journal.startSession();
      session.startTransaction();

      try {
        // Create journal header
        const journal = new Journal(journalData);
        await journal.save({ session });

        // Create journal lines
        const lineData = lines.map(line => ({
          ...line,
          journalId: journal._id,
          tenantId: journal.tenantId
        }));
        await JournalLine.insertMany(lineData, { session });

        await session.commitTransaction();
        return journal;
      } catch (error) {
        await session.abortTransaction();
        throw error;
      } finally {
        session.endSession();
      }
    } catch (transactionError) {
      // If transaction fails (e.g., no replica set), use fallback
      if (transactionError.message && transactionError.message.includes('replica set')) {
        console.warn('Transaction not available, using fallback mode:', transactionError.message);
        
        try {
          // Fallback: Create without transaction
          const journal = new Journal(journalData);
          await journal.save();

          const lineData = lines.map(line => ({
            ...line,
            journalId: journal._id,
            tenantId: journal.tenantId
          }));
          await JournalLine.insertMany(lineData);

          console.info(`Fallback journal created successfully: ${journal._id}`);
          return journal;
        } catch (fallbackError) {
          console.error('Fallback creation also failed:', fallbackError.message);
          throw fallbackError;
        }
      } else {
        // Not a transaction issue, re-throw original error
        throw transactionError;
      }
    }
  }

  /**
   * Find journal by ID with lines
   */
  async findJournalById(journalId, tenantId) {
    const journal = await Journal.findOne({
      _id: journalId,
      tenantId
    }).lean();

    if (!journal) return null;

    const lines = await JournalLine.find({
      journalId,
      $or: [
        { tenantId: tenantId },
        { tenantId: { $exists: false } }
      ]
    })
      .populate('accountId', 'code name type')
      .lean();

    return { ...journal, lines };
  }

  /**
   * Find by reference (document number)
   */
  async findByReference(reference, tenantId) {
    return Journal.findOne({ reference, tenantId }).lean();
  }

  /**
   * List journals for a tenant
   */
  async listJournals(tenantId, filters = {}) {
    const query = { tenantId };
    
    if (filters.status) query.status = filters.status;
    if (filters.dateFrom || filters.dateTo) {
      query.date = {};
      if (filters.dateFrom) query.date.$gte = new Date(filters.dateFrom);
      if (filters.dateTo) query.date.$lte = new Date(filters.dateTo);
    }

    return Journal.find(query)
      .sort({ date: -1, createdAt: -1 })
      .lean();
  }

  /**
   * Update journal header (only draft entries)
   */
  async updateJournal(journalId, tenantId, updateData) {
    const journal = await Journal.findOne({
      _id: journalId,
      tenantId,
      status: 'draft'
    });

    if (!journal) return null;

    Object.assign(journal, updateData);
    journal.updatedAt = new Date();
    return journal.save();
  }

  /**
   * Update journal lines (only draft entries)
   */
  async updateJournalLines(journalId, tenantId, lines) {
    const session = await Journal.startSession();
    session.startTransaction();

    try {
      // Verify journal exists and is draft
      const journal = await Journal.findOne({
        _id: journalId,
        tenantId,
        status: 'draft'
      }).session(session);

      if (!journal) return null;

      // Delete old lines
      await JournalLine.deleteMany({ journalId, tenantId }, { session });

      // Insert new lines
      const lineData = lines.map(line => ({
        ...line,
        journalId,
        tenantId
      }));
      await JournalLine.insertMany(lineData, { session });

      await session.commitTransaction();
      return true;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Post a journal entry (change status to posted)
   */
  async postJournal(journalId, tenantId) {
    return Journal.findOneAndUpdate(
      { _id: journalId, tenantId, status: 'draft' },
      { status: 'posted', updatedAt: new Date() },
      { new: true }
    );
  }

  /**
   * Get lines for a journal
   */
  async getJournalLines(journalId, tenantId) {
    // Query with tenantId + backward compatibility for old records
    return JournalLine.find({
      journalId,
      $or: [
        { tenantId: tenantId },
        { tenantId: { $exists: false } }
      ]
    })
      .populate('accountId', 'code name type')
      .lean();
  }

  /**
   * Calculate totals from lines
   */
  async calculateTotals(journalId, tenantId) {
    const lines = await JournalLine.find({ journalId, tenantId }).lean();
    const totalDebit = lines.reduce((sum, line) => sum + (line.debit || 0), 0);
    const totalCredit = lines.reduce((sum, line) => sum + (line.credit || 0), 0);
    return { totalDebit, totalCredit, lineCount: lines.length };
  }

  /**
   * Check if reference exists
   */
  async referenceExists(reference, tenantId) {
    return Journal.findOne({ reference, tenantId }).lean();
  }

  /**
   * Delete journal (only draft)
   */
  async deleteJournal(journalId, tenantId) {
    const session = await Journal.startSession();
    session.startTransaction();

    try {
      const journal = await Journal.findOne({
        _id: journalId,
        tenantId,
        status: 'draft'
      }).session(session);

      if (!journal) return null;

      await JournalLine.deleteMany({ journalId, tenantId }, { session });
      await Journal.deleteOne({ _id: journalId }, { session });

      await session.commitTransaction();
      return true;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }
}

module.exports = new JournalRepository();
