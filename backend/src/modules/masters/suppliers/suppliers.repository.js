const BaseRepository = require('@shared/base.repository');
const Supplier = require('./suppliers.model');

class SuppliersRepository extends BaseRepository {
  constructor() {
    super(Supplier);
  }

  async findBySupplierCode(companyId, supplierCode) {
    return this.model.findOne({ companyId, supplierCode, isDeleted: false });
  }
}

module.exports = new SuppliersRepository();
