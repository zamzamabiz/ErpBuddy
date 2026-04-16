const BaseService = require('../../../shared/base.service');
const JournalEntryRepository = require('./journalEntry.repository');

class JournalEntryService extends BaseService {
  constructor() {
    super(JournalEntryRepository);
  }

  // Add custom accounting logic as needed
  validateDebitsCredits(lines) {
    const totalDebit = lines.reduce((sum, l) => sum + (l.debit || 0), 0);
    const totalCredit = lines.reduce((sum, l) => sum + (l.credit || 0), 0);
    if (totalDebit !== totalCredit) {
      throw new Error('Total Debit must equal Total Credit.');
    }
    return { totalDebit, totalCredit };
  }
}

module.exports = new JournalEntryService();
