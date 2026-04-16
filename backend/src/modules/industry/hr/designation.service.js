const BaseService = require('../../../shared/base.service');
const DesignationRepository = require('./designation.repository');

class DesignationService extends BaseService {
  constructor() {
    super(DesignationRepository);
  }
}

module.exports = new DesignationService();
