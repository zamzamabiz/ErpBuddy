import axios from 'axios';

// ✅ Dynamic Base URL (Works for Local + Production)
const BASE_URL =
  window.location.hostname === 'localhost'
    ? 'http://localhost:8000/api' // Local development
    : '/api'; // Production (via Nginx)

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ✅ REQUEST INTERCEPTOR (Attach Token)
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

// ✅ RESPONSE INTERCEPTOR (Handle Auth Errors)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Unauthorized / Forbidden
      if (error.response.status === 401 || error.response.status === 403) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');

        // Redirect to login
        window.location.href = '/login';
      }
    } else {
      // Network error (like your "Failed to fetch")
      console.error('Network error:', error.message);
    }

    return Promise.reject(error);
  }
);

export default api;