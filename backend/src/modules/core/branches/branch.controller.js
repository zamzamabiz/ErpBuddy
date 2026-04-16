const service = require('./branch.service');

exports.create = async (req, res, next) => {
  try {
    const branch = await service.createBranch(req.body);
    res.status(201).json({ success: true, branch });
  } catch (err) { next(err); }
};

exports.getAll = async (req, res, next) => {
  try {
    const branches = await service.getBranches();
    res.json({ success: true, branches });
  } catch (err) { next(err); }
};

exports.getById = async (req, res, next) => {
  try {
    const branch = await service.getBranchById(req.params.id);
    if (!branch) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, branch });
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const branch = await service.updateBranch(req.params.id, req.body);
    res.json({ success: true, branch });
  } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
  try {
    await service.deleteBranch(req.params.id);
    res.json({ success: true });
  } catch (err) { next(err); }
};