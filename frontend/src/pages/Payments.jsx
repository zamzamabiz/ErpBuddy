import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, Eye } from 'lucide-react';
import paymentService from '../services/paymentService';
import { getAccounts } from '../services/accountService';
import './Payments.css';

export default function Payments() {
  const navigate = useNavigate();
  // State
  const [formMode, setFormMode] = useState('list'); // list, create, view
  const [payments, setPayments] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    type: 'payment',
    accountId: '',
    amount: '',
    description: ''
  });

  const [selectedPayment, setSelectedPayment] = useState(null);

  // Helper to handle auth errors
  const handleAuthError = (errorMsg) => {
    if (errorMsg.includes('User not found') || errorMsg.includes('Invalid token') || errorMsg.includes('401')) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      navigate('/login');
      return true;
    }
    return false;
  };

  // Load data on mount
  useEffect(() => {
    loadPayments();
    loadAccounts();
  }, [navigate]);

  const loadPayments = async () => {
    try {
      setLoading(true);
      const response = await paymentService.listPayments();
      setPayments(response.data || []);
      setError('');
    } catch (err) {
      const errorMsg = err.message || 'Failed to load payments';
      if (!handleAuthError(errorMsg)) {
        setError(errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  const loadAccounts = async () => {
    try {
      const response = await getAccounts();
      const flatAccounts = flattenAccountTree(response || []);
      setAccounts(flatAccounts);
    } catch (err) {
      console.error('Failed to load accounts:', err);
    }
  };

  const flattenAccountTree = (tree) => {
    const flat = [];
    const traverse = (nodes) => {
      nodes.forEach(node => {
        flat.push(node);
        if (node.children?.length) traverse(node.children);
      });
    };
    traverse(tree);
    return flat;
  };

  const handleCreateNew = () => {
    setFormMode('create');
    setSelectedPayment(null);
    setFormData({
      date: new Date().toISOString().split('T')[0],
      type: 'payment',
      accountId: '',
      amount: '',
      description: ''
    });
    setError('');
    setSuccess('');
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validate
    if (!formData.date) {
      setError('Date is required');
      return;
    }
    if (!formData.type) {
      setError('Type is required');
      return;
    }
    if (!formData.accountId) {
      setError('Account is required');
      return;
    }
    if (!formData.amount || formData.amount <= 0) {
      setError('Amount must be greater than 0');
      return;
    }

    try {
      setLoading(true);
      await paymentService.createPayment(formData);
      setSuccess(`${formData.type === 'payment' ? 'Payment' : 'Receipt'} created successfully`);
      setFormMode('list');
      loadPayments();
    } catch (err) {
      setError(err.message || 'Failed to create payment');
    } finally {
      setLoading(false);
    }
  };

  const handleViewPayment = async (payment) => {
    try {
      const response = await paymentService.getPayment(payment._id);
      setSelectedPayment(response.data);
      setFormMode('view');
    } catch (err) {
      setError('Failed to load payment details');
    }
  };

  if (formMode === 'create') {
    return (
      <div className="payments-container">
        <div className="payments-header">
          <h1>New {formData.type === 'payment' ? 'Payment' : 'Receipt'}</h1>
          <button className="btn-secondary" onClick={() => setFormMode('list')}>
            ← Back to List
          </button>
        </div>

        {error && <div className="alert alert-error">❌ {error}</div>}
        {success && <div className="alert alert-success">✅ {success}</div>}

        <form onSubmit={handleFormSubmit} className="payment-form">
          <div className="form-row">
            <div className="form-group">
              <label>Date *</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>Type *</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                required
              >
                <option value="payment">Payment (OUT)</option>
                <option value="receipt">Receipt (IN)</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group full-width">
              <label>Account *</label>
              <select
                value={formData.accountId}
                onChange={(e) => setFormData({ ...formData, accountId: e.target.value })}
                required
              >
                <option value="">Select Cash/Bank Account</option>
                {accounts
                  .filter(acc => ['asset', 'liability'].includes(acc.type))
                  .map(acc => (
                    <option key={acc._id} value={acc._id}>
                      {acc.code} - {acc.name}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Amount *</label>
              <input
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || '' })}
                placeholder="0.00"
                required
              />
            </div>

            <div className="form-group">
              <label>Description</label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Optional memo"
              />
            </div>
          </div>

          <div className="form-actions">
            <button type="button" onClick={() => setFormMode('list')} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    );
  }

  if (formMode === 'view') {
    return (
      <div className="payments-container">
        <div className="payments-header">
          <h1>Payment Details</h1>
          <button className="btn-secondary" onClick={() => setFormMode('list')}>
            ← Back to List
          </button>
        </div>

        <div className="payment-detail">
          <div className="detail-section">
            <div><strong>Reference:</strong> {selectedPayment?.reference}</div>
            <div><strong>Date:</strong> {new Date(selectedPayment?.date).toLocaleDateString()}</div>
            <div><strong>Type:</strong> <span className={`type-badge type-${selectedPayment?.type}`}>{selectedPayment?.type.toUpperCase()}</span></div>
          </div>

          <div className="detail-section">
            <div><strong>Account:</strong> {selectedPayment?.accountId?.code} - {selectedPayment?.accountId?.name}</div>
            <div><strong>Amount:</strong> <span className="amount">{parseFloat(selectedPayment?.amount).toFixed(2)}</span></div>
            <div><strong>Description:</strong> {selectedPayment?.description || '-'}</div>
          </div>

          {selectedPayment?.journalId && (
            <div className="detail-section">
              <div><strong>Journal Entry:</strong> <a href={`/journal`}>{selectedPayment?.journalId}</a></div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // List mode
  return (
    <div className="payments-container">
      <div className="payments-header">
        <h1>Payments & Receipts</h1>
        <button onClick={handleCreateNew} className="btn-primary">
          <Plus size={18} /> New Payment
        </button>
      </div>

      {error && <div className="alert alert-error">❌ {error}</div>}
      {success && <div className="alert alert-success">✅ {success}</div>}

      <div className="payments-table-wrapper">
        {loading ? (
          <p className="loading">Loading payments...</p>
        ) : payments.length === 0 ? (
          <p className="empty-state">No payments yet. Click "New Payment" to create one.</p>
        ) : (
          <table className="payments-table">
            <thead>
              <tr>
                <th>Reference</th>
                <th>Date</th>
                <th>Type</th>
                <th>Account</th>
                <th className="amount">Amount</th>
                <th>Description</th>
                <th className="actions">Action</th>
              </tr>
            </thead>
            <tbody>
              {payments.map(payment => (
                <tr key={payment._id}>
                  <td className="ref">{payment.reference}</td>
                  <td>{new Date(payment.date).toLocaleDateString()}</td>
                  <td>
                    <span className={`badge badge-${payment.type}`}>
                      {payment.type === 'payment' ? '↑ OUT' : '↓ IN'}
                    </span>
                  </td>
                  <td>{payment.accountId?.code}</td>
                  <td className="amount">{parseFloat(payment.amount).toFixed(2)}</td>
                  <td className="desc">{payment.description || '-'}</td>
                  <td className="actions">
                    <button
                      onClick={() => handleViewPayment(payment)}
                      className="btn-icon"
                      title="View"
                    >
                      <Eye size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
