import { useState, useEffect } from 'react';
import AccountTree from '../components/AccountTree';
import AccountForm from '../components/AccountForm';
import { getAccounts, createAccount, updateAccount, getAccountTypes } from '../services/accountService';

export default function AccountsPage() {
  const [accounts, setAccounts] = useState([]);
  const [accountTypes, setAccountTypes] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Load accounts and types on mount
  useEffect(() => {
    loadAccounts();
    loadAccountTypes();
  }, []);

  const loadAccounts = async () => {
    try {
      setLoading(true);
      const tree = await getAccounts();
      setAccounts(tree);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to load accounts');
    } finally {
      setLoading(false);
    }
  };

  const loadAccountTypes = async () => {
    try {
      const types = await getAccountTypes();
      setAccountTypes(types);
    } catch (err) {
      console.error('Failed to load account types:', err.message);
    }
  };

  const handleCreateNew = () => {
    setSelectedAccount(null);
    setShowForm(true);
    setError('');
    setSuccessMessage('');
  };

  const handleSelectAccount = (account) => {
    setSelectedAccount(account);
    setShowForm(true);
    setError('');
  };

  const handleFormSubmit = async (formData) => {
    try {
      setLoading(true);
      setError('');

      if (selectedAccount) {
        // Update
        await updateAccount(selectedAccount._id, formData);
        setSuccessMessage('Account updated successfully');
      } else {
        // Create
        await createAccount(formData);
        setSuccessMessage('Account created successfully');
      }

      // Reload accounts
      await loadAccounts();
      setShowForm(false);
      setSelectedAccount(null);

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(err.message || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setSelectedAccount(null);
    setError('');
  };

  // Get parent account options (all except current and its children)
  const getParentOptions = () => {
    const flatAccounts = flattenTree(accounts);
    return flatAccounts.filter(acc => acc._id !== selectedAccount?._id);
  };

  const flattenTree = (nodes) => {
    let result = [];
    nodes.forEach(node => {
      result.push(node);
      if (node.children && node.children.length > 0) {
        result = result.concat(flattenTree(node.children));
      }
    });
    return result;
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Chart of Accounts</h1>
            <p className="text-gray-600">Manage your accounting structure</p>
          </div>
          <button
            onClick={handleCreateNew}
            disabled={loading}
            className="px-6 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:opacity-50 transition"
          >
            + NEW ACCOUNT
          </button>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-700 font-semibold">✅ {successMessage}</p>
          </div>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Tree */}
          <div className="lg:col-span-2">
            <AccountTree
              accounts={accounts}
              onSelectAccount={handleSelectAccount}
              selectedAccountId={selectedAccount?._id}
            />
          </div>

          {/* Right: Form */}
          <div className="lg:col-span-1">
            {showForm ? (
              <AccountForm
                account={selectedAccount}
                accountTypes={accountTypes}
                parentAccounts={getParentOptions()}
                onSubmit={handleFormSubmit}
                onCancel={handleCancel}
                loading={loading}
                error={error}
              />
            ) : (
              <div className="bg-white rounded-lg shadow-md p-6 text-center">
                <p className="text-gray-500 mb-4">
                  Select an account to edit or click "NEW ACCOUNT" to create one
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
