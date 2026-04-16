const asyncHandler = require('@utils/asyncHandler');
const chartOfAccountsService = require('./chartOfAccounts.service');

module.exports = {
  create: asyncHandler(async (req, res) => {
    const companyId = req.user.companyId;
    const createdBy = req.user.userId;
    const data = { ...req.body, company: companyId, createdBy };
    const result = await chartOfAccountsService.create(data);
    res.json(result);
  }),
  list: asyncHandler(async (req, res) => {
    const companyId = req.user.companyId;
    const result = await chartOfAccountsService.find({ company: companyId });
    res.json(result);
  }),
  get: asyncHandler(async (req, res) => {
    const companyId = req.user.companyId;
    const { id } = req.params;
    const result = await chartOfAccountsService.findOne({ company: companyId, _id: id });
    res.json(result);
  }),
  update: asyncHandler(async (req, res) => {
    const companyId = req.user.companyId;
    const updatedBy = req.user.userId;
    const { id } = req.params;
    const data = { ...req.body, updatedBy };
    const result = await chartOfAccountsService.update({ company: companyId, _id: id }, data);
    res.json(result);
  }),
  delete: asyncHandler(async (req, res) => {
    const companyId = req.user.companyId;
    const { id } = req.params;
    const result = await chartOfAccountsService.delete({ company: companyId, _id: id });
    res.json(result);
  })
};
