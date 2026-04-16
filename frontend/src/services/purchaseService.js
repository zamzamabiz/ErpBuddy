import axios from 'axios';

const API_URL = 'http://localhost:5000/api/purchases';

// Helper function to get auth headers
const getAuthHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem('token')}`
});

/**
 * Create a new purchase
 * @param {Object} data - Purchase data { supplier, warehouse, items }
 * @returns {Promise<Object>} Created purchase with ID
 */
export const createPurchase = async (data) => {
  try {
    const response = await axios.post(API_URL, data, {
      headers: getAuthHeaders()
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to create purchase' };
  }
};

/**
 * Get all purchases
 * @returns {Promise<Array>} List of purchases
 */
export const getPurchases = async () => {
  try {
    const response = await axios.get(API_URL, {
      headers: getAuthHeaders()
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch purchases' };
  }
};

/**
 * Get a single purchase by ID
 * @param {string} id - Purchase ID
 * @returns {Promise<Object>} Purchase details
 */
export const getPurchaseById = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/${id}`, {
      headers: getAuthHeaders()
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch purchase' };
  }
};

/**
 * Post (finalize) a purchase
 * @param {string} id - Purchase ID
 * @returns {Promise<Object>} Posted purchase
 */
export const postPurchase = async (id) => {
  try {
    const response = await axios.post(`${API_URL}/${id}/post`, {}, {
      headers: getAuthHeaders()
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to post purchase' };
  }
};

/**
 * Update a purchase
 * @param {string} id - Purchase ID
 * @param {Object} data - Updated data
 * @returns {Promise<Object>} Updated purchase
 */
export const updatePurchase = async (id, data) => {
  try {
    const response = await axios.put(`${API_URL}/${id}`, data, {
      headers: getAuthHeaders()
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to update purchase' };
  }
};

/**
 * Delete a purchase (only if not posted)
 * @param {string} id - Purchase ID
 * @returns {Promise<Object>} Deletion response
 */
export const deletePurchase = async (id) => {
  try {
    const response = await axios.delete(`${API_URL}/${id}`, {
      headers: getAuthHeaders()
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to delete purchase' };
  }
};
