import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getSummary } from "../modules/reports/services/reportService";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

function Dashboard() {
  const navigate = useNavigate();
  const [summaryData, setSummaryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Format currency with locale and 2 decimals
  const formatCurrency = (value) => {
    if (value === null || value === undefined) return '0.00';
    return parseFloat(value).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  // Format date in readable format
  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  useEffect(() => {
    async function fetchSummary() {
      setLoading(true);
      setError(null);
      try {
        const response = await getSummary();
        console.log('✅ Dashboard summary received:', response);
        setSummaryData(response);
      } catch (err) {
        console.error('❌ Dashboard error:', err);
        const errorMsg = err.response?.data?.message || err.message || "Failed to load financial data";
        
        // If any auth-related error, force re-login
        if (
          errorMsg.includes('Unauthorized') || 
          errorMsg.includes('Invalid token') || 
          errorMsg.includes('401') ||
          errorMsg.includes('Not authenticated')
        ) {
          console.log('🔐 Auth error detected, redirecting to login...');
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          navigate('/login', { replace: true });
          return;
        }
        
        setError(errorMsg);
      } finally {
        setLoading(false);
      }
    }
    fetchSummary();
  }, [navigate]);

  // Extract summary data safely
  const assets = summaryData?.financialPosition?.assets || 0;
  const liabilities = summaryData?.financialPosition?.liabilities || 0;
  const equity = summaryData?.financialPosition?.equity || 0;
  const income = summaryData?.profitLoss?.income || 0;
  const expenses = summaryData?.profitLoss?.expenses || 0;
  const netProfit = summaryData?.profitLoss?.netProfit || 0;

  // Prepare chart data
  const chartData = [
    { name: "Income", value: Math.abs(income) },
    { name: "Expenses", value: Math.abs(expenses) },
    { name: "Net Profit", value: Math.abs(netProfit) }
  ];

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <h1 className="text-4xl font-bold mb-2 text-gray-800">💼 Dashboard</h1>
      <p className="text-gray-600 mb-8">Financial overview and key metrics</p>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <span className="ml-4 text-gray-600 text-lg">Loading financial data...</span>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="bg-red-50 border-2 border-red-200 text-red-700 px-6 py-4 rounded-lg mb-8">
          <p className="font-semibold">⚠️ Error Loading Dashboard</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      )}

      {/* Success State */}
      {!loading && !error && summaryData && (
        <div className="space-y-8">
          {/* Financial Position Section */}
          <div>
            <h2 className="text-2xl font-bold mb-6 text-gray-700 flex items-center">
              📊 Financial Position
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Assets Card */}
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-8 rounded-lg shadow-lg border-l-4 border-blue-500 hover:shadow-xl transition">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-700 text-sm font-semibold mb-2 uppercase tracking-wide">Assets</p>
                    <p className="text-4xl font-bold text-blue-900">{formatCurrency(assets)}</p>
                  </div>
                  <div className="text-6xl opacity-20">🏦</div>
                </div>
              </div>

              {/* Liabilities Card */}
              <div className="bg-gradient-to-br from-red-50 to-red-100 p-8 rounded-lg shadow-lg border-l-4 border-red-500 hover:shadow-xl transition">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-red-700 text-sm font-semibold mb-2 uppercase tracking-wide">Liabilities</p>
                    <p className="text-4xl font-bold text-red-900">{formatCurrency(liabilities)}</p>
                  </div>
                  <div className="text-6xl opacity-20">📋</div>
                </div>
              </div>

              {/* Equity Card */}
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-8 rounded-lg shadow-lg border-l-4 border-purple-500 hover:shadow-xl transition">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-700 text-sm font-semibold mb-2 uppercase tracking-wide">Equity</p>
                    <p className="text-4xl font-bold text-purple-900">{formatCurrency(equity)}</p>
                  </div>
                  <div className="text-6xl opacity-20">💎</div>
                </div>
              </div>
            </div>
            
            {/* Financial Equation */}
            <div className="mt-4 p-4 bg-white rounded-lg border border-gray-200">
              <p className="text-center text-gray-700 font-semibold">
                Assets <span className="text-blue-600 font-bold text-lg mx-2">=</span>
                Liabilities <span className="text-red-600 font-bold text-lg mx-2">+</span>
                Equity
              </p>
              <p className="text-center text-sm text-gray-500 mt-2">
                {formatCurrency(assets)} = {formatCurrency(liabilities)} + {formatCurrency(equity)}
                {Math.abs(assets - (liabilities + equity)) < 0.01 ? (
                  <span className="ml-4 text-green-600 font-semibold">✅ Balanced</span>
                ) : (
                  <span className="ml-4 text-red-600 font-semibold">⚠️ Unbalanced</span>
                )}
              </p>
            </div>
          </div>

          {/* Profit & Loss Section */}
          <div>
            <h2 className="text-2xl font-bold mb-6 text-gray-700 flex items-center">
              📈 Profit & Loss
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Income Card */}
              <div className="bg-gradient-to-br from-green-50 to-green-100 p-8 rounded-lg shadow-lg border-l-4 border-green-500 hover:shadow-xl transition">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-700 text-sm font-semibold mb-2 uppercase tracking-wide">Income</p>
                    <p className="text-4xl font-bold text-green-900">{formatCurrency(income)}</p>
                  </div>
                  <div className="text-6xl opacity-20">💰</div>
                </div>
              </div>

              {/* Expenses Card */}
              <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-8 rounded-lg shadow-lg border-l-4 border-orange-500 hover:shadow-xl transition">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-700 text-sm font-semibold mb-2 uppercase tracking-wide">Expenses</p>
                    <p className="text-4xl font-bold text-orange-900">{formatCurrency(expenses)}</p>
                  </div>
                  <div className="text-6xl opacity-20">💸</div>
                </div>
              </div>

              {/* Net Profit Card */}
              <div className={`bg-gradient-to-br p-8 rounded-lg shadow-lg border-l-4 hover:shadow-xl transition ${
                netProfit >= 0 
                  ? 'from-emerald-50 to-emerald-100 border-emerald-500' 
                  : 'from-red-50 to-red-100 border-red-500'
              }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm font-semibold mb-2 uppercase tracking-wide ${
                      netProfit >= 0 ? 'text-emerald-700' : 'text-red-700'
                    }`}>
                      Net {netProfit >= 0 ? 'Profit' : 'Loss'}
                    </p>
                    <p className={`text-4xl font-bold ${
                      netProfit >= 0 ? 'text-emerald-900' : 'text-red-900'
                    }`}>
                      {formatCurrency(netProfit)}
                    </p>
                  </div>
                  <div className="text-6xl opacity-20">{netProfit >= 0 ? '📊' : '📉'}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Financial Chart */}
          <div>
            <h2 className="text-2xl font-bold mb-6 text-gray-700 flex items-center">
              📉 Financial Overview Chart
            </h2>
            <div className="bg-white p-8 rounded-lg shadow-lg">
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "#fff", 
                      border: "1px solid #ccc",
                      borderRadius: "4px"
                    }}
                    formatter={(value) => formatCurrency(value)}
                  />
                  <Legend />
                  <Bar dataKey="value" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h2 className="text-2xl font-bold mb-6 text-gray-700">🔗 Quick Access</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <a href="/reports/ledger" className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition text-center">
                <div className="text-3xl mb-2">📖</div>
                <div className="font-semibold text-gray-700">General Ledger</div>
              </a>
              <a href="/reports/trial-balance" className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition text-center">
                <div className="text-3xl mb-2">📋</div>
                <div className="font-semibold text-gray-700">Trial Balance</div>
              </a>
              <a href="/reports/summary" className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition text-center">
                <div className="text-3xl mb-2">💼</div>
                <div className="font-semibold text-gray-700">Summary</div>
              </a>
              <a href="/accounts" className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition text-center">
                <div className="text-3xl mb-2">📊</div>
                <div className="font-semibold text-gray-700">Accounts</div>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && !summaryData && (
        <div className="bg-yellow-50 border-2 border-yellow-200 text-yellow-700 px-6 py-8 rounded-lg text-center">
          <p className="text-lg font-semibold">No financial data available</p>
          <p className="text-sm mt-2">Please ensure transactions have been recorded in the system.</p>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
