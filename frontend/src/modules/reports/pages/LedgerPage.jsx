/**
 * 📖 LEDGER PAGE
 * ========================
 * Display general ledger for selected account with Excel export
 */

import { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { getLedger } from '../services/reportService';
import { getAccounts } from '../../accounts/services/accountService';

export default function LedgerPage() {
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [includeOpening, setIncludeOpening] = useState(false);
  const [ledgerData, setLedgerData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [accounts, setAccounts] = useState([]);
  const [accountsLoading, setAccountsLoading] = useState(true);

  // ✅ Fetch available accounts
  useEffect(() => {
    const loadAccounts = async () => {
      setAccountsLoading(true);
      try {
        const result = await getAccounts();
        setAccounts(result || []);
      } catch (err) {
        console.error('Error loading accounts:', err);
        setError('Failed to load accounts');
      } finally {
        setAccountsLoading(false);
      }
    };
    loadAccounts();
  }, []);

  // ✅ Fetch ledger when parameters change
  const handleFetchLedger = async () => {
    if (!selectedAccount) {
      setError('Please select an account');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const filters = {
        fromDate: fromDate || null,
        toDate: toDate || null,
        includeOpening: includeOpening
      };

      const result = await getLedger(selectedAccount, filters);
      if (!result.success) {
        setError('Failed to fetch ledger data');
        return;
      }
      setLedgerData(result);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch ledger');
    } finally {
      setLoading(false);
    }
  };

  // ✅ Format currency with locale
  const formatCurrency = (value) => {
    if (value === null || value === undefined) return '0.00';
    return parseFloat(value).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  // ✅ Format date in readable format
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // ✅ Export ledger to Excel
  const handleExportExcel = () => {
    if (!ledgerData || !ledgerData.ledgerEntries) {
      setError('No data to export');
      return;
    }

    try {
      // Prepare data
      const exportData = ledgerData.ledgerEntries.map((entry) => ({
        Date: formatDate(entry.date),
        Description: entry.description || '',
        Reference: entry.reference || '',
        Debit: entry.debit ? parseFloat(entry.debit).toFixed(2) : '',
        Credit: entry.credit ? parseFloat(entry.credit).toFixed(2) : '',
        'Running Balance': parseFloat(entry.runningBalance).toFixed(2)
      }));

      // Add summary rows
      exportData.push({});
      exportData.push({
        Date: 'SUMMARY',
        Description: '',
        Reference: '',
        Debit: ledgerData.totalDebit.toFixed(2),
        Credit: ledgerData.totalCredit.toFixed(2),
        'Running Balance': ledgerData.closingBalance.toFixed(2)
      });

      // Create workbook
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Ledger');

      // Style columns
      worksheet['!cols'] = [
        { wch: 12 },
        { wch: 25 },
        { wch: 15 },
        { wch: 15 },
        { wch: 15 },
        { wch: 18 }
      ];

      // Generate filename
      const fileName = `Ledger_${ledgerData.account.code}_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(workbook, fileName);
    } catch (err) {
      console.error('Export error:', err);
      setError('Failed to export to Excel');
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-4xl font-bold mb-2 text-gray-800 flex items-center">📖 General Ledger</h1>
      <p className="text-gray-600 mb-8">View transaction history for any account</p>

      {/* Filter Panel */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-6 border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          {/* Account Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Account *
            </label>
            <select
              value={selectedAccount || ''}
              onChange={(e) => setSelectedAccount(e.target.value)}
              disabled={accountsLoading}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            >
              <option value="">{accountsLoading ? 'Loading...' : '-- Choose Account --'}</option>
              {accounts.map((account) => (
                <option key={account._id} value={account._id}>
                  {account.code} - {account.name}
                </option>
              ))}
            </select>
          </div>

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

          {/* Include Opening Checkbox */}
          <div className="flex items-end">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={includeOpening}
                onChange={(e) => setIncludeOpening(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Include Opening Balance</span>
            </label>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={handleFetchLedger}
            disabled={loading || !selectedAccount}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 font-medium transition"
          >
            {loading ? '⏳ Loading...' : '🔍 FETCH LEDGER'}
          </button>
          <button
            onClick={() => {
              setSelectedAccount(null);
              setFromDate('');
              setToDate('');
              setIncludeOpening(false);
              setLedgerData(null);
              setError('');
            }}
            className="px-6 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 font-medium transition"
          >
            🔄 RESET
          </button>
          {ledgerData && ledgerData.success && (
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
          <p className="text-gray-600 font-medium">Fetching ledger data...</p>
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
      {!loading && !error && !ledgerData && (
        <div className="bg-blue-50 border-2 border-blue-200 text-blue-700 px-6 py-8 rounded-lg text-center">
          <p className="text-lg font-semibold">📭 No Ledger Selected</p>
          <p className="text-sm mt-2">Select an account and click "FETCH LEDGER" to view transactions</p>
        </div>
      )}

      {/* Ledger Display */}
      {!loading && !error && ledgerData && ledgerData.success && (
        <div className="space-y-6">
          {/* Account Header */}
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-6 rounded-lg border-2 border-blue-200">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <p className="text-blue-700 text-sm font-semibold opacity-75 uppercase">Account Code</p>
                <p className="text-2xl font-bold text-blue-900">{ledgerData.account.code}</p>
              </div>
              <div>
                <p className="text-blue-700 text-sm font-semibold opacity-75 uppercase">Account Name</p>
                <p className="text-2xl font-bold text-blue-900">{ledgerData.account.name}</p>
              </div>
              <div>
                <p className="text-blue-700 text-sm font-semibold opacity-75 uppercase">Type</p>
                <p className="text-2xl font-bold text-blue-900 capitalize">{ledgerData.account.type}</p>
              </div>
              <div>
                <p className="text-blue-700 text-sm font-semibold opacity-75 uppercase">Balance Direction</p>
                <p className="text-2xl font-bold text-blue-900">{ledgerData.account.normalBalance}</p>
              </div>
            </div>
          </div>

          {/* Summary Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-green-50 p-6 rounded-lg border-2 border-green-200 hover:shadow-lg transition">
              <p className="text-green-700 text-sm font-semibold uppercase opacity-75">Opening Balance</p>
              <p className="text-3xl font-bold text-green-900 mt-2">
                {formatCurrency(ledgerData.openingBalance)}
              </p>
            </div>
            <div className="bg-blue-50 p-6 rounded-lg border-2 border-blue-200 hover:shadow-lg transition">
              <p className="text-blue-700 text-sm font-semibold uppercase opacity-75">Total Debit</p>
              <p className="text-3xl font-bold text-blue-900 mt-2">
                {formatCurrency(ledgerData.totalDebit)}
              </p>
            </div>
            <div className="bg-orange-50 p-6 rounded-lg border-2 border-orange-200 hover:shadow-lg transition">
              <p className="text-orange-700 text-sm font-semibold uppercase opacity-75">Total Credit</p>
              <p className="text-3xl font-bold text-orange-900 mt-2">
                {formatCurrency(ledgerData.totalCredit)}
              </p>
            </div>
            <div className="bg-purple-50 p-6 rounded-lg border-2 border-purple-200 hover:shadow-lg transition">
              <p className="text-purple-700 text-sm font-semibold uppercase opacity-75">Closing Balance</p>
              <p className="text-3xl font-bold text-purple-900 mt-2">
                {formatCurrency(ledgerData.closingBalance)}
              </p>
            </div>
          </div>

          {/* Ledger Table */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-200 border-b-2 border-gray-300">
                  <tr>
                    <th className="px-4 py-3 text-left font-bold text-gray-700 text-sm">Date</th>
                    <th className="px-4 py-3 text-left font-bold text-gray-700 text-sm">Description</th>
                    <th className="px-4 py-3 text-left font-bold text-gray-700 text-sm">Reference</th>
                    <th className="px-4 py-3 text-right font-bold text-gray-700 text-sm">Debit</th>
                    <th className="px-4 py-3 text-right font-bold text-gray-700 text-sm">Credit</th>
                    <th className="px-4 py-3 text-right font-bold text-gray-700 text-sm">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {ledgerData.ledgerEntries && ledgerData.ledgerEntries.length > 0 ? (
                    ledgerData.ledgerEntries.map((entry, idx) => (
                      <tr 
                        key={idx} 
                        className={`border-b border-gray-200 ${
                          idx % 2 === 0 ? 'bg-white hover:bg-gray-50' : 'bg-gray-50 hover:bg-gray-100'
                        } transition`}
                      >
                        <td className="px-4 py-3 text-sm text-gray-800">{formatDate(entry.date)}</td>
                        <td className="px-4 py-3 text-sm text-gray-800">{entry.description || '-'}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{entry.reference || '-'}</td>
                        <td className="px-4 py-3 text-sm text-right text-gray-800">
                          {entry.debit ? formatCurrency(entry.debit) : '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-gray-800">
                          {entry.credit ? formatCurrency(entry.credit) : '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-right font-bold text-blue-600">
                          {formatCurrency(entry.runningBalance)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="px-4 py-8 text-center text-gray-500 font-medium">
                        📭 No transactions found for this account
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Footer Stats */}
          <div className="bg-white p-4 rounded-lg shadow-md border border-gray-200 grid grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-gray-600 uppercase font-semibold">Total Entries</p>
              <p className="text-2xl font-bold text-blue-600">{ledgerData.ledgerEntries?.length || 0}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600 uppercase font-semibold">Entries with Debit</p>
              <p className="text-2xl font-bold text-blue-600">{ledgerData.ledgerEntries?.filter(e => e.debit).length || 0}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600 uppercase font-semibold">Entries with Credit</p>
              <p className="text-2xl font-bold text-blue-600">{ledgerData.ledgerEntries?.filter(e => e.credit).length || 0}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
