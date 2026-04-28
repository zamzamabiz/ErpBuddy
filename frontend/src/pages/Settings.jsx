import { useEffect, useState } from "react";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL || '/api';

function Settings() {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [formData, setFormData] = useState({
    businessType: 'rice_trading',
    businessName: '',
    enabledModules: {
      accounting: true,
      inventory: true,
      purchases: true,
      sales: true,
      expenses: true,
      riceMilling: false,
      riceProfitEngine: false,
      manufacturing: false,
      qualityControl: false,
      advancedReports: false,
      multiWarehouse: false,
      batchTracking: false,
      barcodeSupport: false
    },
    uiPreferences: {
      currency: 'PKR',
      dateFormat: 'DD/MM/YYYY',
      language: 'en',
      timezone: 'Asia/Karachi'
    }
  });

  // Get token from localStorage
  const getToken = () => localStorage.getItem('token');

  // Fetch business config
  const fetchConfig = async () => {
    setLoading(true);
    try {
      const token = getToken();
      const response = await axios.get(`${API_BASE}/business-config`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = response.data.data;
      setConfig(data);
      setFormData({
        businessType: data.businessType || 'rice_trading',
        businessName: data.businessName || '',
        enabledModules: data.enabledModules || formData.enabledModules,
        uiPreferences: data.uiPreferences || formData.uiPreferences
      });
    } catch (err) {
      console.error('Error fetching config:', err);
      setMessage({ type: 'error', text: 'Failed to load settings' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle module toggle
  const handleModuleToggle = (module) => {
    setFormData(prev => ({
      ...prev,
      enabledModules: {
        ...prev.enabledModules,
        [module]: !prev.enabledModules[module]
      }
    }));
  };

  // Handle UI preference change
  const handleUIPreferenceChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      uiPreferences: {
        ...prev.uiPreferences,
        [name]: value
      }
    }));
  };

  // Save configuration
  const handleSave = async () => {
    setSaving(true);
    setMessage({ type: '', text: '' });
    
    try {
      const token = getToken();
      const response = await axios.put(
        `${API_BASE}/business-config`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setConfig(response.data.data);
      setMessage({ type: 'success', text: 'Settings saved successfully!' });
    } catch (err) {
      console.error('Error saving config:', err);
      setMessage({ type: 'error', text: err.response?.data?.error || 'Failed to save settings' });
    } finally {
      setSaving(false);
    }
  };

  // Get business type label
  const getBusinessTypeLabel = (type) => {
    const labels = {
      rice_trading: '🌾 Rice Trading',
      general_trading: '🏪 General Trading',
      manufacturing: '🏭 Manufacturing',
      services: '💼 Services'
    };
    return labels[type] || type;
  };

  // Get module description
  const getModuleDescription = (module) => {
    const descriptions = {
      accounting: '📊 General Ledger, Journal, Trial Balance',
      inventory: '📦 Stock Management & Warehousing',
      purchases: '🛒 Purchase Orders & Vendor Management',
      sales: '💰 Sales Invoices & Customer Management',
      expenses: '💸 Expense Tracking & Management',
      riceMilling: '🌾 Paddy to Rice Milling Operations',
      riceProfitEngine: '📈 Rice-specific Profit Calculations',
      manufacturing: '🏭 Production Planning & BOM',
      qualityControl: '✅ Quality Inspection & Grading',
      advancedReports: '📊 Advanced Analytics & Reports',
      multiWarehouse: '🏢 Multiple Warehouse Support',
      batchTracking: '🏷️ Batch/Lot Number Tracking',
      barcodeSupport: '📱 Barcode Scanning Support'
    };
    return descriptions[module] || module;
  };

  // Get available modules for business type
  const getAvailableModules = () => {
    const coreModules = ['accounting', 'inventory', 'purchases', 'sales', 'expenses'];
    
    const industryModules = {
      rice_trading: ['riceMilling', 'riceProfitEngine', 'qualityControl'],
      general_trading: ['batchTracking', 'barcodeSupport', 'multiWarehouse'],
      manufacturing: ['manufacturing', 'qualityControl', 'batchTracking'],
      services: ['advancedReports']
    };

    return {
      core: coreModules,
      industry: industryModules[formData.businessType] || []
    };
  };

  if (loading) {
    return (
      <div className="p-8 bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  const modules = getAvailableModules();

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-800">⚙️ Business Settings</h1>
        <p className="text-gray-600 mt-2">Configure your business type and enabled modules</p>
      </div>

      {/* Message */}
      {message.text && (
        <div className={`px-6 py-4 rounded-lg mb-8 ${
          message.type === 'success' 
            ? 'bg-green-50 border-2 border-green-200 text-green-700' 
            : 'bg-red-50 border-2 border-red-200 text-red-700'
        }`}>
          <p className="font-semibold">{message.text}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Settings */}
        <div className="lg:col-span-2 space-y-8">
          {/* Business Information */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-700 mb-4">Business Information</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Business Name</label>
                <input
                  type="text"
                  name="businessName"
                  value={formData.businessName}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your business name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Business Type</label>
                <select
                  name="businessType"
                  value={formData.businessType}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="rice_trading">Rice Trading</option>
                  <option value="general_trading">General Trading</option>
                  <option value="manufacturing">Manufacturing</option>
                  <option value="services">Services</option>
                </select>
                <p className="text-sm text-gray-500 mt-1">
                  Selected: {getBusinessTypeLabel(formData.businessType)}
                </p>
              </div>
            </div>
          </div>

          {/* Module Configuration */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-700 mb-4">Module Configuration</h2>
            
            {/* Core Modules */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">Core Modules</h3>
              <div className="space-y-3">
                {modules.core.map(module => (
                  <div key={module} className="flex items-center justify-between py-2 border-b border-gray-100">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.enabledModules[module]}
                        onChange={() => handleModuleToggle(module)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="ml-3 text-gray-700 font-medium capitalize">{module}</span>
                    </div>
                    <span className="text-sm text-gray-500">{getModuleDescription(module)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Industry-Specific Modules */}
            <div>
              <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">
                {formData.businessType === 'rice_trading' ? 'Rice Trading' : 
                 formData.businessType === 'general_trading' ? 'Trading' :
                 formData.businessType === 'manufacturing' ? 'Manufacturing' : 'Services'} Modules
              </h3>
              <div className="space-y-3">
                {modules.industry.map(module => (
                  <div key={module} className="flex items-center justify-between py-2 border-b border-gray-100">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.enabledModules[module]}
                        onChange={() => handleModuleToggle(module)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="ml-3 text-gray-700 font-medium capitalize">{module}</span>
                    </div>
                    <span className="text-sm text-gray-500">{getModuleDescription(module)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-8">
          {/* UI Preferences */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-700 mb-4">UI Preferences</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                <select
                  name="currency"
                  value={formData.uiPreferences.currency}
                  onChange={handleUIPreferenceChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="PKR">PKR - Pakistani Rupee</option>
                  <option value="USD">USD - US Dollar</option>
                  <option value="EUR">EUR - Euro</option>
                  <option value="GBP">GBP - British Pound</option>
                  <option value="INR">INR - Indian Rupee</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date Format</label>
                <select
                  name="dateFormat"
                  value={formData.uiPreferences.dateFormat}
                  onChange={handleUIPreferenceChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                  <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
                <select
                  name="timezone"
                  value={formData.uiPreferences.timezone}
                  onChange={handleUIPreferenceChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Asia/Karachi">Asia/Karachi (PKT)</option>
                  <option value="Asia/Dubai">Asia/Dubai (GST)</option>
                  <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                  <option value="Europe/London">Europe/London (GMT)</option>
                  <option value="America/New_York">America/New_York (EST)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Current Configuration Summary */}
          <div className="bg-blue-50 rounded-lg shadow-lg p-6 border-l-4 border-blue-500">
            <h2 className="text-lg font-bold text-blue-900 mb-4">Configuration Summary</h2>
            
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-blue-700">Business Type:</span>
                <span className="font-semibold text-blue-900">{getBusinessTypeLabel(formData.businessType)}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-blue-700">Enabled Modules:</span>
                <span className="font-semibold text-blue-900">
                  {Object.values(formData.enabledModules).filter(v => v).length}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-blue-700">Currency:</span>
                <span className="font-semibold text-blue-900">{formData.uiPreferences.currency}</span>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={saving}
            className={`w-full py-4 rounded-lg font-bold text-lg transition ${
              saving 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {saving ? 'Saving...' : '💾 Save Configuration'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Settings;