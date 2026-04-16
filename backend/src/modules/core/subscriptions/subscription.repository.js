const Subscription = require('./subscription.model');

const create = (data) => Subscription.create(data);
const findAll = () => Subscription.find({ deletedAt: null });
const findById = (id) => Subscription.findOne({ _id: id, deletedAt: null });
const update = (id, data) => Subscription.findOneAndUpdate({ _id: id, deletedAt: null }, data, { new: true });
const softDelete = (id, userId) => Subscription.findOneAndUpdate({ _id: id, deletedAt: null }, { deletedAt: new Date(), status: 'cancelled', updatedBy: userId }, { new: true });

module.exports = { create, findAll, findById, update, softDelete };