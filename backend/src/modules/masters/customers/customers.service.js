const BaseService = require('@shared/base.service');
const CustomersRepository = require('./customers.repository');
const apiResponse = require('@utils/apiResponse');
const auditLogService = require('@services/auditLog.service');
const documentNumberService = require('@services/documentNumber.service');

class CustomersService extends BaseService {
  constructor() {
    super(CustomersRepository);
  }

  async createCustomer(data, createdBy) {
    // Generate customer code using centralized engine
    data.customerCode = await documentNumberService.generate('customers', data.companyId);
    data.createdBy = createdBy;
    const customer = await CustomersRepository.create(data);
    await auditLogService.log({ action: 'CREATE_CUSTOMER', userId: createdBy, entity: 'Customer', entityId: customer._id });
    return apiResponse({ success: true, message: 'Customer created', data: customer });
  }

  async updateCustomer(companyId, id, data, updatedBy) {
    data.updatedBy = updatedBy;
    const customer = await CustomersRepository.update(id, companyId, data);
    if (!customer) throw new Error('Customer not found or update failed');
    await auditLogService.log({ action: 'UPDATE_CUSTOMER', userId: updatedBy, entity: 'Customer', entityId: id });
    return apiResponse({ success: true, message: 'Customer updated', data: customer });
  }

  async getCustomers(companyId, filter = {}) {
    const customers = await CustomersRepository.findAll(companyId, filter);
    return apiResponse({ success: true, data: customers });
  }

  async getCustomerById(companyId, id) {
    const customer = await CustomersRepository.findById(id, companyId);
    if (!customer) throw new Error('Customer not found');
    return apiResponse({ success: true, data: customer });
  }

  async deleteCustomer(companyId, id, deletedBy) {
    const customer = await CustomersRepository.softDelete(id, companyId);
    if (!customer) throw new Error('Customer not found or delete failed');
    await auditLogService.log({ action: 'DELETE_CUSTOMER', userId: deletedBy, entity: 'Customer', entityId: id });
    return apiResponse({ success: true, message: 'Customer deleted', data: customer });
  }
}

module.exports = new CustomersService();
