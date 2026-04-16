/**
 * Page Protection Module
 * Ensures only authenticated users can access protected pages
 * Add to any page that requires authentication
 */

/**
 * Initialize page protection
 * Call on page load before rendering content
 * Redirects to login if not authenticated
 */
function initializePageProtection() {
  if (!isAuthenticated()) {
    // Redirect to login immediately
    window.location.replace('login.html');
    return false;
  }

  // User is authenticated
  return true;
}

/**
 * Ensure authentication and get user for page
 * Returns user data or null if not authenticated
 */
function getAuthenticatedUser() {
  if (!isAuthenticated()) {
    window.location.replace('login.html');
    return null;
  }

  return getUserData();
}

/**
 * Check if user has a specific role
 * @param {string} requiredRole - ('admin' or 'staff')
 * @returns {boolean} - True if user has role
 */
function hasRole(requiredRole) {
  const userRole = getUserRole();
  return userRole === requiredRole;
}

/**
 * Check if user has one of multiple roles
 * @param {Array<string>} roles - Array of allowed roles
 * @returns {boolean} - True if user has one of the roles
 */
function hasAnyRole(roles) {
  const userRole = getUserRole();
  return roles.includes(userRole);
}

/**
 * Check if user is admin
 * @returns {boolean}
 */
function isAdmin() {
  return hasRole('admin');
}

/**
 * Check if user is staff
 * @returns {boolean}
 */
function isStaff() {
  return hasRole('staff');
}

/**
 * Show/hide elements based on user role
 * Add data-role="admin" or data-role="staff" to HTML elements
 * Elements will be hidden if user doesn't have that role
 */
function applyRoleBasedVisibility() {
  const userRole = getUserRole();

  if (!userRole) {
    return;
  }

  // Hide elements for admin only
  const adminElements = document.querySelectorAll('[data-role="admin"]');
  adminElements.forEach(el => {
    if (!isAdmin()) {
      el.style.display = 'none';
      el.classList.add('role-hidden');
    }
  });

  // Hide elements for staff only
  const staffElements = document.querySelectorAll('[data-role="staff"]');
  staffElements.forEach(el => {
    if (!isStaff()) {
      el.style.display = 'none';
      el.classList.add('role-hidden');
    }
  });

  // Show elements for both admin and staff
  const allAuthenticatedElements = document.querySelectorAll('[data-role="authenticated"]');
  allAuthenticatedElements.forEach(el => {
    el.style.display = '';
    el.classList.remove('role-hidden');
  });
}

/**
 * Disable elements based on user role
 * Add data-require-role="admin" to buttons/inputs
 * Button will be disabled if user doesn't have that role
 */
function applyRoleBasedDisabling() {
  const userRole = getUserRole();

  if (!userRole) {
    return;
  }

  // Disable admin-only buttons for staff
  const adminRequiredElements = document.querySelectorAll('[data-require-role="admin"]');
  adminRequiredElements.forEach(el => {
    if (!isAdmin()) {
      el.disabled = true;
      el.title = 'Only administrators can perform this action';
      el.classList.add('disabled-for-role');
    }
  });
}

/**
 * Initialize all protection features
 * Call on every protected page's DOMContentLoaded
 */
function initializeProtection() {
  // Check authentication first
  if (!initializePageProtection()) {
    return false;
  }

  // Apply role-based visibility
  applyRoleBasedVisibility();

  // Apply role-based disabling
  applyRoleBasedDisabling();

  return true;
}

/**
 * Wrap fetch calls with authentication
 * Automatically adds token and handles 401 errors
 */
async function protectedFetch(url, options = {}) {
  try {
    const response = await authenticatedFetch(url, options);

    if (!response) {
      // authenticatedFetch handles redirect for 401
      return null;
    }

    // Parse and handle errors
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `HTTP ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

/**
 * Add logout functionality to logout button
 * Add id="logoutBtn" to your logout button
 */
function initializeLogoutButton() {
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      logout();
    });
  }
}

// Initialize protection on page load
document.addEventListener('DOMContentLoaded', () => {
  // Get current page name
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';

  // Don't protect login page
  if (!currentPage.includes('login')) {
    // Initialize protection for other pages
    // Comment out if you want manual control
    // initializeProtection();
  }

  // Always initialize logout button if present
  initializeLogoutButton();
});
