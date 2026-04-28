import axios from 'axios';

const API_URL = '/api/items';

// Helper function to get auth headers
const getAuthHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem('token')}`
});

/**
 * Get all items
 * @param {Object} filters - Optional filters (active, itemType, etc)
 * @returns {Promise<Array>} List of items
 */
export const getItems = async (filters = {}) => {
  try {
    const params = new URLSearchParams();
    
    // Only fetch active STOCK items
    params.append('isActive', 'true');
    params.append('itemType', 'STOCK');
    
    const response = await axios.get(`${API_URL}?${params.toString()}`, {
      headers: getAuthHeaders()
    });
    
    // Return the data, handling both array and object responses
    if (Array.isArray(response.data)) {
      return response.data;
    }
    
    // If response is {data: [...]} format
    if (response.data && Array.isArray(response.data.data)) {
      return response.data.data;
    }
    
    return [];
  } catch (error) {
    console.error('Failed to fetch items:', error);
    throw error.response?.data || { message: 'Failed to fetch items' };
  }
};

/**
 * Get a single item by ID
 * @param {string} id - Item ID
 * @returns {Promise<Object>} Item details
 */
export const getItemById = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/${id}`, {
      headers: getAuthHeaders()
    });
    
    // Handle both direct object and {data: {...}} format
    return response.data.data || response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch item' };
  }
};

/**
 * Search items by name or code
 * @param {string} query - Search query
 * @returns {Promise<Array>} Matching items
 */
export const searchItems = async (query) => {
  try {
    const params = new URLSearchParams();
    params.append('search', query);
    params.append('isActive', 'true');
    params.append('itemType', 'STOCK');
    
    const response = await axios.get(`${API_URL}/search?${params.toString()}`, {
      headers: getAuthHeaders()
    });
    
    if (Array.isArray(response.data)) {
      return response.data;
    }
    
    if (response.data && Array.isArray(response.data.data)) {
      return response.data.data;
    }
    
    return [];
  } catch (error) {
    console.error('Failed to search items:', error);
    return [];
  }
};
