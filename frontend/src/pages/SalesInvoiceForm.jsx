import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function SalesInvoiceForm() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Master data
  const [customers, setCustomers] = useState([]);
  const [items, setItems] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);

  // Form state
  const [invoice, setInvoice] = useState({
    customerId: '',
    warehouseId: '',
    salesDate: new Date().toISOString().split('T')[0],
    broker: '',
    commodity: '',
    brokerCommission: 0,
    freight: 0,
    invoiceLines: [{ itemId: '', quantity: 0, unitPrice: 0 }],
    debtorAccountId: '',
    salesAccountId: '',
    commissionExpenseAccountId: '',
    brokerPayableAccountId: '',
    notes: ''
  });

  // Load master data
  useEffect(() => {
    loadMasterData();
  }, []);

  const loadMasterData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('No authentication token found');
        return;
      }

      // Fetch customers
      const customersRes = await fetch('/api/masters/customers', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (customersRes.ok) {
        const data = await customersRes.json();
        setCustomers(data.data || []);
      }

      // Fetch items
      const itemsRes = await fetch('/api/masters/items', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (itemsRes.ok) {
        const data = await itemsRes.json();
        setItems(data.data || []);
      }

      // Fetch warehouses
      const warehousesRes = await fetch('/api/masters/warehouses', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (warehousesRes.ok) {
        const data = await warehousesRes.json();
        setWarehouses(data.data || []);
      }

      // Fetch accounts
      const accountsRes = await fetch('/api/accounts', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (accountsRes.ok) {
        const data = await accountsRes.json();
        setAccounts(data.data || []);
      }
    } catch (err) {
      console.error('Error loading master data:', err);
    }
  };

  // Handlers
  const handleHeaderChange = (field, value) => {
    setInvoice(prev => ({ ...prev, [field]: value }));
  };

  const handleLineChange = (index, field, value) => {
    const newLines = [...invoice.invoiceLines];
    newLines[index][field] = value;
    
    // Auto-calculate line amount
    if (field === 'quantity' || field === 'unitPrice') {
      newLines[index].lineAmount = (newLines[index].quantity || 0) * (newLines[index].unitPrice || 0);
    }
    
    setInvoice(prev => ({ ...prev, invoiceLines: newLines }));
  };

  const addLine = () => {
    setInvoice(prev => ({
      ...prev,
      invoiceLines: [...prev.invoiceLines, { itemId: '', quantity: 0, unitPrice: 0, lineAmount: 0 }]
    }));
  };

  const removeLine = (index) => {
    setInvoice(prev => ({
      ...prev,
      invoiceLines: prev.invoiceLines.filter((_, i) => i !== index)
    }));
  };

  // Calculations
  const subtotal = invoice.invoiceLines.reduce((sum, line) => sum + (line.lineAmount || 0), 0);
  const total = subtotal + (invoice.freight || 0) + (invoice.brokerCommission || 0);

  // Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (!invoice.customerId) throw new Error('Customer is required');
      if (!invoice.warehouseId) throw new Error('Warehouse is required');
      if (invoice.invoiceLines.length === 0) throw new Error('At least one item is required');
      if (invoice.invoiceLines.some(line => !line.itemId)) throw new Error('All items must be selected');

      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token');

      const saleData = {
        customerId: invoice.customerId,
        warehouseId: invoice.warehouseId,
        salesDate: invoice.salesDate,
        broker: invoice.broker || null,
        commodity: invoice.commodity,
        brokerCommission: parseFloat(invoice.brokerCommission) || 0,
        items: invoice.invoiceLines.map(line => ({
          itemId: line.itemId,
          quantity: parseFloat(line.quantity),
          unitPrice: parseFloat(line.unitPrice),
          totalPrice: parseFloat(line.lineAmount || 0)
        })),
        totalAmount: total,
        taxAmount: 0,
        netAmount: total,
        debtorAccountId: invoice.debtorAccountId || null,
        salesAccountId: invoice.salesAccountId || null,
        customerAccountId: invoice.debtorAccountId || null,
        notes: invoice.notes
      };

      console.log('📤 Submitting sale:', saleData);

      const response = await fetch('/api/sales', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(saleData)
      });

      const result = await response.json();
      console.log('📥 Response:', result);

      if (!response.ok) {
        throw new Error(result.message || `HTTP ${response.status}`);
      }

      setSuccess(`✅ Invoice created successfully: ${result.data.salesNumber}`);
      setTimeout(() => {
        navigate(`/invoice/${result.data._id}`);
      }, 2000);
    } catch (err) {
      console.error('Error submitting form:', err);
      setError(`❌ ${err.message || 'Failed to create invoice'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Create Sales Invoice</h1>
          <p className="text-gray-600">Fill in the form to create a new sales invoice</p>
        </div>

        {/* Alerts */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-700 font-medium">{error}</p>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <p className="text-green-700 font-medium">{success}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* ─── SECTION 1: HEADER ─── */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-6 border-b pb-3">Invoice Header</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Customer */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Customer *</label>
                <select
                  value={invoice.customerId}
                  onChange={(e) => handleHeaderChange('customerId', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">-- Select Customer --</option>
                  {customers.map(customer => (
                    <option key={customer._id} value={customer._id}>
                      {customer.name} ({customer.customerCode})
                    </option>
                  ))}
                </select>
              </div>

              {/* Warehouse */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Warehouse *</label>
                <select
                  value={invoice.warehouseId}
                  onChange={(e) => handleHeaderChange('warehouseId', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">-- Select Warehouse --</option>
                  {warehouses.map(warehouse => (
                    <option key={warehouse._id} value={warehouse._id}>
                      {warehouse.name} ({warehouse.warehouseCode})
                    </option>
                  ))}
                </select>
              </div>

              {/* Invoice Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Invoice Date *</label>
                <input
                  type="date"
                  value={invoice.salesDate}
                  onChange={(e) => handleHeaderChange('salesDate', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {/* Broker */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Broker</label>
                <select
                  value={invoice.broker}
                  onChange={(e) => handleHeaderChange('broker', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- No Broker --</option>
                  {customers.map(customer => (
                    <option key={customer._id} value={customer._id}>
                      {customer.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Commodity */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Commodity</label>
                <input
                  type="text"
                  value={invoice.commodity}
                  onChange={(e) => handleHeaderChange('commodity', e.target.value)}
                  placeholder="e.g., Basmati Rice - Premium Grade"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Broker Commission */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Broker Commission</label>
                <input
                  type="number"
                  value={invoice.brokerCommission}
                  onChange={(e) => handleHeaderChange('brokerCommission', e.target.value)}
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* ─── SECTION 2: ITEMS TABLE ─── */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-6 border-b pb-3">
              <h2 className="text-xl font-bold text-gray-800">Invoice Items</h2>
              <button
                type="button"
                onClick={addLine}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
              >
                + Add Item
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100 border-b-2 border-gray-300">
                    <th className="px-4 py-3 text-left text-sm font-bold text-gray-700 w-1/3">Item</th>
                    <th className="px-4 py-3 text-right text-sm font-bold text-gray-700 w-1/6">Qty</th>
                    <th className="px-4 py-3 text-right text-sm font-bold text-gray-700 w-1/6">Rate</th>
                    <th className="px-4 py-3 text-right text-sm font-bold text-gray-700 w-1/6">Amount</th>
                    <th className="px-4 py-3 text-center text-sm font-bold text-gray-700 w-1/12">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.invoiceLines.map((line, index) => (
                    <tr key={index} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <select
                          value={line.itemId}
                          onChange={(e) => handleLineChange(index, 'itemId', e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                          required
                        >
                          <option value="">-- Select Item --</option>
                          {items.map(item => (
                            <option key={item._id} value={item._id}>
                              {item.name} ({item.itemCode})
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          value={line.quantity}
                          onChange={(e) => handleLineChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                          min="0"
                          step="0.01"
                          className="w-full px-2 py-1 border border-gray-300 rounded text-right focus:ring-1 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          value={line.unitPrice}
                          onChange={(e) => handleLineChange(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                          min="0"
                          step="0.01"
                          className="w-full px-2 py-1 border border-gray-300 rounded text-right focus:ring-1 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-gray-800">
                        {(line.lineAmount || 0).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {invoice.invoiceLines.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeLine(index)}
                            className="text-red-600 hover:text-red-800 font-bold transition"
                          >
                            ✕
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ─── SECTION 3: CHARGES ─── */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-6 border-b pb-3">Charges & Adjustments</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Freight</label>
                <input
                  type="number"
                  value={invoice.freight}
                  onChange={(e) => handleHeaderChange('freight', e.target.value)}
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* ─── SECTION 4: ACCOUNTS ─── */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-6 border-b pb-3">GL Accounts</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Debtor Account</label>
                <select
                  value={invoice.debtorAccountId}
                  onChange={(e) => handleHeaderChange('debtorAccountId', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Select Account --</option>
                  {accounts.filter(a => a.accountType === 'Asset').map(acc => (
                    <option key={acc._id} value={acc._id}>
                      {acc.accountName} ({acc.accountCode})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Sales Account</label>
                <select
                  value={invoice.salesAccountId}
                  onChange={(e) => handleHeaderChange('salesAccountId', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Select Account --</option>
                  {accounts.filter(a => a.accountType === 'Revenue').map(acc => (
                    <option key={acc._id} value={acc._id}>
                      {acc.accountName} ({acc.accountCode})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Commission Expense Account</label>
                <select
                  value={invoice.commissionExpenseAccountId}
                  onChange={(e) => handleHeaderChange('commissionExpenseAccountId', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Select Account --</option>
                  {accounts.filter(a => a.accountType === 'Expense').map(acc => (
                    <option key={acc._id} value={acc._id}>
                      {acc.accountName} ({acc.accountCode})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Broker Payable Account</label>
                <select
                  value={invoice.brokerPayableAccountId}
                  onChange={(e) => handleHeaderChange('brokerPayableAccountId', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Select Account --</option>
                  {accounts.filter(a => a.accountType === 'Liability').map(acc => (
                    <option key={acc._id} value={acc._id}>
                      {acc.accountName} ({acc.accountCode})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* ─── SECTION 5: NOTES ─── */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-6 border-b pb-3">Notes</h2>
            <textarea
              value={invoice.notes}
              onChange={(e) => handleHeaderChange('notes', e.target.value)}
              placeholder="Any additional notes or remarks..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              rows="4"
            />
          </div>

          {/* ─── SECTION 6: SUMMARY ─── */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg shadow-md p-6 border-2 border-blue-200">
            <h2 className="text-xl font-bold text-gray-800 mb-6 border-b pb-3">Invoice Summary</h2>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <p className="text-sm text-gray-600">Subtotal</p>
                <p className="text-2xl font-bold text-gray-800">{subtotal.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Freight</p>
                <p className="text-2xl font-bold text-gray-800">{parseFloat(invoice.freight || 0).toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Commission</p>
                <p className="text-2xl font-bold text-gray-800">{parseFloat(invoice.brokerCommission || 0).toFixed(2)}</p>
              </div>
              <div className="border-l-2 border-blue-300 pl-6">
                <p className="text-sm text-gray-600">TOTAL</p>
                <p className="text-3xl font-bold text-blue-600">{total.toFixed(2)}</p>
              </div>
            </div>
          </div>

          {/* ─── BUTTONS ─── */}
          <div className="flex gap-4 justify-end">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="px-6 py-3 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 transition font-medium"
            >
              CANCEL
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50"
            >
              {loading ? '⏳ SAVING...' : '✓ SAVE INVOICE'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default SalesInvoiceForm;
