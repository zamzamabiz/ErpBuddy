const service = require('./user.service');

exports.create = async (req, res, next) => {
  try {
    const user = await service.createUser(req.body);
    res.status(201).json({ success: true, user });
  } catch (err) { next(err); }
};

exports.getAll = async (req, res, next) => {
  try {
    const users = await service.getUsers();
    res.json({ success: true, users });
  } catch (err) { next(err); }
};

exports.getById = async (req, res, next) => {
  try {
    const user = await service.getUserById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, user });
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const user = await service.updateUser(req.params.id, req.body);
    res.json({ success: true, user });
  } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
  try {
    await service.deleteUser(req.params.id);
    res.json({ success: true });
  } catch (err) { next(err); }
};