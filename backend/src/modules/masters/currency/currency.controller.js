const asyncHandler = require('@utils/asyncHandler');
const currencyService = require('./currency.service');

module.exports = {
  create: asyncHandler(async (req, res) => {
    const companyId = req.user.companyId;
    const createdBy = req.user.userId;
    const data = { ...req.body, company: companyId, createdBy };
    const result = await currencyService.create(data);
    res.json(result);
  }),
  list: asyncHandler(async (req, res) => {
    const companyId = req.user.companyId;
    const result = await currencyService.find({ company: companyId });
    res.json(result);
  }),
  get: asyncHandler(async (req, res) => {
    const companyId = req.user.companyId;
    const { id } = req.params;
    const result = await currencyService.findOne({ company: companyId, _id: id });
    res.json(result);
  }),
  update: asyncHandler(async (req, res) => {
    const companyId = req.user.companyId;
    const updatedBy = req.user.userId;
    const { id } = req.params;
    const data = { ...req.body, updatedBy };
    const result = await currencyService.update({ company: companyId, _id: id }, data);
    res.json(result);
  }),
  delete: asyncHandler(async (req, res) => {
    const companyId = req.user.companyId;
    const { id } = req.params;
    const result = await currencyService.delete({ company: companyId, _id: id });
    res.json(result);
  })
};
