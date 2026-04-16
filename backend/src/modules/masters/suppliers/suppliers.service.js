const BaseService = require('@shared/base.service');
const SuppliersRepository = require('./suppliers.repository');
const apiResponse = require('@utils/apiResponse');
const auditLogService = require('@services/auditLog.service');
const documentNumberService = require('@services/documentNumber.service');

class SuppliersService extends BaseService {
  constructor() {
    super(SuppliersRepository);
  }

  async createSupplier(data, createdBy) {
    // Generate supplier code using centralized engine
    data.supplierCode = await documentNumberService.generate('suppliers', data.companyId);
    data.createdBy = createdBy;
    const supplier = await SuppliersRepository.create(data);
    await auditLogService.log({ action: 'CREATE_SUPPLIER', userId: createdBy, entity: 'Supplier', entityId: supplier._id });
    return apiResponse({ success: true, message: 'Supplier created', data: supplier });
  }

  async updateSupplier(companyId, id, data, updatedBy) {
    data.updatedBy = updatedBy;
    const supplier = await SuppliersRepository.update(id, companyId, data);
    if (!supplier) throw new Error('Supplier not found or update failed');
    await auditLogService.log({ action: 'UPDATE_SUPPLIER', userId: updatedBy, entity: 'Supplier', entityId: id });
    return apiResponse({ success: true, message: 'Supplier updated', data: supplier });
  }

  async getSuppliers(companyId, filter = {}) {
    const suppliers = await SuppliersRepository.findAll(companyId, filter);
    return apiResponse({ success: true, data: suppliers });
  }

  async getSupplierById(companyId, id) {
    const supplier = await SuppliersRepository.findById(id, companyId);
    if (!supplier) throw new Error('Supplier not found');
    return apiResponse({ success: true, data: supplier });
  }

  async deleteSupplier(companyId, id, deletedBy) {
    const supplier = await SuppliersRepository.softDelete(id, companyId);
    if (!supplier) throw new Error('Supplier not found or delete failed');
    await auditLogService.log({ action: 'DELETE_SUPPLIER', userId: deletedBy, entity: 'Supplier', entityId: id });
    return apiResponse({ success: true, message: 'Supplier deleted', data: supplier });
  }
}

module.exports = new SuppliersService();
