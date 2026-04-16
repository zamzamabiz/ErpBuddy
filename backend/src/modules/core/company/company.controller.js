const asyncHandler = require('@utils/asyncHandler');
const CompanyService = require('./company.service');

module.exports = {
  create: asyncHandler(async (req, res) => {
    const result = await CompanyService.createCompany(req.body);
    res.json(result);
  }),
  list: asyncHandler(async (req, res) => {
    const companyId = req.user.companyId;
    const result = await CompanyService.getCompanies(companyId);
    res.json(result);
  }),
  get: asyncHandler(async (req, res) => {
    const companyId = req.user.companyId;
    const { id } = req.params;
    const result = await CompanyService.getCompanyById(companyId, id);
    res.json(result);
  }),
  update: asyncHandler(async (req, res) => {
    const companyId = req.user.companyId;
    const { id } = req.params;
    const result = await CompanyService.updateCompany(companyId, id, req.body);
    res.json(result);
  }),
  delete: asyncHandler(async (req, res) => {
    const companyId = req.user.companyId;
    const { id } = req.params;
    const result = await CompanyService.deleteCompany(companyId, id);
    res.json(result);
  })
};
