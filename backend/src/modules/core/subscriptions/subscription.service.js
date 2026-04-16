const repository = require('./subscription.repository');

const createSubscription = (data) => repository.create(data);
const getSubscriptions = () => repository.findAll();
const getSubscriptionById = (id) => repository.findById(id);
const updateSubscription = (id, data) => repository.update(id, data);
const deleteSubscription = (id, userId) => repository.softDelete(id, userId);

module.exports = { createSubscription, getSubscriptions, getSubscriptionById, updateSubscription, deleteSubscription };