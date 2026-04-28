import React, { useState, useEffect } from 'react';
import { getStockReport, getProfitLossReport, getLotPerformance, getDashboardReport } from '../../services/riceService';

function RiceReports() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState(null);
  const [stock, setStock] = useState([]);
  const [pnl, setPnl] = useState(null);
  const [performance, setPerformance] = useState([]);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'dashboard') {
        const res = await getDashboardReport();
        setDashboard(res.data.data);
      } else if (activeTab === 'stock') {
        const res = await getStockReport();
        setStock(res.data.data);
      } else if (activeTab === 'pnl') {
        const res = await getProfitLossReport();
        setPnl(res.data.data);
      } else if (activeTab === 'performance') {
        const res = await getLotPerformance();
        setPerformance(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">📈 Rice Trading Reports</h1>

      <div className="flex gap-2 mb-6 border-b">
        {['dashboard', 'stock', 'pnl', 'performance'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 ${activeTab === tab ? 'border-b-2 border-green-600 text-green-600 font-semibold' : 'text-gray-500'}`}
          >
            {tab === 'dashboard' ? '📊 Dashboard' : tab === 'stock' ? '📦 Stock' : tab === 'pnl' ? '💰 P&L' : '📉 Performance'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-8">Loading reports...</div>
      ) : (
        <>
          {activeTab === 'dashboard' && dashboard && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-lg shadow text-center">
                  <p className="text-gray-500">Total Revenue</p>
                  <p className="text-2xl font-bold text-green-600">₹{dashboard.summary?.totalRevenue?.toFixed(2)}</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow text-center">
                  <p className="text-gray-500">Total Net Profit</p>
                  <p className="text-2xl font-bold text-blue-600">₹{dashboard.summary?.totalNetProfit?.toFixed(2)}</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow text-center">
                  <p className="text-gray-500">Overall Margin</p>
                  <p className="text-2xl font-bold text-purple-600">{dashboard.summary?.overallMargin?.toFixed(2)}%</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-lg shadow">
                  <h3 className="font-semibold mb-2">Inventory Summary</h3>
                  <p>Active Lots: {dashboard.inventory?.activeLots}</p>
                  <p>Total Stock Weight: {dashboard.inventory?.totalStockWeight?.toFixed(2)} kg</p>
                  <p>Total Stock Value: ₹{dashboard.inventory?.totalStockValue?.toFixed(2)}</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow">
                  <h3 className="font-semibold mb-2">Expenses Breakdown</h3>
                  <p>Brokerage: ₹{dashboard.summary?.totalBrokerage?.toFixed(2)}</p>
                  <p>Transport: ₹{dashboard.summary?.totalTransport?.toFixed(2)}</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'stock' && (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left">Lot Number</th>
                    <th className="px-4 py-2 text-left">Grade</th>
                    <th className="px-4 py-2 text-right">Remaining Bags</th>
                    <th className="px-4 py-2 text-right">Remaining Weight</th>
                    <th className="px-4 py-2 text-right">Avg Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {stock.map((item) => (
                    <tr key={item.lotNumber} className="border-t">
                      <td className="px-4 py-2">{item.lotNumber}</td>
                      <td className="px-4 py-2">{item.grade}</td>
                      <td className="px-4 py-2 text-right">{item.remainingBags}</td>
                      <td className="px-4 py-2 text-right">{item.remainingWeight?.toFixed(0)} kg</td>
                      <td className="px-4 py-2 text-right">₹{item.averageCost?.toFixed(2)}/kg</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'pnl' && pnl && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-lg shadow">
                  <p className="text-gray-500">Total Revenue</p>
                  <p className="text-xl font-bold">₹{pnl.totalRevenue?.toFixed(2)}</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow">
                  <p className="text-gray-500">Total Expenses</p>
                  <p className="text-xl font-bold text-red-600">₹{pnl.totalExpenses?.toFixed(2)}</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow">
                  <p className="text-gray-500">Net Profit</p>
                  <p className="text-xl font-bold text-green-600">₹{pnl.totalNetProfit?.toFixed(2)}</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'performance' && (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left">Lot Number</th>
                    <th className="px-4 py-2 text-left">Grade</th>
                    <th className="px-4 py-2 text-right">Sold Bags</th>
                    <th className="px-4 py-2 text-right">Net Profit</th>
                    <th className="px-4 py-2 text-right">Margin</th>
                  </tr>
                </thead>
                <tbody>
                  {performance.map((lot) => (
                    <tr key={lot.lotNumber} className="border-t">
                      <td className="px-4 py-2">{lot.lotNumber}</td>
                      <td className="px-4 py-2">{lot.grade}</td>
                      <td className="px-4 py-2 text-right">{lot.soldBags}</td>
                      <td className="px-4 py-2 text-right text-green-600">₹{lot.netProfit?.toFixed(2)}</td>
                      <td className="px-4 py-2 text-right">{lot.profitMargin?.toFixed(2)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default RiceReports;