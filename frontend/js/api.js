/**
 * Central API Handler for ERP Buddy
 * Handles authentication, error handling, and common fetch operations
 */

const API_BASE = '/api';

// Get authentication token - check both 'token' and 'auth_token' for compatibility
function getToken() {
  return localStorage.getItem('token') || localStorage.getItem('auth_token') || 'dev-token';
}

// Get tenant ID
function getTenantId() {
  return localStorage.getItem('tenantId') || '69dd0cb31c5468a5b63511b7';
}

// Get common headers
function getHeaders() {
  return {
    'Authorization': `Bearer ${getToken()}`,
    'x-tenant-id': getTenantId(),
    'Content-Type': 'application/json'
  };
}

// Handle API errors - do NOT redirect on 401, just return error
function handleApiError(error, defaultMessage = 'An error occurred') {
  if (error.status === 401) {
    return { success: false, error: 'Authentication failed. Please login again.' };
  }
  if (error.status === 403) {
    return { success: false, error: 'Access denied' };
  }
  if (error.status === 404) {
    return { success: false, error: 'Resource not found' };
  }
  return { success: false, error: defaultMessage };
}

// Generic fetch wrapper
async function apiFetch(url, options = {}) {
  const defaultOptions = {
    headers: getHeaders()
  };

  try {
    const response = await fetch(url, { ...defaultOptions, ...options });
    
    if (!response.ok) {
      return handleApiError(response, `API Error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    return { success: false, error: error.message || 'Network error' };
  }
}

// Simple GET request
async function apiGet(url) {
  return apiFetch(`${API_BASE}${url}`);
}

// Simple POST request
async function apiPost(url, data) {
  return apiFetch(`${API_BASE}${url}`, {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

// Simple PUT request
async function apiPut(url, data) {
  return apiFetch(`${API_BASE}${url}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
}

// Simple DELETE request
async function apiDelete(url) {
  return apiFetch(`${API_BASE}${url}`, {
    method: 'DELETE'
  });
}

// API Methods
const API = {
  // Accounts
  getAccounts: () => apiFetch(`${API_BASE}/accounts`),
  
  // Ledger
  getLedger: (accountId, fromDate, toDate) => {
    const params = new URLSearchParams();
    if (fromDate) params.append('fromDate', fromDate);
    if (toDate) params.append('toDate', toDate);
    const query = params.toString() ? '?' + params.toString() : '';
    return apiFetch(`${API_BASE}/ledger/${accountId}${query}`);
  },
  
  getAccountBalance: (accountId, asOfDate) => {
    const query = asOfDate ? `?asOfDate=${asOfDate}` : '';
    return apiFetch(`${API_BASE}/ledger/${accountId}/balance${query}`);
  },
  
  // Trial Balance
  getTrialBalance: (asOfDate) => {
    const query = asOfDate ? `?asOfDate=${asOfDate}` : '';
    return apiFetch(`${API_BASE}/trial-balance${query}`);
  },
  
  validateTrialBalance: (asOfDate) => {
    const query = asOfDate ? `?asOfDate=${asOfDate}` : '';
    return apiFetch(`${API_BASE}/trial-balance/validate${query}`);
  },
  
  getTrialBalanceByType: (asOfDate) => {
    const query = asOfDate ? `?asOfDate=${asOfDate}` : '';
    return apiFetch(`${API_BASE}/trial-balance/by-type${query}`);
  },
  
  // System Accounts
  getSystemAccounts: () => apiFetch(`${API_BASE}/accounts/system`),
  
  // Dashboard
  getDashboard: (asOfDate) => {
    const query = asOfDate ? `?asOfDate=${asOfDate}` : '';
    return apiFetch(`${API_BASE}/dashboard${query}`);
  },
  
  // Utility
  getToken,
  getTenantId,
  handleApiError,
  apiGet,
  apiPost,
  apiPut,
  apiDelete
};

// Export to window
window.API = API;