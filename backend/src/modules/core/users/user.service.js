const repository = require('./user.repository');
const bcrypt = require('bcryptjs');

const createUser = async (data) => {
  if (data.password) {
    data.password = await bcrypt.hash(data.password, 10);
  }
  return repository.create(data);
};
const getUsers = () => repository.findAll();
const getUserById = (id) => repository.findById(id);
const updateUser = async (id, data) => {
  if (data.password) {
    data.password = await bcrypt.hash(data.password, 10);
  }
  return repository.update(id, data);
};
const deleteUser = (id) => repository.remove(id);

module.exports = { createUser, getUsers, getUserById, updateUser, deleteUser };