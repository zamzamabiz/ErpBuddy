const service = require('./permission.service');

exports.create = async (req, res, next) => {
  try {
    const permission = await service.createPermission(req.body);
    res.status(201).json({ success: true, permission });
  } catch (err) { next(err); }
};

exports.getAll = async (req, res, next) => {
  try {
    const permissions = await service.getPermissions();
    res.json({ success: true, permissions });
  } catch (err) { next(err); }
};

exports.getById = async (req, res, next) => {
  try {
    const permission = await service.getPermissionById(req.params.id);
    if (!permission) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, permission });
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const permission = await service.updatePermission(req.params.id, req.body);
    res.json({ success: true, permission });
  } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
  try {
    await service.deletePermission(req.params.id);
    res.json({ success: true });
  } catch (err) { next(err); }
};