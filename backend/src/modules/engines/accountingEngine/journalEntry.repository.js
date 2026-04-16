const BaseRepository = require('../../../shared/base.repository');
const JournalEntry = require('./journalEntry.model');

class JournalEntryRepository extends BaseRepository {
  constructor() {
    super(JournalEntry);
  }
  // Add custom repository methods if needed
}

module.exports = new JournalEntryRepository();
