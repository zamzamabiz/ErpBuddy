const repository = require('./permission.repository');

const createPermission = (data) => repository.create(data);
const getPermissions = () => repository.findAll();
const getPermissionById = (id) => repository.findById(id);
const updatePermission = (id, data) => repository.update(id, data);
const deletePermission = (id) => repository.remove(id);

module.exports = { createPermission, getPermissions, getPermissionById, updatePermission, deletePermission };