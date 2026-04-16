const Branch = require('./branch.model');

const create = (data) => Branch.create(data);
const findAll = () => Branch.find();
const findById = (id) => Branch.findById(id);
const update = (id, data) => Branch.findByIdAndUpdate(id, data, { new: true });
const remove = (id) => Branch.findByIdAndDelete(id);

module.exports = { create, findAll, findById, update, remove };