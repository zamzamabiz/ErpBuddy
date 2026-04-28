const repository = require('./user.repository');
const bcrypt = require('bcryptjs');

/**
 * Create a new user with tenant validation
 * @param {Object} data - User data including tenantId
 * @returns {Promise<Object>} Created user
 */
const createUser = async (data) => {
  // Validate required fields
  const { name, email, password, tenantId } = data;
  
  if (!name || !email || !password) {
    throw new Error('Name, email, and password are required');
  }
  
  if (!tenantId) {
    throw new Error('Tenant ID is required for user creation');
  }
  
  // Hash password before saving
  if (password) {
    data.password = await bcrypt.hash(data.password, 10);
  }
  
  return repository.create(data);
};

const getUsers = (filters = {}) => {
  // Ensure tenant isolation - if no tenantId filter provided, require one from auth
  return repository.findAll(filters);
};

const getUserById = async (id, tenantId = null) => {
  // If tenantId is provided, ensure user belongs to that tenant
  const filters = tenantId ? { _id: id, tenantId } : { _id: id };
  return repository.findById(filters);
};

/**
 * Get users by tenant
 * @param {string} tenantId - Tenant ID
 * @returns {Promise<Array>} Users in tenant
 */
const getUsersByTenant = async (tenantId) => {
  if (!tenantId) {
    throw new Error('Tenant ID is required');
  }
  return repository.findAll({ tenantId });
};

const updateUser = async (id, data, tenantId = null) => {
  // If tenantId is provided, ensure user belongs to that tenant
  const filters = tenantId ? { _id: id, tenantId } : { _id: id };
  
  // Hash password if being updated
  if (data.password) {
    data.password = await bcrypt.hash(data.password, 10);
  }
  
  return repository.update(filters, data);
};

const deleteUser = (id) => repository.remove(id);

module.exports = { 
  createUser, 
  getUsers, 
  getUserById, 
  getUsersByTenant,
  updateUser, 
  deleteUser 
};