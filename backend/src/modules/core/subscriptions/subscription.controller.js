const service = require('./subscription.service');

exports.create = async (req, res, next) => {
  try {
    const subscription = await service.createSubscription({ ...req.body, createdBy: req.user._id });
    res.status(201).json({ success: true, subscription });
  } catch (err) { next(err); }
};

exports.getAll = async (req, res, next) => {
  try {
    const subscriptions = await service.getSubscriptions();
    res.json({ success: true, subscriptions });
  } catch (err) { next(err); }
};

exports.getById = async (req, res, next) => {
  try {
    const subscription = await service.getSubscriptionById(req.params.id);
    if (!subscription) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, subscription });
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const subscription = await service.updateSubscription(req.params.id, { ...req.body, updatedBy: req.user._id });
    res.json({ success: true, subscription });
  } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
  try {
    await service.deleteSubscription(req.params.id, req.user._id);
    res.json({ success: true });
  } catch (err) { next(err); }
};