const repository = require('./branch.repository');

const createBranch = (data) => repository.create(data);
const getBranches = () => repository.findAll();
const getBranchById = (id) => repository.findById(id);
const updateBranch = (id, data) => repository.update(id, data);
const deleteBranch = (id) => repository.remove(id);

module.exports = { createBranch, getBranches, getBranchById, updateBranch, deleteBranch };