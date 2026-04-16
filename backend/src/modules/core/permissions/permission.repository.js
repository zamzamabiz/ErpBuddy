const Permission = require('./permission.model');

const create = (data) => Permission.create(data);
const findAll = () => Permission.find();
const findById = (id) => Permission.findById(id);
const update = (id, data) => Permission.findByIdAndUpdate(id, data, { new: true });
const remove = (id) => Permission.findByIdAndDelete(id);

module.exports = { create, findAll, findById, update, remove };