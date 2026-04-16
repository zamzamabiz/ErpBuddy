/**
 * 📈 FINANCIAL SUMMARY PAGE
 * ========================
 * Display quick financial overview cards
 */

import { useState, useEffect } from 'react';
import { getSummary } from '../services/reportService';

export default function SummaryPage() {
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [summaryData, setSummaryData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // ✅ Fetch summary on component mount and when dates change
  useEffect(() => {
    handleFetchSummary();
  }, []);

  // ✅ Fetch financial summary
  const handleFetchSummary = async () => {
    setLoading(true);
    setError('');

    try {
      const filters = {
        fromDate: fromDate || null,
        toDate: toDate || null
      };

      const result = await getSummary(filters);
      setSummaryData(result);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    if (value === null || value === undefined) return '0.00';
    return parseFloat(value).toFixed(2);
  };

  const SummaryCard = ({ title, amount, icon, bgColor, textColor, isNegative = false }) => {
    return (
      <div className={`${bgColor} p-6 rounded-lg shadow-md border-l-4 border-opacity-50`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 mb-1">{title}</p>
            <p className={`text-3xl font-bold ${textColor} ${isNegative && amount < 0 ? 'text-red-600' : ''}`}>
              {isNegative && amount < 0 ? '-' : ''}{formatCurrency(Math.abs(amount))}
            </p>
          </div>
          <div className="text-4xl opacity-20">{icon}</div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">📈 Financial Summary</h1>

      {/* Filter Panel */}
      <div className="bg-white p-4 rounded-lg shadow-md mb-6 border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {/* From Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
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
            <label className="block text-sm font-medium text-gray-700 mb-1">
              To Date
            </label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-end gap-2">
            <button
              onClick={handleFetchSummary}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 font-medium"
            >
              {loading ? 'Loading...' : 'REFRESH'}
            </button>
            <button
              onClick={() => {
                setFromDate('');
                setToDate('');
                setSummaryData(null);
                setError('');
              }}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 font-medium"
            >
              RESET
            </button>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6">
          ⚠️ {error}
        </div>
      )}

      {/* Summary Cards */}
      {summaryData && summaryData.success && (
        <>
          {/* Verification Status */}
          <div className={`mb-6 p-4 rounded-lg border-2 ${
            summaryData.verification?.isBalanced
              ? 'bg-green-50 border-green-300'
              : 'bg-red-50 border-red-300'
          }`}>
            <p className={`font-bold ${
              summaryData.verification?.isBalanced ? 'text-green-700' : 'text-red-700'
            }`}>
              {summaryData.verification?.isBalanced
                ? '✅ Trial Balance Verified - All entries are balanced'
                : '❌ Trial Balance Mismatch - Please verify entries'}
            </p>
          </div>

          {/* Financial Position Section */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">💼 Financial Position</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <SummaryCard
                title="Total Assets"
                amount={summaryData.financialPosition?.assets || 0}
                icon="🏦"
                bgColor="bg-blue-50"
                textColor="text-blue-600"
              />
              <SummaryCard
                title="Total Liabilities"
                amount={summaryData.financialPosition?.liabilities || 0}
                icon="💳"
                bgColor="bg-red-50"
                textColor="text-red-600"
              />
              <SummaryCard
                title="Total Equity"
                amount={summaryData.financialPosition?.equity || 0}
                icon="📊"
                bgColor="bg-purple-50"
                textColor="text-purple-600"
              />
            </div>
          </div>

          {/* Profit & Loss Section */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">📊 Profit & Loss</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <SummaryCard
                title="Total Income"
                amount={summaryData.profitAndLoss?.income || 0}
                icon="📈"
                bgColor="bg-green-50"
                textColor="text-green-600"
              />
              <SummaryCard
                title="Total Expenses"
                amount={summaryData.profitAndLoss?.expenses || 0}
                icon="💰"
                bgColor="bg-orange-50"
                textColor="text-orange-600"
              />
              <SummaryCard
                title="Net Profit/Loss"
                amount={summaryData.profitAndLoss?.netIncome || 0}
                icon={summaryData.profitAndLoss?.netIncome >= 0 ? '✅' : '⚠️'}
                bgColor={summaryData.profitAndLoss?.netIncome >= 0 ? 'bg-green-50' : 'bg-red-50'}
                textColor={summaryData.profitAndLoss?.netIncome >= 0 ? 'text-green-600' : 'text-red-600'}
                isNegative={true}
              />
            </div>
          </div>

          {/* Detailed Breakdown */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">📋 Detailed Breakdown</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Financial Position Details */}
              <div>
                <h3 className="text-lg font-bold text-gray-700 mb-3 pb-2 border-b-2 border-blue-300">
                  Financial Position
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-blue-50 rounded">
                    <span className="text-gray-600">Assets:</span>
                    <span className="font-bold text-blue-600">
                      {formatCurrency(summaryData.financialPosition?.assets || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-red-50 rounded">
                    <span className="text-gray-600">Liabilities:</span>
                    <span className="font-bold text-red-600">
                      {formatCurrency(summaryData.financialPosition?.liabilities || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-purple-50 rounded">
                    <span className="text-gray-600">Equity:</span>
                    <span className="font-bold text-purple-600">
                      {formatCurrency(summaryData.financialPosition?.equity || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-200 rounded font-bold">
                    <span>Equation Check (A = L + E):</span>
                    <span>
                      {(
                        summaryData.financialPosition?.assets ===
                        summaryData.financialPosition?.liabilities +
                          summaryData.financialPosition?.equity
                      )
                        ? '✅'
                        : '❌'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Income Statement Details */}
              <div>
                <h3 className="text-lg font-bold text-gray-700 mb-3 pb-2 border-b-2 border-green-300">
                  Income Statement
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-green-50 rounded">
                    <span className="text-gray-600">Income:</span>
                    <span className="font-bold text-green-600">
                      {formatCurrency(summaryData.profitAndLoss?.income || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-orange-50 rounded">
                    <span className="text-gray-600">Expenses:</span>
                    <span className="font-bold text-orange-600">
                      {formatCurrency(summaryData.profitAndLoss?.expenses || 0)}
                    </span>
                  </div>
                  <div className={`flex justify-between items-center p-3 rounded font-bold ${
                    summaryData.profitAndLoss?.netIncome >= 0
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                  }`}>
                    <span>Net Profit/Loss:</span>
                    <span>
                      {summaryData.profitAndLoss?.netIncome >= 0 ? '+ ' : '- '}
                      {formatCurrency(Math.abs(summaryData.profitAndLoss?.netIncome || 0))}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Period Information */}
          <div className="mt-6 text-center text-sm text-gray-600">
            <p>
              {summaryData.period?.from && summaryData.period?.to
                ? `Period: ${new Date(summaryData.period.from).toLocaleDateString()} to ${new Date(summaryData.period.to).toLocaleDateString()}`
                : 'All transactions'}
            </p>
          </div>
        </>
      )}
    </div>
  );
}
