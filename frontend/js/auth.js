/**
 * Authentication Service
 * Handles user login, logout, session management, and token storage
 */

// Backend API URL - Use relative path for production
const API_BASE_URL = '/api';

/**
 * Login user with email and password
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<Object>} - { success: boolean, data: {...}, error: string }
 */
async function login(email, password) {
  try {
    console.log('🔍 [Auth] Attempting login for:', email);
    console.log('🔍 [Auth] API URL:', `${API_BASE_URL}/auth/login`);

    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    console.log('🔍 [Auth] Response status:', response.status);
    console.log('🔍 [Auth] Response ok:', response.ok);

    const data = await response.json();
    console.log('🔍 [Auth] Response data:', data);

    if (!response.ok) {
      console.error('❌ [Auth] Login failed with status:', response.status);
      return {
        success: false,
        error: data.error || 'Login failed',
      };
    }

    if (data.success && data.data.token) {
      // Store token and user data
      const token = data.data.token;
      const user = data.data.user;

      console.log('✅ [Auth] Login successful, storing token');
      localStorage.setItem('auth_token', token);
      localStorage.setItem('user_data', JSON.stringify(user));
      localStorage.setItem('login_time', new Date().toISOString());

      return {
        success: true,
        data: {
          token,
          user,
        },
      };
    }

    console.warn('⚠️ [Auth] Invalid response structure');
    return {
      success: false,
      error: 'Invalid response from server',
    };
  } catch (error) {
    console.error('❌ [Auth] Network error:', error.message);
    return {
      success: false,
      error: error.message || 'Network error',
    };
  }
}

/**
 * Logout user and clear session
 */
function logout() {
  console.log('🔍 [Auth] Logging out user');
  localStorage.removeItem('auth_token');
  localStorage.removeItem('user_data');
  localStorage.removeItem('login_time');
  window.location.href = 'login.html';
}

/**
 * Check if user is authenticated
 * @returns {boolean} - True if token exists and is valid
 */
function isAuthenticated() {
  const token = localStorage.getItem('auth_token');
  return !!token;
}

/**
 * Validate token with server
 * @returns {Promise<boolean>} - True if token is valid
 */
async function validateTokenWithServer() {
  const token = getToken();
  
  if (!token) {
    console.log('❌ [Auth] No token to validate');
    return false;
  }

  try {
    console.log('🔍 [Auth] Validating token with server...');
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.status === 401) {
      console.log('❌ [Auth] Token invalid or expired (401)');
      return false;
    }

    if (!response.ok) {
      console.log(`❌ [Auth] Token validation failed: ${response.status}`);
      return false;
    }

    const data = await response.json();
    if (data.success) {
      console.log('✅ [Auth] Token is valid');
      return true;
    }

    console.log('❌ [Auth] Token validation returned unsuccessful');
    return false;
  } catch (error) {
    console.error('❌ [Auth] Token validation error:', error.message);
    return false;
  }
}

/**
 * Get stored authentication token
 * @returns {string|null} - JWT token or null
 */
function getToken() {
  return localStorage.getItem('auth_token');
}

/**
 * Get logged-in user data
 * @returns {Object|null} - User object or null
 */
function getUserData() {
  const userData = localStorage.getItem('user_data');
  return userData ? JSON.parse(userData) : null;
}

/**
 * Get user role (admin or staff)
 * @returns {string|null} - User role or null
 */
function getUserRole() {
  const user = getUserData();
  return user ? user.userRole : null;
}

/**
 * Get user company ID
 * @returns {string|null} - Company ID or null
 */
function getCompanyId() {
  const user = getUserData();
  return user ? user.tenantId || user.companyId : null;
}

/**
 * Make authenticated API request
 * @param {string} url - API endpoint URL
 * @param {Object} options - Fetch options
 * @returns {Promise<Response>} - Fetch response
 */
async function authenticatedFetch(url, options = {}) {
  const token = getToken();

  if (!token) {
    console.log('❌ [Auth] No token for authenticated fetch, redirecting to login');
    // No token, redirect to login
    window.location.href = 'login.html';
    return;
  }

  // Add token to Authorization header
  const headers = {
    ...options.headers,
    'Authorization': `Bearer ${token}`,
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  // Handle 401 (token expired or invalid)
  if (response.status === 401) {
    console.log('❌ [Auth] Token expired or invalid (401), logging out');
    logout();
    return;
  }

  return response;
}

/**
 * Check authentication and redirect if needed
 * Call this on page load for protected pages
 */
function checkAuthentication() {
  if (!isAuthenticated()) {
    console.log('❌ [Auth] Not authenticated, redirecting to login');
    window.location.href = 'login.html';
  }
}

/**
 * Validate token is still valid (basic check)
 * @returns {boolean} - True if token exists
 */
function validateToken() {
  return isAuthenticated();
}

/**
 * Initialize session validation on page load
 * Validates token with server and redirects if invalid
 */
async function initializeSessionValidation() {
  // Skip validation for login page
  if (window.location.pathname.includes('login.html')) {
    return;
  }

  console.log('🔍 [Auth] Initializing session validation...');
  
  // Check if token exists
  if (!isAuthenticated()) {
    console.log('❌ [Auth] No token found, redirecting to login');
    window.location.href = 'login.html';
    return;
  }

  // Validate token with server
  const isValid = await validateTokenWithServer();
  if (!isValid) {
    console.log('❌ [Auth] Token invalid, logging out');
    logout();
    return;
  }

  console.log('✅ [Auth] Session validated successfully');
}

// Auto-check authentication on page load (for protected pages)
document.addEventListener('DOMContentLoaded', () => {
  // Only check if not on login page
  if (!window.location.pathname.includes('login.html')) {
    // Initialize session validation
    initializeSessionValidation().catch(console.error);
  }
});
