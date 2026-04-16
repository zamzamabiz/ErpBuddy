import { useState, useEffect } from 'react';

export default function AccountForm({
  account,
  accountTypes,
  parentAccounts,
  onSubmit,
  onCancel,
  loading,
  error
}) {
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    type: 'asset',
    parentId: '',
    description: ''
  });

  // Populate form if editing
  useEffect(() => {
    if (account) {
      setFormData({
        code: account.code || '',
        name: account.name || '',
        type: account.type || 'asset',
        parentId: account.parentId?._id || account.parentId || '',
        description: account.description || ''
      });
    }
  }, [account]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-xl font-bold mb-4 text-gray-800">
        {account ? 'Edit Account' : 'Create New Account'}
      </h3>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 font-semibold">⚠️ Error</p>
          <p className="text-red-600">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Code */}
        <div className="mb-4">
          <label className="block text-gray-700 font-semibold mb-2">Account Code *</label>
          <input
            type="text"
            name="code"
            value={formData.code}
            onChange={handleChange}
            disabled={!!account}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:bg-gray-100"
            placeholder="e.g., 1000"
            required
          />
          {account && <p className="text-xs text-gray-500 mt-1">Code cannot be changed</p>}
        </div>

        {/* Name */}
        <div className="mb-4">
          <label className="block text-gray-700 font-semibold mb-2">Account Name *</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            placeholder="e.g., Cash"
            required
          />
        </div>

        {/* Type */}
        <div className="mb-4">
          <label className="block text-gray-700 font-semibold mb-2">Account Type *</label>
          <select
            name="type"
            value={formData.type}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            required
          >
            {accountTypes.map(type => (
              <option key={type} value={type}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </option>
            ))}
          </select>
        </div>

        {/* Parent Account */}
        <div className="mb-4">
          <label className="block text-gray-700 font-semibold mb-2">Parent Account (optional)</label>
          <select
            name="parentId"
            value={formData.parentId}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            <option value="">-- None (Root Account) --</option>
            {parentAccounts.map(acc => (
              <option key={acc._id} value={acc._id}>
                {acc.code} - {acc.name}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">Select a parent to create a sub-account</p>
        </div>

        {/* Description */}
        <div className="mb-6">
          <label className="block text-gray-700 font-semibold mb-2">Description (optional)</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            placeholder="Account description"
            rows="3"
          />
        </div>

        {/* Buttons */}
        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-6 py-2 bg-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-400 disabled:opacity-50 transition"
          >
            CANCEL
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
          >
            {loading ? 'Saving...' : 'SAVE'}
          </button>
        </div>
      </form>
    </div>
  );
}
