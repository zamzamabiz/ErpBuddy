const repository = require('./company.repository');

const createCompany = (data) => repository.create(data);
const getCompanies = () => repository.findAll();
const getCompanyById = (id) => repository.findById(id);
const updateCompany = (id, data) => repository.update(id, data);
const deleteCompany = (id) => repository.remove(id);

module.exports = { createCompany, getCompanies, getCompanyById, updateCompany, deleteCompany };