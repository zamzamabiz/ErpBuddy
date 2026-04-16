const BaseRepository = require('@shared/base.repository');
const Document = require('./document.model');

class DocumentRepository extends BaseRepository {
  constructor() {
    super(Document);
  }
  // Add custom repository methods if needed
}

module.exports = new DocumentRepository();
