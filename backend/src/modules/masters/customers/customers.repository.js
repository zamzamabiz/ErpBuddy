const BaseRepository = require('@shared/base.repository');
const Customer = require('./customers.model');

class CustomersRepository extends BaseRepository {
  constructor() {
    super(Customer);
  }

  async findByCustomerCode(companyId, customerCode) {
    return this.model.findOne({ companyId, customerCode, isDeleted: false });
  }
}

module.exports = new CustomersRepository();
