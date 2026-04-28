import { useEffect, useState } from "react";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL || '/api';

function AdminPanel() {
  const [systemStatus, setSystemStatus] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  // Get token from localStorage
  const getToken = () => localStorage.getItem('token');

  // Fetch system status
  const fetchSystemStatus = async () => {
    try {
      const token = getToken();
      const response = await axios.get(`${API_BASE}/admin/system-status`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSystemStatus(response.data.data);
    } catch (err) {
      console.error('Error fetching system status:', err);
    }
  };

  // Fetch alerts
  const fetchAlerts = async () => {
    try {
      const token = getToken();
      const response = await axios.get(`${API_BASE}/admin/alerts`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAlerts(response.data.data || []);
    } catch (err) {
      console.error('Error fetching alerts:', err);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        await Promise.all([fetchSystemStatus(), fetchAlerts()]);
      } catch (err) {
        console.error('Error loading admin data:', err);
        setError(err.message || 'Failed to load admin data');
      } finally {
        setLoading(false);
      }
    };
    loadData();

    // Refresh every 30 seconds
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  // Format currency
  const formatCurrency = (value) => {
    if (value === null || value === undefined) return '0.00';
    return parseFloat(value).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get severity badge color
  const getSeverityColor = (severity) => {
    const colors = {
      low: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-orange-100 text-orange-800',
      critical: 'bg-red-100 text-red-800'
    };
    return colors[severity] || 'bg-gray-100 text-gray-800';
  };

  // Get alert type label
  const getAlertTypeLabel = (type) => {
    const labels = {
      NEGATIVE_STOCK: '📦 Negative Stock',
      NEGATIVE_PROFIT: '📉 Negative Profit',
      API_ERROR_SPIKE: '⚡ API Error Spike',
      LOW_STOCK: '⚠️ Low Stock',
      HIGH_VALUE_TRANSACTION: '💰 High Value',
      SYSTEM_ERROR: '🔧 System Error'
    };
    return labels[type] || type;
  };

  if (loading) {
    return (
      <div className="p-8 bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-800">⚙️ Admin Panel</h1>
        <p className="text-gray-600 mt-2">System monitoring and control</p>
      </div>

      {error && (
        <div className="bg-red-50 border-2 border-red-200 text-red-700 px-6 py-4 rounded-lg mb-8">
          <p className="font-semibold">⚠️ Error</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-6 py-3 font-semibold ${
            activeTab === 'overview'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('alerts')}
          className={`px-6 py-3 font-semibold ${
            activeTab === 'alerts'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Alerts
          {alerts.length > 0 && (
            <span className="ml-2 bg-red-500 text-white px-2 py-0.5 rounded-full text-sm">
              {alerts.length}
            </span>
          )}
        </button>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && systemStatus && (
        <div className="space-y-6">
          {/* System Status Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Total Tenants</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {systemStatus.tenants || 0}
                  </p>
                </div>
                <div className="text-5xl opacity-20">🏢</div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Total Users</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {systemStatus.users || 0}
                  </p>
                </div>
                <div className="text-5xl opacity-20">👥</div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Total Sales</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {formatCurrency(systemStatus.totalSales || 0)}
                  </p>
                </div>
                <div className="text-5xl opacity-20">💰</div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Total Profit</p>
                  <p className={`text-3xl font-bold ${
                    (systemStatus.totalProfit || 0) >= 0 
                      ? 'text-green-600' 
                      : 'text-red-600'
                  }`}>
                    {formatCurrency(systemStatus.totalProfit || 0)}
                  </p>
                </div>
                <div className="text-5xl opacity-20">📈</div>
              </div>
            </div>
          </div>

          {/* System Health */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-700 mb-4">System Health</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center">
                <div className={`w-3 h-3 rounded-full mr-3 ${
                  systemStatus.database === 'connected' ? 'bg-green-500' : 'bg-red-500'
                }`}></div>
                <span className="text-gray-700">Database: {systemStatus.database || 'unknown'}</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full mr-3 bg-green-500"></div>
                <span className="text-gray-700">API: Online</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full mr-3 bg-green-500"></div>
                <span className="text-gray-700">Server: Running</span>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-700 mb-4">Recent Activity</h2>
            <div className="space-y-3">
              {systemStatus.recentActivity?.map((activity, index) => (
                <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100">
                  <div className="flex items-center">
                    <span className="text-gray-600">{activity.action}</span>
                  </div>
                  <span className="text-sm text-gray-500">{formatDate(activity.timestamp)}</span>
                </div>
              )) || <p className="text-gray-500">No recent activity</p>}
            </div>
          </div>
        </div>
      )}

      {/* Alerts Tab */}
      {activeTab === 'alerts' && (
        <div className="space-y-6">
          {/* Alert Summary */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-700 mb-4">Alert Summary</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">
                  {alerts.filter(a => a.severity === 'low').length}
                </p>
                <p className="text-sm text-green-700">Low</p>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <p className="text-2xl font-bold text-yellow-600">
                  {alerts.filter(a => a.severity === 'medium').length}
                </p>
                <p className="text-sm text-yellow-700">Medium</p>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <p className="text-2xl font-bold text-orange-600">
                  {alerts.filter(a => a.severity === 'high').length}
                </p>
                <p className="text-sm text-orange-700">High</p>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <p className="text-2xl font-bold text-red-600">
                  {alerts.filter(a => a.severity === 'critical').length}
                </p>
                <p className="text-sm text-red-700">Critical</p>
              </div>
            </div>
          </div>

          {/* Alerts List */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-700">Recent Alerts</h2>
            </div>
            {alerts.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                No alerts - system is healthy! 🎉
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Message</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Severity</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {alerts.map((alert) => (
                    <tr key={alert.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(alert.timestamp)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {getAlertTypeLabel(alert.type)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {alert.message}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getSeverityColor(alert.severity)}`}>
                          {alert.severity}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminPanel;