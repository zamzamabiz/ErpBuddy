const asyncHandler = require('@utils/asyncHandler');
const SuppliersService = require('./suppliers.service');

module.exports = {
  create: asyncHandler(async (req, res) => {
    const companyId = req.user.companyId;
    const createdBy = req.user.userId;
    const data = { ...req.body, companyId };
    const result = await SuppliersService.createSupplier(data, createdBy);
    res.json(result);
  }),
  list: asyncHandler(async (req, res) => {
    const companyId = req.user.companyId;
    const result = await SuppliersService.getSuppliers(companyId);
    res.json(result);
  }),
  get: asyncHandler(async (req, res) => {
    const companyId = req.user.companyId;
    const { id } = req.params;
    const result = await SuppliersService.getSupplierById(companyId, id);
    res.json(result);
  }),
  update: asyncHandler(async (req, res) => {
    const companyId = req.user.companyId;
    const updatedBy = req.user.userId;
    const { id } = req.params;
    const result = await SuppliersService.updateSupplier(companyId, id, req.body, updatedBy);
    res.json(result);
  }),
  delete: asyncHandler(async (req, res) => {
    const companyId = req.user.companyId;
    const deletedBy = req.user.userId;
    const { id } = req.params;
    const result = await SuppliersService.deleteSupplier(companyId, id, deletedBy);
    res.json(result);
  })
};
