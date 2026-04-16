import React, { useState, useEffect, useRef } from 'react';
import { Search, X, ChevronDown } from 'lucide-react';
import { getAccounts } from '../services/accountService';

/**
 * Account Selector Component
 * Reusable dropdown for selecting posting-level accounts
 * Used in: Sales, Purchase, Journal, Payments, Receipts
 * 
 * Props:
 * - value: Selected account object
 * - onChange: Callback when account is selected
 * - placeholder: Placeholder text
 * - error: Error message to display
 * - disabled: Disable the selector
 * - className: Additional CSS classes
 * - label: Form label text
 * - type: Filter by account type (asset, liability, equity, income, expense)
 * - category: Filter by category (Receivable, Payable, etc.)
 * - allowPosting: Filter by posting allowed (default: true)
 */
const AccountSelector = ({
  value = null,
  onChange = null,
  placeholder = 'Select Account',
  error = null,
  disabled = false,
  className = '',
  label = 'Account',
  type = null,
  category = null,
  allowPosting = true
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [accounts, setAccounts] = useState([]);
  const [filteredAccounts, setFilteredAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(value);
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  // Fetch and filter accounts on mount or when filters change
  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        setLoading(true);
        
        // Build filter parameters
        const params = {};
        if (allowPosting !== undefined) params.allowPosting = true; // Always filter posting accounts
        if (type) params.type = type;
        if (category) params.category = category;
        
        const data = await getAccounts(params);
        setAccounts(Array.isArray(data) ? data : data.data || []);
      } catch (err) {
        console.error('Error loading accounts:', err);
        setAccounts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAccounts();
  }, [type, category, allowPosting]);

  // Update selected account when value prop changes
  useEffect(() => {
    setSelectedAccount(value);
  }, [value]);

  // Filter accounts based on search text
  useEffect(() => {
    if (!searchText.trim()) {
      setFilteredAccounts(accounts);
    } else {
      const query = searchText.toLowerCase();
      const filtered = accounts.filter(
        (acc) =>
          acc.code.toLowerCase().includes(query) ||
          acc.name.toLowerCase().includes(query) ||
          (acc.type && acc.type.toLowerCase().includes(query))
      );
      setFilteredAccounts(filtered);
    }
  }, [searchText, accounts]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle account selection
  const handleSelectAccount = (account) => {
    setSelectedAccount(account);
    if (onChange) {
      onChange(account);
    }
    setSearchText('');
    setIsOpen(false);
  };

  // Clear selected account
  const handleClear = (e) => {
    e.stopPropagation();
    setSelectedAccount(null);
    setSearchText('');
    if (onChange) {
      onChange(null);
    }
  };

  // Format display text
  const getDisplayText = () => {
    if (!selectedAccount) return placeholder;
    return `[${selectedAccount.code}] ${selectedAccount.name}`;
  };

  return (
    <div className={`w-full ${className}`}>
      {/* Label */}
      {label && (
        <label className="block text-sm font-medium text-slate-700 mb-2">
          {label}
          <span className="text-red-500 ml-1">*</span>
        </label>
      )}

      {/* Selector Container */}
      <div ref={containerRef} className="relative">
        {/* Input Button */}
        <button
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={`
            w-full px-4 py-2 bg-white border rounded-lg text-left
            flex items-center justify-between
            transition-colors duration-200
            ${
              disabled
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                : 'border-slate-300 hover:border-slate-400 cursor-pointer'
            }
            ${error ? 'border-red-500' : ''}
            ${isOpen ? 'border-blue-500 ring-1 ring-blue-200' : ''}
          `}
        >
          <span className="text-slate-900 font-mono">
            {getDisplayText()}
          </span>

          <div className="flex items-center gap-2">
            {selectedAccount && !disabled && (
              <X
                size={18}
                className="text-slate-400 hover:text-slate-600"
                onClick={handleClear}
              />
            )}
            <ChevronDown
              size={18}
              className={`text-slate-400 transition-transform ${
                isOpen ? 'rotate-180' : ''
              }`}
            />
          </div>
        </button>

        {/* Dropdown Menu */}
        {isOpen && !disabled && (
          <div className="absolute top-full mt-1 w-full bg-white border border-slate-300 rounded-lg shadow-lg z-50">
            {/* Search Box */}
            <div className="p-3 border-b border-slate-200">
              <div className="flex items-center gap-2 bg-slate-50 rounded px-3 py-2">
                <Search size={18} className="text-slate-400" />
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Search by code or name..."
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  className="flex-1 bg-transparent outline-none text-slate-700 text-sm"
                  autoFocus
                />
              </div>
            </div>

            {/* Loading State */}
            {loading && (
              <div className="p-6 text-center text-slate-500">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
              </div>
            )}

            {/* Accounts List */}
            {!loading && (
              <div className="max-h-64 overflow-y-auto">
                {filteredAccounts.length === 0 ? (
                  <div className="p-4 text-center text-slate-500 text-sm">
                    {searchText ? 'No accounts found' : 'No accounts available'}
                  </div>
                ) : (
                  <div>
                    {filteredAccounts.map((account) => (
                      <button
                        key={account._id}
                        onClick={() => handleSelectAccount(account)}
                        className={`
                          w-full px-4 py-3 text-left border-b border-slate-100
                          hover:bg-blue-50 transition-colors
                          flex items-center justify-between
                          ${
                            selectedAccount?._id === account._id
                              ? 'bg-blue-100 border-l-4 border-l-blue-500'
                              : ''
                          }
                        `}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-mono text-sm font-medium text-slate-900">
                            [{account.code}] {account.name}
                          </p>
                          <p className="text-xs text-slate-500 mt-1">
                            {account.type} • {account.normalBalance}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <p className="text-red-500 text-sm mt-1">{error}</p>
      )}

      {/* Helper Text */}
      {selectedAccount && !error && (
        <p className="text-xs text-slate-500 mt-1">
          Normal Balance: <span className="font-medium">{selectedAccount.normalBalance}</span>
        </p>
      )}
    </div>
  );
};

export default AccountSelector;
