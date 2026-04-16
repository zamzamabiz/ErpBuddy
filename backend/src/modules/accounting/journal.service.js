const Journal = require('../finance/journal/journal.model');

async function createJournalEntry(entries, reference, description = '', source = 'MANUAL', sourceId = null, companyId = null) {
  try {
    // Validate entries
    if (!entries || !Array.isArray(entries) || entries.length === 0) {
      throw new Error('Journal entries array is required');
    }

    // Calculate totals
    let totalDebit = 0;
    let totalCredit = 0;

    entries.forEach(entry => {
      if (!entry.accountId) {
        throw new Error('Each entry must have accountId');
      }
      totalDebit += entry.debit || 0;
      totalCredit += entry.credit || 0;
    });

    // Validate double-entry principle
    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      throw new Error(`Journal not balanced. Debit: ${totalDebit}, Credit: ${totalCredit}`);
    }

    // Create journal
    const journal = new Journal({
      date: new Date(),
      reference,
      description,
      entries,
      totalDebit,
      totalCredit,
      isBalanced: true,
      source,
      sourceId,
      companyId: companyId || '69dd0cb31c5468a5b63511b7',
      createdBy: 'system'
    });

    const savedJournal = await journal.save();
    console.log(`✅ Journal created: ${reference} (Debit: ${totalDebit}, Credit: ${totalCredit})`);
    
    return savedJournal;
  } catch (error) {
    console.error('❌ Journal creation error:', error.message);
    throw error;
  }
}

module.exports = { createJournalEntry };