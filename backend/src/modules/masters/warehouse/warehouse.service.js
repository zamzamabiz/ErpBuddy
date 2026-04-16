const BaseService = require('@shared/base.service');
const WarehouseRepository = require('./warehouse.repository');
const documentNumberService = require('@services/documentNumber.service');
const apiResponse = require('@utils/apiResponse');
const auditLogService = require('@services/auditLog.service');

class WarehouseService extends BaseService {
  constructor() {
    super(WarehouseRepository);
  }

  async createWarehouse(data, createdBy) {
    data.warehouseCode = await documentNumberService.generate('warehouse', data.companyId);
    data.createdBy = createdBy;
    const warehouse = await WarehouseRepository.create(data);
    await auditLogService.log({ action: 'CREATE_WAREHOUSE', userId: createdBy, entity: 'Warehouse', entityId: warehouse._id });
    return apiResponse({ success: true, message: 'Warehouse created', data: warehouse });
  }

  async updateWarehouse(companyId, id, data, updatedBy) {
    data.updatedBy = updatedBy;
    const warehouse = await WarehouseRepository.update(id, companyId, data);
    if (!warehouse) throw new Error('Warehouse not found or update failed');
    await auditLogService.log({ action: 'UPDATE_WAREHOUSE', userId: updatedBy, entity: 'Warehouse', entityId: id });
    return apiResponse({ success: true, message: 'Warehouse updated', data: warehouse });
  }

  async getWarehouses(companyId, filter = {}) {
    const warehouses = await WarehouseRepository.findAll(companyId, filter);
    return apiResponse({ success: true, data: warehouses });
  }

  async getWarehouseById(companyId, id) {
    const warehouse = await WarehouseRepository.findById(id, companyId);
    if (!warehouse) throw new Error('Warehouse not found');
    return apiResponse({ success: true, data: warehouse });
  }

  async deleteWarehouse(companyId, id, deletedBy) {
    const warehouse = await WarehouseRepository.softDelete(id, companyId);
    if (!warehouse) throw new Error('Warehouse not found or delete failed');
    await auditLogService.log({ action: 'DELETE_WAREHOUSE', userId: deletedBy, entity: 'Warehouse', entityId: id });
    return apiResponse({ success: true, message: 'Warehouse deleted', data: warehouse });
  }
}

module.exports = new WarehouseService();
