import axios from 'axios';

const API_URL = 'http://localhost:5000/api/warehouses';

// Helper function to get auth headers  
const getAuthHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem('token')}`
});

/**
 * Get all warehouses
 * @returns {Promise<Array>} List of warehouses
 */
export const getWarehouses = async () => {
  try {
    const response = await axios.get(API_URL, {
      headers: getAuthHeaders()
    });
    
    // Handle different response formats
    if (Array.isArray(response.data)) {
      return response.data;
    }
    
    // If response is {data: [...]} format
    if (response.data && Array.isArray(response.data.data)) {
      return response.data.data;
    }
    
    // If response is {success: true, data: [...]} format
    if (response.data && Array.isArray(response.data)) {
      return response.data;
    }
    
    return [];
  } catch (error) {
    console.error('Failed to fetch warehouses:', error);
    throw error.response?.data || { message: 'Failed to fetch warehouses' };
  }
};

/**
 * Get a single warehouse by ID
 * @param {string} id - Warehouse ID
 * @returns {Promise<Object>} Warehouse details
 */
export const getWarehouseById = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/${id}`, {
      headers: getAuthHeaders()
    });
    
    // Handle both direct object and {data: {...}} format
    return response.data.data || response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch warehouse' };
  }
};

/**
 * Get active warehouses only
 * @returns {Promise<Array>} List of active warehouses
 */
export const getActiveWarehouses = async () => {
  try {
    const response = await axios.get(`${API_URL}?isActive=true`, {
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
    console.error('Failed to fetch active warehouses:', error);
    throw error.response?.data || { message: 'Failed to fetch warehouses' };
  }
};
