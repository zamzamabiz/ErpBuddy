const SubscriptionPlan = require('./subscriptionPlan.model');

const create = (data) => SubscriptionPlan.create(data);
const findAll = () => SubscriptionPlan.find({ deletedAt: null });
const findById = (id) => SubscriptionPlan.findOne({ _id: id, deletedAt: null });
const update = (id, data) => SubscriptionPlan.findOneAndUpdate({ _id: id, deletedAt: null }, data, { new: true });
const softDelete = (id, userId) => SubscriptionPlan.findOneAndUpdate({ _id: id, deletedAt: null }, { deletedAt: new Date(), isActive: false, updatedBy: userId }, { new: true });

module.exports = { create, findAll, findById, update, softDelete };