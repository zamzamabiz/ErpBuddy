import axios from 'axios';

const API_URL = '/api/sales';

// Helper function to get auth headers
const getAuthHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem('token')}`
});

/**
 * Create a new sales invoice
 * @param {Object} data - Sales data { customer, warehouse, items }
 * @returns {Promise<Object>} Created sales with ID
 */
export const createSale = async (data) => {
  try {
    const response = await axios.post(API_URL, data, {
      headers: getAuthHeaders()
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to create sales invoice' };
  }
};

/**
 * Get all sales invoices
 * @returns {Promise<Array>} List of sales
 */
export const getSales = async () => {
  try {
    const response = await axios.get(API_URL, {
      headers: getAuthHeaders()
    });
    
    // Handle different response formats
    if (Array.isArray(response.data)) {
      return response.data;
    }
    
    if (response.data && Array.isArray(response.data.data)) {
      return response.data.data;
    }
    
    return [];
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch sales' };
  }
};

/**
 * Get a single sales invoice by ID
 * @param {string} id - Sales ID
 * @returns {Promise<Object>} Sales details
 */
export const getSaleById = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/${id}`, {
      headers: getAuthHeaders()
    });
    
    // Handle both direct object and {data: {...}} format
    return response.data.data || response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch sales' };
  }
};

/**
 * Post (finalize) a sales invoice
 * @param {string} id - Sales ID
 * @returns {Promise<Object>} Posted sales
 */
export const postSale = async (id) => {
  try {
    const response = await axios.post(`${API_URL}/${id}/post`, {}, {
      headers: getAuthHeaders()
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to post sales invoice' };
  }
};

/**
 * Update a sales invoice
 * @param {string} id - Sales ID
 * @param {Object} data - Updated data
 * @returns {Promise<Object>} Updated sales
 */
export const updateSale = async (id, data) => {
  try {
    const response = await axios.put(`${API_URL}/${id}`, data, {
      headers: getAuthHeaders()
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to update sales' };
  }
};

/**
 * Delete a sales invoice (only if not posted)
 * @param {string} id - Sales ID
 * @returns {Promise<Object>} Deletion response
 */
export const deleteSale = async (id) => {
  try {
    const response = await axios.delete(`${API_URL}/${id}`, {
      headers: getAuthHeaders()
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to delete sales' };
  }
};
