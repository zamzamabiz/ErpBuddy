const service = require('./tenant.service');

exports.create = async (req, res, next) => {
  try {
    const tenant = await service.createTenant(req.body);
    res.status(201).json({ success: true, tenant });
  } catch (err) { next(err); }
};

exports.getAll = async (req, res, next) => {
  try {
    const tenants = await service.getTenants();
    res.json({ success: true, tenants });
  } catch (err) { next(err); }
};

exports.getById = async (req, res, next) => {
  try {
    const tenant = await service.getTenantById(req.params.id);
    if (!tenant) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, tenant });
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const tenant = await service.updateTenant(req.params.id, req.body);
    res.json({ success: true, tenant });
  } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
  try {
    await service.deleteTenant(req.params.id);
    res.json({ success: true });
  } catch (err) { next(err); }
};