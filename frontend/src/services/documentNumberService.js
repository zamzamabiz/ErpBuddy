import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

/**
 * Generate next document number for a module
 * @param {string} module - Module name (sales, purchase, journal, payment, receipt, inventory, payroll)
 * @returns {Promise} { documentNumber, sequence }
 */
export async function generateDocumentNumber(module) {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.post(
      `${API_BASE_URL}/document-number/generate`,
      { module },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to generate document number');
    }

    return response.data.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || error.message || 'Failed to generate document number');
  }
}

/**
 * Get list of supported modules and their prefixes
 * @returns {Promise} { sales: "INV", purchase: "PO", ... }
 */
export async function getModules() {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.get(
      `${API_BASE_URL}/document-number/modules`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to get modules');
    }

    return response.data.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || error.message || 'Failed to get modules');
  }
}
