const repository = require('./role.repository');

const createRole = (data) => repository.create(data);
const getRoles = () => repository.findAll();
const getRoleById = (id) => repository.findById(id);
const updateRole = (id, data) => repository.update(id, data);
const deleteRole = (id) => repository.remove(id);

module.exports = { createRole, getRoles, getRoleById, updateRole, deleteRole };