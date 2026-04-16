const asyncHandler = require('@utils/asyncHandler');
const unitService = require('./unit.service');

module.exports = {
  create: asyncHandler(async (req, res) => {
    const companyId = req.user.companyId;
    const createdBy = req.user.userId;
    const data = { ...req.body, company: companyId, createdBy };
    const result = await unitService.create(data);
    res.json(result);
  }),
  list: asyncHandler(async (req, res) => {
    const companyId = req.user.companyId;
    const result = await unitService.find({ company: companyId });
    res.json(result);
  }),
  get: asyncHandler(async (req, res) => {
    const companyId = req.user.companyId;
    const { id } = req.params;
    const result = await unitService.findOne({ company: companyId, _id: id });
    res.json(result);
  }),
  update: asyncHandler(async (req, res) => {
    const companyId = req.user.companyId;
    const updatedBy = req.user.userId;
    const { id } = req.params;
    const data = { ...req.body, updatedBy };
    const result = await unitService.update({ company: companyId, _id: id }, data);
    res.json(result);
  }),
  delete: asyncHandler(async (req, res) => {
    const companyId = req.user.companyId;
    const { id } = req.params;
    const result = await unitService.delete({ company: companyId, _id: id });
    res.json(result);
  })
};
