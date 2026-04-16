const Role = require('./role.model');

const create = (data) => Role.create(data);
const findAll = () => Role.find().populate('permissions');
const findById = (id) => Role.findById(id).populate('permissions');
const update = (id, data) => Role.findByIdAndUpdate(id, data, { new: true }).populate('permissions');
const remove = (id) => Role.findByIdAndDelete(id);

module.exports = { create, findAll, findById, update, remove };