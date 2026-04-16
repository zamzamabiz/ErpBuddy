import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

/**
 * Create new account
 * @param {Object} data - {code, name, type, parentId, description}
 * @returns {Promise} Created account
 */
export async function createAccount(data) {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.post(
      `${API_BASE_URL}/accounts`,
      data,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to create account');
    }

    return response.data.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || error.message || 'Failed to create account');
  }
}

/**
 * Get all accounts as tree
 * @returns {Promise} Tree structure
 */
export async function getAccounts() {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.get(
      `${API_BASE_URL}/accounts`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to get accounts');
    }

    return response.data.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || error.message || 'Failed to get accounts');
  }
}

/**
 * Get account by ID
 * @param {string} accountId - Account ID
 * @returns {Promise} Account with path
 */
export async function getAccount(accountId) {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.get(
      `${API_BASE_URL}/accounts/${accountId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to get account');
    }

    return response.data.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || error.message || 'Failed to get account');
  }
}

/**
 * Update account
 * @param {string} accountId - Account ID
 * @param {Object} data - Update data
 * @returns {Promise} Updated account
 */
export async function updateAccount(accountId, data) {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.put(
      `${API_BASE_URL}/accounts/${accountId}`,
      data,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to update account');
    }

    return response.data.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || error.message || 'Failed to update account');
  }
}

/**
 * Deactivate account
 * @param {string} accountId - Account ID
 * @returns {Promise} Deactivated account
 */
export async function deactivateAccount(accountId) {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.delete(
      `${API_BASE_URL}/accounts/${accountId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to deactivate account');
    }

    return response.data.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || error.message || 'Failed to deactivate account');
  }
}

/**
 * Get account types
 * @returns {Promise} List of account types
 */
export async function getAccountTypes() {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.get(
      `${API_BASE_URL}/accounts/types/list`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to get account types');
    }

    return response.data.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || error.message || 'Failed to get account types');
  }
}


