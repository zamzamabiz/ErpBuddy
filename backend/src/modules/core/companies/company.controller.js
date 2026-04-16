const service = require('./company.service');

exports.create = async (req, res, next) => {
  try {
    const company = await service.createCompany(req.body);
    res.status(201).json({ success: true, company });
  } catch (err) { next(err); }
};

exports.getAll = async (req, res, next) => {
  try {
    const companies = await service.getCompanies();
    res.json({ success: true, companies });
  } catch (err) { next(err); }
};

exports.getById = async (req, res, next) => {
  try {
    const company = await service.getCompanyById(req.params.id);
    if (!company) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, company });
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const company = await service.updateCompany(req.params.id, req.body);
    res.json({ success: true, company });
  } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
  try {
    await service.deleteCompany(req.params.id);
    res.json({ success: true });
  } catch (err) { next(err); }
};