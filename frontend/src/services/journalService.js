import axios from 'axios';

const API_BASE_URL = '/api';

const journalService = {
  // Create draft journal entry
  createJournal: async (data) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/journal`, data, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Update draft journal entry
  updateJournal: async (journalId, data) => {
    try {
      const response = await axios.put(`${API_BASE_URL}/journal/${journalId}`, data, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get journal detail
  getJournal: async (journalId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/journal/${journalId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // List all journals
  listJournals: async (filters = {}) => {
    try {
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
      if (filters.dateTo) params.append('dateTo', filters.dateTo);

      const response = await axios.get(
        `${API_BASE_URL}/journal${params.toString() ? '?' + params.toString() : ''}`,
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
  },

  // Post journal entry
  postJournal: async (journalId) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/journal/${journalId}/post`,
        {},
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
  },

  // Delete draft journal entry
  deleteJournal: async (journalId) => {
    try {
      const response = await axios.delete(`${API_BASE_URL}/journal/${journalId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }
};

export default journalService;
