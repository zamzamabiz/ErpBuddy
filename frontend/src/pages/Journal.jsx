import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, Archive, ChevronDown, ChevronUp } from 'lucide-react';
import journalService from '../services/journalService';
import { getAccounts } from '../services/accountService';
import AccountSelector from '../modules/accounts/components/AccountSelector';
import './Journal.css';

export default function Journal() {
  const navigate = useNavigate();
  // State for form
  const [formMode, setFormMode] = useState('list'); // list, create, edit
  const [journals, setJournals] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    description: '',
    lines: [
      { accountId: '', debit: 0, credit: 0, description: '' },
      { accountId: '', debit: 0, credit: 0, description: '' }
    ]
  });

  const [selectedJournal, setSelectedJournal] = useState(null);
  const [expandedJournal, setExpandedJournal] = useState(null);

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
    loadJournals();
    loadAccounts();
  }, [navigate]);

  const loadJournals = async () => {
    try {
      setLoading(true);
      const response = await journalService.listJournals();
      setJournals(response.data || []);
      setError('');
    } catch (err) {
      const errorMsg = err.message || 'Failed to load journals';
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
    const traverse = (nodes, level = 0) => {
      nodes.forEach(node => {
        flat.push({
          _id: node._id,
          code: node.code,
          name: node.name,
          type: node.type,
          level
        });
        if (node.children?.length) traverse(node.children, level + 1);
      });
    };
    traverse(tree);
    return flat;
  };

  const calculateTotals = () => {
    const totalDebit = formData.lines.reduce((sum, line) => sum + (parseFloat(line.debit) || 0), 0);
    const totalCredit = formData.lines.reduce((sum, line) => sum + (parseFloat(line.credit) || 0), 0);
    const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01;
    return { totalDebit: totalDebit.toFixed(2), totalCredit: totalCredit.toFixed(2), isBalanced };
  };

  const handleLineChange = (index, field, value) => {
    const newLines = [...formData.lines];
    if (field === 'debit' || field === 'credit') {
      // Only allow one to be set
      if (field === 'debit' && value > 0) {
        newLines[index].credit = 0;
      } else if (field === 'credit' && value > 0) {
        newLines[index].debit = 0;
      }
    }
    // Handle accountId - can be string or object from AccountSelector
    if (field === 'accountId') {
      // If it's an object (from AccountSelector), store the full object
      // If it's a string (from old select), store as-is
      newLines[index][field] = value;
    } else {
      newLines[index][field] = value;
    }
    setFormData({ ...formData, lines: newLines });
  };

  const addLine = () => {
    setFormData({
      ...formData,
      lines: [...formData.lines, { accountId: '', debit: 0, credit: 0, description: '' }]
    });
  };

  const removeLine = (index) => {
    if (formData.lines.length > 2) {
      setFormData({
        ...formData,
        lines: formData.lines.filter((_, i) => i !== index)
      });
    }
  };

  const handleCreateNew = () => {
    setFormMode('create');
    setSelectedJournal(null);
    setFormData({
      date: new Date().toISOString().split('T')[0],
      description: '',
      lines: [
        { accountId: '', debit: 0, credit: 0, description: '' },
        { accountId: '', debit: 0, credit: 0, description: '' }
      ]
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

    if (formData.lines.length < 2) {
      setError('At least 2 lines required');
      return;
    }

    const { isBalanced } = calculateTotals();
    if (!isBalanced) {
      setError('Journal not balanced. Total Debit must equal Total Credit before posting.');
      return;
    }

    try {
      setLoading(true);
      const submitData = {
        date: formData.date,
        description: formData.description,
        lines: formData.lines.filter(line => line.accountId)
      };

      if (selectedJournal && formMode === 'edit') {
        await journalService.updateJournal(selectedJournal._id, submitData);
        setSuccess('Journal entry updated');
      } else {
        await journalService.createJournal(submitData);
        setSuccess('Journal entry created (Draft)');
      }

      setFormMode('list');
      setSelectedJournal(null);
      loadJournals();
    } catch (err) {
      setError(err.message || 'Failed to save journal');
    } finally {
      setLoading(false);
    }
  };

  const handlePostJournal = async (journalId) => {
    try {
      setLoading(true);
      await journalService.postJournal(journalId);
      setSuccess('Journal posted successfully');
      loadJournals();
    } catch (err) {
      setError(err.message || 'Failed to post journal');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteJournal = async (journalId) => {
    if (!confirmation('Are you sure?')) return;
    try {
      setLoading(true);
      await journalService.deleteJournal(journalId);
      setSuccess('Journal deleted');
      loadJournals();
    } catch (err) {
      setError(err.message || 'Failed to delete journal');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectJournal = async (journal) => {
    try {
      const response = await journalService.getJournal(journal._id);
      const fullJournal = response.data;
      if (fullJournal.status === 'draft') {
        setSelectedJournal(fullJournal);
        setFormMode('edit');
        // Convert lines to editable format
        setFormData({
          date: fullJournal.date.split('T')[0],
          description: fullJournal.description || '',
          lines: fullJournal.lines || []
        });
      } else {
        // View only mode for posted journals
        setSelectedJournal(fullJournal);
        setFormMode('view');
      }
    } catch (err) {
      setError('Failed to load journal');
    }
  };

  const { totalDebit, totalCredit, isBalanced } = calculateTotals();

  // Helper for confirmation dialog
  const confirmation = (message) => window.confirm(message);

  if (formMode === 'create' || formMode === 'edit' || formMode === 'view') {
    return (
      <div className="journal-container">
        <div className="journal-header">
          <h1>{formMode === 'create' ? 'New Journal Entry' : formMode === 'edit' ? 'Edit Journal Entry' : 'View Journal Entry'}</h1>
          <button className="btn-secondary" onClick={() => setFormMode('list')}>← Back to List</button>
        </div>

        {error && <div className="alert alert-error">❌ {error}</div>}
        {success && <div className="alert alert-success">✅ {success}</div>}

        {formMode === 'view' ? (
          // View mode
          <div className="journal-view">
            <div className="view-section">
              <div><strong>Reference:</strong> {selectedJournal?.reference}</div>
              <div><strong>Date:</strong> {new Date(selectedJournal?.date).toLocaleDateString()}</div>
              <div><strong>Status:</strong> <span className={`status-badge status-${selectedJournal?.status}`}>{selectedJournal?.status.toUpperCase()}</span></div>
              <div><strong>Description:</strong> {selectedJournal?.description || '-'}</div>
            </div>

            <table className="journal-table">
              <thead>
                <tr>
                  <th>Account Code</th>
                  <th>Account Name</th>
                  <th className="amount">Debit</th>
                  <th className="amount">Credit</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                {selectedJournal?.lines?.map((line, idx) => (
                  <tr key={idx}>
                    <td>{line.accountId?.code}</td>
                    <td>{line.accountId?.name}</td>
                    <td className="amount">{line.debit?.toFixed(2) || '-'}</td>
                    <td className="amount">{line.credit?.toFixed(2) || '-'}</td>
                    <td>{line.description || '-'}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="total-row">
                  <td colSpan="2"><strong>TOTAL</strong></td>
                  <td className="amount"><strong>{selectedJournal?.totalDebit?.toFixed(2)}</strong></td>
                  <td className="amount"><strong>{selectedJournal?.totalCredit?.toFixed(2)}</strong></td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        ) : (
          // Create/Edit mode
          <form onSubmit={handleFormSubmit} className="journal-form">
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
              <label>Description</label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Optional description"
              />
            </div>

            <div className="lines-section">
              <h3>Journal Lines</h3>
              <table className="journal-table">
                <thead>
                  <tr>
                    <th>Account</th>
                    <th className="amount">Debit</th>
                    <th className="amount">Credit</th>
                    <th>Description</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {formData.lines.map((line, idx) => (
                    <tr key={idx}>
                      <td className="account-selector-cell">
                        <AccountSelector
                          value={line.accountId && typeof line.accountId === 'object' ? line.accountId : 
                                 accounts.find(acc => acc._id === line.accountId)}
                          onChange={(account) => handleLineChange(idx, 'accountId', account)}
                          placeholder="Select Account"
                          disabled={formMode === 'view'}
                          label=""
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          step="0.01"
                          value={line.debit || 0}
                          onChange={(e) => handleLineChange(idx, 'debit', parseFloat(e.target.value) || 0)}
                          placeholder="0.00"
                          disabled={formMode === 'view'}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          step="0.01"
                          value={line.credit || 0}
                          onChange={(e) => handleLineChange(idx, 'credit', parseFloat(e.target.value) || 0)}
                          placeholder="0.00"
                          disabled={formMode === 'view'}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          value={line.description || ''}
                          onChange={(e) => handleLineChange(idx, 'description', e.target.value)}
                          placeholder="Optional"
                          disabled={formMode === 'view'}
                        />
                      </td>
                      <td>
                        {formMode !== 'view' && formData.lines.length > 2 && (
                          <button
                            type="button"
                            onClick={() => removeLine(idx)}
                            className="btn-danger btn-sm"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="total-row">
                    <td><strong>TOTAL</strong></td>
                    <td className="amount"><strong>{totalDebit}</strong></td>
                    <td className="amount"><strong>{totalCredit}</strong></td>
                    <td></td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>

              <div className="balance-check">
                <p>Total Debit: <strong>{totalDebit}</strong></p>
                <p>Total Credit: <strong>{totalCredit}</strong></p>
                <p className={isBalanced ? 'balanced' : 'unbalanced'}>
                  {isBalanced ? '✓ BALANCED' : '✗ NOT BALANCED'}
                </p>
              </div>

              <button type="button" onClick={addLine} className="btn-secondary">
                <Plus size={16} /> Add Line
              </button>
            </div>

            <div className="form-actions">
              <button type="button" onClick={() => setFormMode('list')} className="btn-secondary">
                Cancel
              </button>
              <button type="submit" className="btn-primary" disabled={loading || !isBalanced}>
                {loading ? 'Saving...' : 'Save Draft'}
              </button>
            </div>
          </form>
        )}
      </div>
    );
  }

  // List mode
  return (
    <div className="journal-container">
      <div className="journal-header">
        <h1>Journal Entries</h1>
        <button onClick={handleCreateNew} className="btn-primary">
          <Plus size={18} /> New Entry
        </button>
      </div>

      {error && <div className="alert alert-error">❌ {error}</div>}
      {success && <div className="alert alert-success">✅ {success}</div>}

      <div className="journal-list">
        {loading ? (
          <p>Loading journals...</p>
        ) : journals.length === 0 ? (
          <p className="empty-state">No journal entries yet. Click "New Entry" to create one.</p>
        ) : (
          journals.map(journal => (
            <div key={journal._id} className="journal-card">
              <div className="card-header" onClick={() => setExpandedJournal(expandedJournal === journal._id ? null : journal._id)}>
                <div className="header-left">
                  {expandedJournal === journal._id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  <strong>{journal.reference}</strong>
                  <span className={`status-badge status-${journal.status}`}>{journal.status.toUpperCase()}</span>
                  <span className="date">{new Date(journal.date).toLocaleDateString()}</span>
                </div>
                <div className="header-right">
                  <span className="totals">
                    Dr: {journal.totalDebit?.toFixed(2)} | Cr: {journal.totalCredit?.toFixed(2)}
                  </span>
                </div>
              </div>

              {expandedJournal === journal._id && (
                <div className="card-body">
                  <p><strong>Description:</strong> {journal.description || '-'}</p>
                  <p><strong>Created By:</strong> {journal.createdBy}</p>

                  <table className="journal-table mini">
                    <thead>
                      <tr>
                        <th>Account</th>
                        <th className="amount">Debit</th>
                        <th className="amount">Credit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {journal.lines?.map((line, idx) => (
                        <tr key={idx}>
                          <td>{line.accountId?.code || 'N/A'}</td>
                          <td className="amount">{line.debit?.toFixed(2) || '-'}</td>
                          <td className="amount">{line.credit?.toFixed(2) || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div className="card-actions">
                    <button onClick={() => handleSelectJournal(journal)} className="btn-secondary">
                      {journal.status === 'draft' ? 'Edit' : 'View'}
                    </button>
                    {journal.status === 'draft' && (
                      <>
                        <button onClick={() => handlePostJournal(journal._id)} className="btn-primary">
                          <Archive size={16} /> Post
                        </button>
                        <button onClick={() => handleDeleteJournal(journal._id)} className="btn-danger">
                          <Trash2 size={16} /> Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
