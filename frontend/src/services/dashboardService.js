const API_BASE_URL = 'http://localhost:5000/api';

export async function getDashboardStats() {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found. Please log in again.');
    }
    
    console.log('Fetching dashboard stats from:', `${API_BASE_URL}/dashboard/stats`);
    
    const res = await fetch(`${API_BASE_URL}/dashboard/stats`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
    });
    
    console.log('Dashboard response status:', res.status);
    
    // Handle 401/403 Unauthorized/Forbidden
    if (res.status === 401 || res.status === 403) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
      return;
    }
    
    if (!res.ok) {
      let errorMsg = `HTTP ${res.status}`;
      try {
        const errorData = await res.json();
        errorMsg = errorData.message || errorMsg;
      } catch (e) {
        // If response is not JSON, just use status
      }
      throw new Error(errorMsg);
    }
    
    const data = await res.json();
    console.log('Dashboard stats response:', data);
    return data;
  } catch (error) {
    console.error('Dashboard stats error:', error);
    throw error;
  }
}