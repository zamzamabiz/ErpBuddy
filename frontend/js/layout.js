/**
 * Common Layout Components for ERP Buddy
 * Provides consistent header, navigation, and utility functions
 */

// Navigation items configuration
const NAV_ITEMS = [
  { href: 'dashboard.html', label: 'Dashboard' },
  { href: 'ledger.html', label: 'Ledger' },
  { href: 'trial-balance.html', label: 'Trial Balance' },
  { href: 'profit-loss.html', label: 'P&L' },
  { href: 'balance-sheet.html', label: 'Balance Sheet' }
];

// Create header HTML
function createHeader(pageTitle) {
  return `
    <header class="bg-blue-600 text-white p-4 shadow">
      <div class="container mx-auto flex justify-between items-center">
        <h1 class="text-2xl font-bold">${pageTitle}</h1>
        <nav>
          ${NAV_ITEMS.map(item => `
            <a href="${item.href}" class="mr-4 hover:underline">${item.label}</a>
          `).join('')}
          <button onclick="logout()" class="bg-red-500 px-3 py-1 rounded hover:bg-red-600">Logout</button>
        </nav>
      </div>
    </header>
  `;
}

// Logout function
function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('tenantId');
  window.location.href = 'login.html';
}

// Show error message
function showError(message, containerId = 'errorMessage') {
  const errorDiv = document.getElementById(containerId);
  if (errorDiv) {
    errorDiv.textContent = message;
    errorDiv.classList.remove('hidden');
    setTimeout(() => errorDiv.classList.add('hidden'), 5000);
  } else {
    console.error('Error:', message);
    alert(message);
  }
}

// Show loading indicator
function showLoading(show, containerId = 'loadingIndicator') {
  const loadingDiv = document.getElementById(containerId);
  if (loadingDiv) {
    loadingDiv.classList.toggle('hidden', !show);
  }
}

// Format currency
function formatCurrency(amount) {
  return parseFloat(amount || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

// Format date
function formatDate(dateStr) {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString();
}

// Export to CSV
function exportToCSV(data, filename) {
  if (!data || data.length === 0) {
    alert('No data to export');
    return;
  }

  // Get headers from first object
  const headers = Object.keys(data[0]);
  
  // Create CSV content
  const csvContent = [
    headers.join(','),
    ...data.map(row => headers.map(header => {
      let value = row[header] || '';
      // Escape quotes and wrap in quotes if contains comma
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        value = '"' + value.replace(/"/g, '""') + '"';
      }
      return value;
    }).join(','))
  ].join('\n');

  // Create and trigger download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename + '_' + new Date().toISOString().split('T')[0] + '.csv');
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Export to CSV with custom columns
function exportToCSVCustom(data, columns, filename) {
  if (!data || data.length === 0) {
    alert('No data to export');
    return;
  }

  // Create CSV content
  const csvContent = [
    columns.map(c => c.header).join(','),
    ...data.map(row => columns.map(c => {
      let value = row[c.key] || '';
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        value = '"' + value.replace(/"/g, '""') + '"';
      }
      return value;
    }).join(','))
  ].join('\n');

  // Create and trigger download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename + '_' + new Date().toISOString().split('T')[0] + '.csv');
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Get auth token from localStorage
function getToken() {
  return localStorage.getItem('token');
}

// Get tenant ID from localStorage
function getTenantId() {
  return localStorage.getItem('tenantId');
}

// Handle API errors
function handleApiError(error, message) {
  if (error.status === 401) {
    logout();
  } else {
    showError(message || 'An error occurred');
  }
}

// Export to window
window.Layout = {
  createHeader,
  logout,
  showError,
  showLoading,
  formatCurrency,
  formatDate,
  exportToCSV,
  exportToCSVCustom,
  getToken,
  getTenantId,
  handleApiError
};
