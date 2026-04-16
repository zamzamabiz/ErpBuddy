const BaseService = require('@shared/base.service');
const documentRepository = require('./document.repository');
const documentNumberService = require('@services/documentNumber.service');

class DocumentService extends BaseService {
  constructor() {
    super(documentRepository);
  }
  async create(data) {
    // Generate document number using Number Series Engine
    if (!data.documentNumber && data.company && data.documentType) {
      data.documentNumber = await documentNumberService.generateDocumentNumber(data.company, data.documentType);
    }
    return super.create(data);
  }
  // Add custom service methods if needed
}

module.exports = new DocumentService();
