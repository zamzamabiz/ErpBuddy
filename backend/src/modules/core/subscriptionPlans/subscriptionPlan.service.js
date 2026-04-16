const repository = require('./subscriptionPlan.repository');

const createPlan = (data) => repository.create(data);
const getPlans = () => repository.findAll();
const getPlanById = (id) => repository.findById(id);
const updatePlan = (id, data) => repository.update(id, data);
const deletePlan = (id, userId) => repository.softDelete(id, userId);

module.exports = { createPlan, getPlans, getPlanById, updatePlan, deletePlan };