import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const paymentService = {
  // Create payment or receipt
  createPayment: async (data) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/payments`, data, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get payment detail
  getPayment: async (paymentId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/payments/${paymentId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // List all payments/receipts
  listPayments: async (filters = {}) => {
    try {
      const params = new URLSearchParams();
      if (filters.type) params.append('type', filters.type);
      if (filters.accountId) params.append('accountId', filters.accountId);
      if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
      if (filters.dateTo) params.append('dateTo', filters.dateTo);

      const response = await axios.get(
        `${API_BASE_URL}/payments${params.toString() ? '?' + params.toString() : ''}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }
};

export default paymentService;
