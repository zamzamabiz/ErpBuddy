const Tenant = require('./tenant.model');

const create = (data) => Tenant.create(data);
const findAll = () => Tenant.find();
const findById = (id) => Tenant.findById(id);
const update = (id, data) => Tenant.findByIdAndUpdate(id, data, { new: true });
const remove = (id) => Tenant.findByIdAndDelete(id);

module.exports = { create, findAll, findById, update, remove };