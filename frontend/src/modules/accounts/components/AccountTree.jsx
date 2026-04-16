import React, { useState, useEffect } from 'react';
import AccountNode from './AccountNode';
import { getAccountTree } from '../services/accountService';

/**
 * Account Tree Component
 * Displays hierarchical Chart of Accounts with expand/collapse
 */
const AccountTree = ({ onSelectAccount = null, readOnly = true, className = '' }) => {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedAccount, setSelectedAccount] = useState(null);

  // Fetch tree on mount
  useEffect(() => {
    const fetchTree = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getAccountTree();
        console.log('Accounts fetched:', data);
        setAccounts(Array.isArray(data) ? data : []);
      } catch (err) {
        const errorMessage = err.response?.data?.message || err.message || 'Failed to load accounts';
        console.error('Error loading account tree:', err);
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchTree();
  }, []);

  // Handle account selection
  const handleSelectAccount = (account) => {
    setSelectedAccount(account);
    if (onSelectAccount) {
      onSelectAccount(account);
    }
  };

  // Render loading state
  if (loading) {
    return (
      <div className={`flex items-center justify-center h-96 ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading Chart of Accounts...</p>
        </div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className={`p-6 bg-red-50 border border-red-200 rounded-lg ${className}`}>
        <p className="text-red-700 font-medium">Error Loading Accounts</p>
        <p className="text-red-600 text-sm mt-2">{error}</p>
      </div>
    );
  }

  // Render empty state
  if (!accounts || accounts.length === 0) {
    return (
      <div className={`p-6 text-center text-slate-500 ${className}`}>
        <p>No accounts available</p>
      </div>
    );
  }

  return (
    <div className={`space-y-1 ${className}`}>
      {accounts.map((account) => (
        <AccountNode
          key={account._id || account.code}
          account={account}
          level={0}
          onSelect={readOnly ? null : handleSelectAccount}
        />
      ))}

      {/* Debug Info (development only) */}
      {selectedAccount && process.env.NODE_ENV === 'development' && (
        <div className="mt-4 p-3 bg-slate-100 rounded text-xs font-mono border border-slate-300">
          <p className="font-semibold mb-2">Selected Account:</p>
          <p>{JSON.stringify(selectedAccount, null, 2)}</p>
        </div>
      )}
    </div>
  );
};

export default AccountTree;
