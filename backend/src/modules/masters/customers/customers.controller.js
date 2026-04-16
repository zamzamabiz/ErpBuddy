const asyncHandler = require('@utils/asyncHandler');
const CustomersService = require('./customers.service');

module.exports = {
  create: asyncHandler(async (req, res) => {
    const companyId = req.user.companyId;
    const createdBy = req.user.userId;
    const data = { ...req.body, companyId };
    const result = await CustomersService.createCustomer(data, createdBy);
    res.json(result);
  }),
  list: asyncHandler(async (req, res) => {
    const companyId = req.user.companyId;
    const result = await CustomersService.getCustomers(companyId);
    res.json(result);
  }),
  get: asyncHandler(async (req, res) => {
    const companyId = req.user.companyId;
    const { id } = req.params;
    const result = await CustomersService.getCustomerById(companyId, id);
    res.json(result);
  }),
  update: asyncHandler(async (req, res) => {
    const companyId = req.user.companyId;
    const updatedBy = req.user.userId;
    const { id } = req.params;
    const result = await CustomersService.updateCustomer(companyId, id, req.body, updatedBy);
    res.json(result);
  }),
  delete: asyncHandler(async (req, res) => {
    const companyId = req.user.companyId;
    const deletedBy = req.user.userId;
    const { id } = req.params;
    const result = await CustomersService.deleteCustomer(companyId, id, deletedBy);
    res.json(result);
  })
};
