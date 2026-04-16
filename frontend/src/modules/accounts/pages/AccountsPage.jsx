import React, { useState } from 'react';
import AccountTree from '../components/AccountTree';
import { BookOpen } from 'lucide-react';

/**
 * Accounts Page
 * Displays the Chart of Accounts in a hierarchical tree view
 */
const AccountsPage = () => {
  const [selectedAccount, setSelectedAccount] = useState(null);

  const handleSelectAccount = (account) => {
    setSelectedAccount(account);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center gap-3">
            <BookOpen size={32} className="text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold text-slate-900">
                Chart of Accounts
              </h1>
              <p className="text-slate-600 text-sm mt-1">
                View and manage your account hierarchy
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Panel: Account Tree */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
              <div className="p-6 border-b border-slate-200">
                <h2 className="text-lg font-semibold text-slate-900">
                  Account Hierarchy
                </h2>
                <p className="text-sm text-slate-600 mt-1">
                  Expand accounts to see the hierarchical structure
                </p>
              </div>

              <div className="p-6 max-h-screen overflow-y-auto">
                <AccountTree
                  onSelectAccount={handleSelectAccount}
                  readOnly={true}
                />
              </div>
            </div>
          </div>

          {/* Right Panel: Account Details */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm sticky top-8">
              <div className="p-6 border-b border-slate-200">
                <h3 className="text-lg font-semibold text-slate-900">
                  Account Details
                </h3>
              </div>

              {selectedAccount ? (
                <div className="p-6 space-y-4">
                  {/* Code */}
                  <div>
                    <label className="block text-xs font-medium text-slate-600 uppercase tracking-wide">
                      Code
                    </label>
                    <p className="text-lg font-mono font-semibold text-slate-900 mt-1">
                      {selectedAccount.code}
                    </p>
                  </div>

                  {/* Name */}
                  <div>
                    <label className="block text-xs font-medium text-slate-600 uppercase tracking-wide">
                      Name
                    </label>
                    <p className="text-base text-slate-900 mt-1">
                      {selectedAccount.name}
                    </p>
                  </div>

                  {/* Type */}
                  <div>
                    <label className="block text-xs font-medium text-slate-600 uppercase tracking-wide">
                      Type
                    </label>
                    <div className="mt-1">
                      <span className="inline-block px-3 py-1 bg-slate-100 text-slate-700 rounded text-sm font-medium">
                        {selectedAccount.type}
                      </span>
                    </div>
                  </div>

                  {/* Level */}
                  <div>
                    <label className="block text-xs font-medium text-slate-600 uppercase tracking-wide">
                      Level
                    </label>
                    <p className="text-sm text-slate-700 mt-1">
                      Level {selectedAccount.level}
                    </p>
                  </div>

                  {/* Normal Balance */}
                  <div>
                    <label className="block text-xs font-medium text-slate-600 uppercase tracking-wide">
                      Normal Balance
                    </label>
                    <p className="text-sm text-slate-700 mt-1">
                      {selectedAccount.normalBalance}
                    </p>
                  </div>

                  {/* Allow Posting */}
                  <div>
                    <label className="block text-xs font-medium text-slate-600 uppercase tracking-wide">
                      Allow Posting
                    </label>
                    <div className="mt-1">
                      <span
                        className={`
                          inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                          ${
                            selectedAccount.allowPosting
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }
                        `}
                      >
                        {selectedAccount.allowPosting ? '✓ Yes' : '✗ No'}
                      </span>
                    </div>
                  </div>

                  {/* Category */}
                  {selectedAccount.category && (
                    <div>
                      <label className="block text-xs font-medium text-slate-600 uppercase tracking-wide">
                        Category
                      </label>
                      <p className="text-sm text-slate-700 mt-1">
                        {selectedAccount.category}
                      </p>
                    </div>
                  )}

                  {/* Description */}
                  {selectedAccount.description && (
                    <div>
                      <label className="block text-xs font-medium text-slate-600 uppercase tracking-wide">
                        Description
                      </label>
                      <p className="text-sm text-slate-700 mt-1">
                        {selectedAccount.description}
                      </p>
                    </div>
                  )}

                  {/* Current Balance */}
                  {selectedAccount.balance !== undefined && (
                    <div className="pt-4 border-t border-slate-200">
                      <label className="block text-xs font-medium text-slate-600 uppercase tracking-wide">
                        Current Balance
                      </label>
                      <p className="text-lg font-semibold text-slate-900 mt-2">
                        {selectedAccount.balance
                          ? new Intl.NumberFormat('en-US', {
                              style: 'currency',
                              currency: 'USD'
                            }).format(selectedAccount.balance)
                          : '0.00'}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-6 text-center">
                  <div className="text-slate-400 mb-2 text-4xl">📋</div>
                  <p className="text-slate-600 text-sm">
                    Select an account from the tree to view details
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="max-w-7xl mx-auto px-6 py-8 text-center text-sm text-slate-500">
        <p>
          Chart of Accounts provides a complete hierarchical view of all accounts in your system.
        </p>
      </div>
    </div>
  );
};

export default AccountsPage;
