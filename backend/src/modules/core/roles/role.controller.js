const service = require('./role.service');

exports.create = async (req, res, next) => {
  try {
    const role = await service.createRole(req.body);
    res.status(201).json({ success: true, role });
  } catch (err) { next(err); }
};

exports.getAll = async (req, res, next) => {
  try {
    const roles = await service.getRoles();
    res.json({ success: true, roles });
  } catch (err) { next(err); }
};

exports.getById = async (req, res, next) => {
  try {
    const role = await service.getRoleById(req.params.id);
    if (!role) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, role });
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const role = await service.updateRole(req.params.id, req.body);
    res.json({ success: true, role });
  } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
  try {
    await service.deleteRole(req.params.id);
    res.json({ success: true });
  } catch (err) { next(err); }
};