import { useEffect, useState } from "react";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL || '/api';

function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    expenseType: 'transport',
    amount: '',
    description: '',
    expenseDate: new Date().toISOString().split('T')[0],
    expenseAccountId: '',
    paymentAccountId: ''
  });

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
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Get token from localStorage
  const getToken = () => localStorage.getItem('token');

  // Fetch expenses
  const fetchExpenses = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = getToken();
      const response = await axios.get(`${API_BASE}/expenses`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setExpenses(response.data.data || []);
    } catch (err) {
      console.error('Error fetching expenses:', err);
      setError(err.response?.data?.error || 'Failed to load expenses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = getToken();
      await axios.post(`${API_BASE}/expenses`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Reset form and refresh list
      setFormData({
        expenseType: 'transport',
        amount: '',
        description: '',
        expenseDate: new Date().toISOString().split('T')[0],
        expenseAccountId: '',
        paymentAccountId: ''
      });
      setShowForm(false);
      fetchExpenses();
    } catch (err) {
      console.error('Error creating expense:', err);
      alert(err.response?.data?.error || 'Failed to create expense');
    }
  };

  // Get expense type label
  const getExpenseTypeLabel = (type) => {
    const labels = {
      transport: '🚚 Transport',
      labour: '👷 Labour',
      packing: '📦 Packing',
      loading: '🏗️ Loading',
      brokerage: '🤝 Brokerage',
      utilities: '💡 Utilities',
      rent: '🏢 Rent',
      salaries: '💼 Salaries',
      other: '📋 Other'
    };
    return labels[type] || type;
  };

  // Calculate total expenses
  const totalExpenses = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold text-gray-800">💸 Expenses</h1>
          <p className="text-gray-600 mt-2">Track and manage business expenses</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition font-semibold"
        >
          {showForm ? 'Cancel' : '+ Add Expense'}
        </button>
      </div>

      {/* Add Expense Form */}
      {showForm && (
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8 border border-gray-200">
          <h2 className="text-xl font-bold mb-4 text-gray-700">Add New Expense</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Expense Type</label>
              <select
                name="expenseType"
                value={formData.expenseType}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="transport">Transport</option>
                <option value="labour">Labour</option>
                <option value="packing">Packing</option>
                <option value="loading">Loading</option>
                <option value="brokerage">Brokerage</option>
                <option value="utilities">Utilities</option>
                <option value="rent">Rent</option>
                <option value="salaries">Salaries</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
              <input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleInputChange}
                step="0.01"
                min="0"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                placeholder="0.00"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input
                type="date"
                name="expenseDate"
                value={formData.expenseDate}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <input
                type="text"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                placeholder="Enter description"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Expense Account</label>
              <input
                type="text"
                name="expenseAccountId"
                value={formData.expenseAccountId}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                placeholder="Expense Account ID"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Payment Account</label>
              <input
                type="text"
                name="paymentAccountId"
                value={formData.paymentAccountId}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                placeholder="Payment Account ID"
                required
              />
            </div>

            <div className="md:col-span-2">
              <button
                type="submit"
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition font-semibold"
              >
                Create Expense
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <span className="ml-4 text-gray-600 text-lg">Loading expenses...</span>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="bg-red-50 border-2 border-red-200 text-red-700 px-6 py-4 rounded-lg mb-8">
          <p className="font-semibold">⚠️ Error Loading Expenses</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      )}

      {/* Summary Card */}
      {!loading && !error && expenses.length > 0 && (
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-gray-600 text-sm font-medium">Total Expenses</p>
              <p className="text-3xl font-bold text-gray-900">{formatCurrency(totalExpenses)}</p>
            </div>
            <div className="text-5xl opacity-20">💸</div>
          </div>
        </div>
      )}

      {/* Expenses Table */}
      {!loading && !error && expenses.length > 0 && (
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {expenses.map((expense) => (
                <tr key={expense._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(expense.expenseDate)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {getExpenseTypeLabel(expense.expenseType)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {expense.description || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold text-gray-900">
                    {formatCurrency(expense.amount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      expense.status === 'Posted' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {expense.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && expenses.length === 0 && (
        <div className="bg-yellow-50 border-2 border-yellow-200 text-yellow-700 px-6 py-8 rounded-lg text-center">
          <p className="text-lg font-semibold">No expenses recorded yet</p>
          <p className="text-sm mt-2">Click "Add Expense" to record your first expense.</p>
        </div>
      )}
    </div>
  );
}

export default Expenses;