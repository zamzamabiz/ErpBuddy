const BaseRepository = require('@shared/base.repository');
const Company = require('./company.model');

class CompanyRepository extends BaseRepository {
  constructor() {
    super(Company);
  }

  // Additional company-specific queries can be added here
}

module.exports = new CompanyRepository();
