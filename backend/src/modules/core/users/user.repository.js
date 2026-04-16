const User = require('./user.model');

const create = (data) => User.create(data);
const findAll = () => User.find().populate('role');
const findById = (id) => User.findById(id).populate('role');
const update = (id, data) => User.findByIdAndUpdate(id, data, { new: true }).populate('role');
const remove = (id) => User.findByIdAndDelete(id);

module.exports = { create, findAll, findById, update, remove };