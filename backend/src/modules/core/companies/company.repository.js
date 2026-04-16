const Company = require('./company.model');

const create = (data) => Company.create(data);
const findAll = () => Company.find();
const findById = (id) => Company.findById(id);
const update = (id, data) => Company.findByIdAndUpdate(id, data, { new: true });
const remove = (id) => Company.findByIdAndDelete(id);

module.exports = { create, findAll, findById, update, remove };