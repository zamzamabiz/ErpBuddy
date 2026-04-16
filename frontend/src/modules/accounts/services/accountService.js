import api from '../../../config/axiosConfig';

const API_BASE = '/accounts';

/**
 * Get hierarchical chart of accounts tree
 * @returns {Promise} Tree structure with parent-child relationships
 */
export const getAccountTree = async () => {
  const response = await api.get(`${API_BASE}/tree`);
  return response.data.data || [];
};

/**
 * Get accounts list with filters
 * @param {Object} params - Query parameters (allowPosting, type, etc.)
 * @returns {Promise} Array of accounts
 */
export const getAccounts = async (params = {}) => {
  const response = await api.get(API_BASE, { params });
  return response.data.data || [];
};

/**
 * Get accounts by type
 * @param {String} type - Account type (asset, liability, equity, income, expense)
 * @returns {Promise} Array of accounts
 */
export const getAccountsByType = async (type) => {
  return getAccounts({ type });
};

/**
 * Get posting-level accounts only (leaf nodes that allow posting)
 * @returns {Promise} Array of posting accounts
 */
export const getPostingAccounts = async () => {
  return getAccounts({ allowPosting: true });
};

/**
 * Get single account by ID
 * @param {String} id - Account ID
 * @returns {Promise} Account object
 */
export const getAccountById = async (id) => {
  const response = await api.get(`${API_BASE}/${id}`);
  return response.data.data || null;
};

export default {
  getAccountTree,
  getAccounts,
  getAccountsByType,
  getPostingAccounts,
  getAccountById
};
