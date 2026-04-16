/**
 * 📊 TRIAL BALANCE PAGE
 * ========================
 * Display trial balance report with Excel export
 */

import { useState } from 'react';
import * as XLSX from 'xlsx';
import { getTrialBalance } from '../services/reportService';

export default function TrialBalancePage() {
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [byType, setByType] = useState(false);
  const [trialBalanceData, setTrialBalanceData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // ✅ Fetch trial balance
  const handleFetchTrialBalance = async () => {
    setLoading(true);
    setError('');

    try {
      const filters = {
        fromDate: fromDate || null,
        toDate: toDate || null,
        byType: byType || false
      };

      const result = await getTrialBalance(filters);
      if (!result.success) {
        setError('Failed to fetch trial balance');
        return;
      }
      setTrialBalanceData(result);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch trial balance');
    } finally {
      setLoading(false);
    }
  };

  // ✅ Format currency with locale
  const formatCurrency = (value) => {
    if (value === null || value === undefined || value === 0) return '0.00';
    return parseFloat(value).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  // ✅ Get type styling
  const getTypeColor = (type) => {
    const colors = {
      asset: 'bg-blue-50 border-blue-200',
      liability: 'bg-red-50 border-red-200',
      equity: 'bg-purple-50 border-purple-200',
      income: 'bg-green-50 border-green-200',
      expense: 'bg-orange-50 border-orange-200'
    };
    return colors[type?.toLowerCase()] || 'bg-gray-50 border-gray-200';
  };

  const getTypeBg = (type) => {
    const colors = {
      asset: 'bg-blue-100',
      liability: 'bg-red-100',
      equity: 'bg-purple-100',
      income: 'bg-green-100',
      expense: 'bg-orange-100'
    };
    return colors[type?.toLowerCase()] || 'bg-gray-100';
  };

  const getTypeBadge = (type) => {
    const badges = {
      asset: 'bg-blue-200 text-blue-800',
      liability: 'bg-red-200 text-red-800',
      equity: 'bg-purple-200 text-purple-800',
      income: 'bg-green-200 text-green-800',
      expense: 'bg-orange-200 text-orange-800'
    };
    return badges[type?.toLowerCase()] || 'bg-gray-200 text-gray-800';
  };

  // ✅ Export trial balance to Excel
  const handleExportExcel = () => {
    if (!trialBalanceData) {
      setError('No data to export');
      return;
    }

    try {
      const exportData = [];

      if (byType && trialBalanceData.summary && Array.isArray(trialBalanceData.summary)) {
        // Export grouped by type
        trialBalanceData.summary.forEach((group) => {
          exportData.push({ Type: group.type.toUpperCase() });
          group.accounts.forEach((account) => {
            exportData.push({
              Code: account.code,
              Name: account.name,
              Debit: account.debit > 0 ? parseFloat(account.debit).toFixed(2) : '',
              Credit: account.credit > 0 ? parseFloat(account.credit).toFixed(2) : ''
            });
          });
          exportData.push({
            Code: `${group.type.toUpperCase()} SUBTOTAL`,
            Debit: parseFloat(group.subtotalDebit).toFixed(2),
            Credit: parseFloat(group.subtotalCredit).toFixed(2)
          });
          exportData.push({});
        });
      } else {
        // Export standard format
        if (trialBalanceData.accounts && Array.isArray(trialBalanceData.accounts)) {
          trialBalanceData.accounts.forEach((account) => {
            exportData.push({
              Code: account.code,
              Name: account.name,
              Debit: account.debit > 0 ? parseFloat(account.debit).toFixed(2) : '',
              Credit: account.credit > 0 ? parseFloat(account.credit).toFixed(2) : ''
            });
          });
        }
      }

      // Add summary
      exportData.push({});
      exportData.push({
        Code: 'GRAND TOTAL',
        Debit: parseFloat(trialBalanceData.totalDebit).toFixed(2),
        Credit: parseFloat(trialBalanceData.totalCredit).toFixed(2)
      });

      // Create workbook
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Trial Balance');

      // Style columns
      worksheet['!cols'] = [
        { wch: 15 },
        { wch: 30 },
        { wch: 15 },
        { wch: 15 }
      ];

      // Generate filename
      const fileName = `TrialBalance_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(workbook, fileName);
    } catch (err) {
      console.error('Export error:', err);
      setError('Failed to export to Excel');
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-4xl font-bold mb-2 text-gray-800 flex items-center">📊 Trial Balance</h1>
      <p className="text-gray-600 mb-8">Verify that debits equal credits and check account balances</p>

      {/* Filter Panel */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-6 border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {/* From Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              From Date
            </label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* To Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              To Date
            </label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Group by Type */}
          <div className="flex items-end">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={byType}
                onChange={(e) => setByType(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700 font-medium">Group by Account Type</span>
            </label>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={handleFetchTrialBalance}
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 font-medium transition"
          >
            {loading ? '⏳ Loading...' : '🔍 GENERATE REPORT'}
          </button>
          <button
            onClick={() => {
              setFromDate('');
              setToDate('');
              setByType(false);
              setTrialBalanceData(null);
              setError('');
            }}
            className="px-6 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 font-medium transition"
          >
            🔄 RESET
          </button>
          {trialBalanceData && (
            <button
              onClick={handleExportExcel}
              className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 font-medium transition"
            >
              📥 EXPORT TO EXCEL
            </button>
          )}
        </div>
      </div>

      {/* Loading Spinner */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-12 bg-white rounded-lg shadow-md">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mb-4"></div>
          <p className="text-gray-600 font-medium">Generating trial balance...</p>
        </div>
      )}

      {/* Error Message */}
      {error && !loading && (
        <div className="bg-red-50 border-2 border-red-200 text-red-700 px-6 py-4 rounded-lg mb-6">
          <p className="font-semibold">⚠️ Error</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && !trialBalanceData && (
        <div className="bg-blue-50 border-2 border-blue-200 text-blue-700 px-6 py-8 rounded-lg text-center">
          <p className="text-lg font-semibold">📭 No Report Generated</p>
          <p className="text-sm mt-2">Click "GENERATE REPORT" to see the trial balance</p>
        </div>
      )}

      {/* Trial Balance Report */}
      {!loading && !error && trialBalanceData && trialBalanceData.success && (
        <div className="space-y-6">
          {/* Verification Status */}
          <div className={`p-6 rounded-lg border-2 ${
            trialBalanceData.isBalanced
              ? 'bg-green-50 border-green-300'
              : 'bg-red-50 border-red-300'
          }`}>
            <div className="flex items-center gap-4">
              <span className="text-5xl">
                {trialBalanceData.isBalanced ? '✅' : '❌'}
              </span>
              <div className="flex-grow">
                <p className={`text-2xl font-bold ${
                  trialBalanceData.isBalanced ? 'text-green-700' : 'text-red-700'
                }`}>
                  {trialBalanceData.isBalanced ? 'Trial Balance Verified ✓' : 'Trial Balance Not Balanced ✗'}
                </p>
                <p className={`text-sm mt-2 ${
                  trialBalanceData.isBalanced ? 'text-green-600' : 'text-red-600'
                }`}>
                  Debits: {formatCurrency(trialBalanceData.totalDebit)} | Credits: {formatCurrency(trialBalanceData.totalCredit)}
                  {trialBalanceData.variance !== 0 && (
                    <span className="ml-4">Variance: {formatCurrency(trialBalanceData.variance)}</span>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Grouped by Type */}
          {byType && trialBalanceData.summary && Array.isArray(trialBalanceData.summary) && (
            <div className="space-y-6">
              {trialBalanceData.summary.map((group, groupIdx) => (
                <div key={groupIdx}>
                  {/* Type Header */}
                  <div className={`px-4 py-3 rounded-t-lg font-bold text-lg border-l-4 ${getTypeBg(group.type)} border-blue-500 flex items-center gap-2`}>
                    <span className="text-2xl">{group.type === 'asset' ? '🏦' : group.type === 'liability' ? '📋' : group.type === 'equity' ? '💎' : group.type === 'income' ? '💰' : '💸'}</span>
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getTypeBadge(group.type)}`}>
                      {group.type.toUpperCase()}
                    </span>
                  </div>

                  {/* Group Table */}
                  <div className="overflow-x-auto border border-t-0 border-gray-300 rounded-b-lg bg-white">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gray-200 border-b-2 border-gray-300">
                          <th className="px-4 py-3 text-left font-bold text-gray-700 w-1/3">Code</th>
                          <th className="px-4 py-3 text-left font-bold text-gray-700">Name</th>
                          <th className="px-4 py-3 text-right font-bold text-gray-700 w-1/6">Debit</th>
                          <th className="px-4 py-3 text-right font-bold text-gray-700 w-1/6">Credit</th>
                        </tr>
                      </thead>
                      <tbody>
                        {group.accounts && group.accounts.length > 0 ? (
                          group.accounts.map((account, idx) => (
                            <tr key={idx} className={`border-b border-gray-200 ${
                              idx % 2 === 0 ? 'bg-white hover:bg-gray-50' : `${getTypeColor(group.type).split(' ')[0]} hover:opacity-80`
                            } transition`}>
                              <td className="px-4 py-3 font-semibold text-gray-800">{account.code}</td>
                              <td className="px-4 py-3 text-gray-800">{account.name}</td>
                              <td className="px-4 py-3 text-right text-gray-800">
                                {account.debit > 0 ? formatCurrency(account.debit) : '-'}
                              </td>
                              <td className="px-4 py-3 text-right text-gray-800">
                                {account.credit > 0 ? formatCurrency(account.credit) : '-'}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="4" className="px-4 py-3 text-center text-gray-500">
                              No accounts in this type
                            </td>
                          </tr>
                        )}
                      </tbody>
                      {/* Group Subtotal */}
                      <tfoot>
                        <tr className={`${getTypeBg(group.type)} font-bold border-t-2 border-gray-300`}>
                          <td colSpan="2" className="px-4 py-3">
                            {group.type.toUpperCase()} SUBTOTAL
                          </td>
                          <td className="px-4 py-3 text-right">
                            {formatCurrency(group.subtotalDebit || 0)}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {formatCurrency(group.subtotalCredit || 0)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Standard Table (not grouped) */}
          {!byType && (
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-200 border-b-2 border-gray-300">
                    <tr>
                      <th className="px-4 py-3 text-left font-bold text-gray-700 text-sm">Code</th>
                      <th className="px-4 py-3 text-left font-bold text-gray-700 text-sm">Account Name</th>
                      <th className="px-4 py-3 text-right font-bold text-gray-700 text-sm">Debit</th>
                      <th className="px-4 py-3 text-right font-bold text-gray-700 text-sm">Credit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trialBalanceData.accounts && trialBalanceData.accounts.length > 0 ? (
                      trialBalanceData.accounts.map((account, idx) => (
                        <tr 
                          key={idx} 
                          className={`border-b border-gray-200 ${
                            idx % 2 === 0 ? 'bg-white hover:bg-gray-50' : 'bg-gray-50 hover:bg-gray-100'
                          } transition`}
                        >
                          <td className="px-4 py-3 font-semibold text-gray-800 text-sm">{account.code}</td>
                          <td className="px-4 py-3 text-gray-800 text-sm">{account.name}</td>
                          <td className="px-4 py-3 text-right text-gray-800 text-sm">
                            {account.debit > 0 ? formatCurrency(account.debit) : '-'}
                          </td>
                          <td className="px-4 py-3 text-right text-gray-800 text-sm">
                            {account.credit > 0 ? formatCurrency(account.credit) : '-'}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4" className="px-4 py-8 text-center text-gray-500 font-medium">
                          📭 No accounts found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Grand Total Footer */}
              <div className="bg-gray-900 text-white p-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-gray-300 uppercase font-semibold">Total Debit</p>
                    <p className="text-3xl font-bold text-green-400">{formatCurrency(trialBalanceData.totalDebit)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-300 uppercase font-semibold">Total Credit</p>
                    <p className="text-3xl font-bold text-blue-400">{formatCurrency(trialBalanceData.totalCredit)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-300 uppercase font-semibold">Accounts</p>
                    <p className="text-3xl font-bold text-yellow-400">
                      {trialBalanceData.accounts?.length || 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-300 uppercase font-semibold">Status</p>
                    <p className="text-3xl font-bold">
                      {trialBalanceData.isBalanced ? '✅' : '❌'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
