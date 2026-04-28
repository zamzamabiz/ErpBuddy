import axios from 'axios';

const API_BASE_URL = '/api';

/**
 * Create axios instance with proper configuration
 */
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

/**
 * Request interceptor to add auth token
 */
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * Response interceptor to handle auth errors
 */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      if (error.response.status === 401 || error.response.status === 403) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

/**
 * Get financial summary for dashboard
 * Calls /api/dashboard which returns:
 * - financialPosition: { assets, liabilities, equity }
 * - profitAndLoss: { income, expenses, netIncome }
 */
export async function getDashboardSummary() {
  try {
    console.log('📊 Fetching dashboard summary from: /api/dashboard');
    
    const response = await api.get('/dashboard');
    
    console.log('✅ Dashboard summary response:', response.data);
    
    // The API returns { success: true, data: { financialPosition, profitAndLoss, ... } }
    if (response.data && response.data.data) {
      return response.data.data;
    }
    
    return response.data;
  } catch (error) {
    console.error('❌ Dashboard summary error:', error);
    
    // Provide more detailed error message
    let errorMsg = 'Failed to load dashboard data';
    if (error.response) {
      errorMsg = error.response.data?.message || error.response.data?.error || `HTTP ${error.response.status}`;
    } else if (error.request) {
      errorMsg = 'Network error - please check your connection';
    } else {
      errorMsg = error.message || errorMsg;
    }
    
    throw new Error(errorMsg);
  }
}

/**
 * Get dashboard stats (legacy function for backwards compatibility)
 * @deprecated Use getDashboardSummary instead
 */
export async function getDashboardStats() {
  return getDashboardSummary();
}
