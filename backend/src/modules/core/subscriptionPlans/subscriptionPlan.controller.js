const service = require('./subscriptionPlan.service');

exports.create = async (req, res, next) => {
  try {
    const plan = await service.createPlan({ ...req.body, createdBy: req.user._id });
    res.status(201).json({ success: true, plan });
  } catch (err) { next(err); }
};

exports.getAll = async (req, res, next) => {
  try {
    const plans = await service.getPlans();
    res.json({ success: true, plans });
  } catch (err) { next(err); }
};

exports.getById = async (req, res, next) => {
  try {
    const plan = await service.getPlanById(req.params.id);
    if (!plan) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, plan });
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const plan = await service.updatePlan(req.params.id, { ...req.body, updatedBy: req.user._id });
    res.json({ success: true, plan });
  } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
  try {
    await service.deletePlan(req.params.id, req.user._id);
    res.json({ success: true });
  } catch (err) { next(err); }
};