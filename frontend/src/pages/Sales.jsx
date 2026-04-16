import React, { useState, useEffect } from 'react';
import { createSale, postSale } from '../services/salesService';
import { getItems } from '../services/itemService';
import { getWarehouses } from '../services/warehouseService';
import AccountSelector from '../modules/accounts/components/AccountSelector';

export default function Sales() {
  // Data
  const [items, setItems] = useState([
    { itemId: '', quantity: '', price: '' }
  ]);
  const [saleId, setSaleId] = useState(null);
  const [customer, setCustomer] = useState('');
  const [customerAccount, setCustomerAccount] = useState(null);
  const [warehouseId, setWarehouseId] = useState('');
  
  // UI State
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // 'success' or 'error'
  
  // Master Data
  const [availableItems, setAvailableItems] = useState([]);
  const [availableWarehouses, setAvailableWarehouses] = useState([]);
  const [loadingMasters, setLoadingMasters] = useState(true);

  /**
   * Load master data on component mount
   */
  useEffect(() => {
    const loadMasterData = async () => {
      try {
        setLoadingMasters(true);
        
        // Fetch items and warehouses in parallel
        const [itemsData, warehousesData] = await Promise.all([
          getItems(),
          getWarehouses()
        ]);
        
        setAvailableItems(itemsData || []);
        setAvailableWarehouses(warehousesData || []);
        
        // Set first warehouse as default if available
        if (warehousesData && warehousesData.length > 0) {
          setWarehouseId(warehousesData[0]._id);
        }
      } catch (error) {
        console.error('Failed to load master data:', error);
        showMessage('Failed to load items/warehouses', 'error');
      } finally {
        setLoadingMasters(false);
      }
    };
    
    loadMasterData();
  }, []);

  /**
   * Add a new empty row to items table
   */
  const handleAddRow = () => {
    setItems([...items, { itemId: '', quantity: '', price: '' }]);
  };

  /**
   * Remove a row from items table
   */
  const handleRemoveRow = (index) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    } else {
      showMessage('At least one item row is required', 'error');
    }
  };

  /**
   * Handle item selection change
   */
  const handleItemChange = (index, itemId) => {
    const newItems = [...items];
    newItems[index].itemId = itemId;
    setItems(newItems);
  };

  /**
   * Handle quantity input change
   */
  const handleQuantityChange = (index, value) => {
    const newItems = [...items];
    newItems[index].quantity = parseFloat(value) || '';
    setItems(newItems);
  };

  /**
   * Handle price input change
   */
  const handlePriceChange = (index, value) => {
    const newItems = [...items];
    newItems[index].price = parseFloat(value) || '';
    setItems(newItems);
  };

  /**
   * Calculate grand total
   */
  const calculateGrandTotal = () => {
    return items.reduce((total, item) => {
      const lineTotal = (item.quantity || 0) * (item.price || 0);
      return total + lineTotal;
    }, 0);
  };

  /**
   * Validate form data
   */
  const validateForm = () => {
    // Validate warehouse
    if (!warehouseId || !warehouseId.trim()) {
      showMessage('Warehouse is required', 'error');
      return false;
    }
    
    // Validate customer
    if (!customer || !customer.trim()) {
      showMessage('Customer is required', 'error');
      return false;
    }

    // Validate customer account
    if (!customerAccount || !customerAccount._id) {
      showMessage('Customer Account is required', 'error');
      return false;
    }

    // Validate items
    for (let i = 0; i < items.length; i++) {
      const { itemId, quantity, price } = items[i];
      
      if (!itemId || !itemId.trim()) {
        showMessage(`Item ${i + 1}: Item is required`, 'error');
        return false;
      }
      
      if (!quantity || quantity <= 0) {
        showMessage(`Item ${i + 1}: Quantity must be greater than 0`, 'error');
        return false;
      }
      
      if (!price || price <= 0) {
        showMessage(`Item ${i + 1}: Price must be greater than 0`, 'error');
        return false;
      }
    }
    
    return true;
  };

  /**
   * Show message for brief time then clear
   */
  const showMessage = (text, type) => {
    setMessage(text);
    setMessageType(type);
    setTimeout(() => {
      setMessage('');
      setMessageType('');
    }, 4000);
  };

  /**
   * Save sales invoice (create draft)
   */
  const handleSaveSale = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const payload = {
        customer: customer.trim(),
        warehouse: warehouseId,
        items: items.map(item => ({
          item: item.itemId,
          quantity: item.quantity,
          price: item.price
        }))
      };

      const response = await createSale(payload);
      
      if (response.data && response.data._id) {
        setSaleId(response.data._id);
        showMessage(`✓ Sales invoice saved (ID: ${response.data._id})`, 'success');
      } else {
        showMessage('Sales invoice created but ID not returned', 'error');
      }
    } catch (error) {
      showMessage(
        error.message || 'Failed to save sales invoice',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  /**
   * Post sales invoice (finalize and process inventory/accounting)
   */
  const handlePostSale = async () => {
    if (!saleId) {
      showMessage('Please save the sales invoice first', 'error');
      return;
    }

    setLoading(true);
    try {
      const response = await postSale(saleId);
      showMessage(`✓ Sales invoice posted successfully!`, 'success');
      
      // Reset form after successful posting
      setTimeout(() => {
        setItems([{ itemId: '', quantity: '', price: '' }]);
        setSaleId(null);
        setCustomer('');
        setCustomerAccount(null);
        // Keep warehouseId as is (don't reset)
      }, 1500);
    } catch (error) {
      showMessage(
        error.message || 'Failed to post sales invoice',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto bg-white rounded-lg shadow p-6">
        
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Sales Invoice</h1>
          {saleId && (
            <p className="text-sm text-gray-600 mt-2">
              Invoice ID: <span className="font-mono font-semibold">{saleId}</span>
            </p>
          )}
        </div>

        {/* Message Alert */}
        {message && (
          <div
            className={`mb-4 p-4 rounded-lg font-semibold ${
              messageType === 'success'
                ? 'bg-green-100 text-green-800 border border-green-300'
                : 'bg-red-100 text-red-800 border border-red-300'
            }`}
          >
            {message}
          </div>
        )}

        {/* Warehouse & Customer Section */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {/* Warehouse Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Warehouse <span className="text-red-500">*</span>
            </label>
            <select
              value={warehouseId}
              onChange={(e) => setWarehouseId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading || loadingMasters}
            >
              <option value="">-- Select Warehouse --</option>
              {availableWarehouses.map((warehouse) => (
                <option key={warehouse._id} value={warehouse._id}>
                  {warehouse.name}
                </option>
              ))}
            </select>
          </div>

          {/* Customer Input */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Customer <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={customer}
              onChange={(e) => setCustomer(e.target.value)}
              placeholder="Enter customer name"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            />
          </div>
        </div>

        {/* Customer Account Selection */}
        <div className="mb-6">
          <AccountSelector
            label="Customer Account"
            value={customerAccount}
            onChange={setCustomerAccount}
            placeholder="Select Customer Account (Receivable)"
            type="asset"
            disabled={loading}
          />
        </div>

        {/* Items Table */}
        <div className="overflow-x-auto mb-6">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100 border-b-2 border-gray-300">
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Item</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-700">Quantity</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-700">Price</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-700">Total</th>
                <th className="px-4 py-3 text-center font-semibold text-gray-700">Action</th>
              </tr>
            </thead>
            <tbody>
              {loadingMasters ? (
                <tr>
                  <td colSpan="5" className="px-4 py-4 text-center text-gray-500">
                    Loading items...
                  </td>
                </tr>
              ) : (
                items.map((item, index) => (
                  <tr key={index} className="border-b border-gray-200 hover:bg-gray-50">
                    {/* Item Selection Dropdown */}
                    <td className="px-4 py-3">
                      <select
                        value={item.itemId}
                        onChange={(e) => handleItemChange(index, e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={loading}
                      >
                        <option value="">-- Select Item --</option>
                        {availableItems.map((availableItem) => (
                          <option key={availableItem._id} value={availableItem._id}>
                            {availableItem.name} ({availableItem.sku})
                          </option>
                        ))}
                      </select>
                    </td>

                    {/* Quantity Input */}
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => handleQuantityChange(index, e.target.value)}
                        placeholder="0"
                        min="0"
                        step="0.01"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={loading}
                      />
                    </td>

                    {/* Price Input */}
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        value={item.price}
                        onChange={(e) => handlePriceChange(index, e.target.value)}
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={loading}
                      />
                    </td>

                    {/* Total (calculated) */}
                    <td className="px-4 py-3 text-right font-semibold text-gray-900">
                      {item.quantity && item.price
                        ? (parseFloat(item.quantity) * parseFloat(item.price)).toFixed(2)
                        : '0.00'}
                    </td>

                    {/* Remove Button */}
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleRemoveRow(index)}
                        className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition disabled:opacity-50"
                        disabled={loading || items.length === 1}
                        title="Remove row"
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Grand Total */}
        <div className="mb-6 flex justify-end">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 w-64">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold text-gray-700">Grand Total:</span>
              <span className="text-2xl font-bold text-blue-600">
                {calculateGrandTotal().toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Add Row Button */}
        <button
          onClick={handleAddRow}
          className="mb-6 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition disabled:opacity-50"
          disabled={loading || loadingMasters}
        >
          + ADD ROW
        </button>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            onClick={handleSaveSale}
            className="px-6 py-3 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 transition disabled:opacity-50"
            disabled={loading || loadingMasters}
          >
            {loading ? 'Saving...' : 'SAVE SALES INVOICE'}
          </button>

          <button
            onClick={handlePostSale}
            className={`px-6 py-3 font-semibold rounded-lg transition disabled:opacity-50 ${
              saleId
                ? 'bg-purple-500 text-white hover:bg-purple-600'
                : 'bg-gray-300 text-gray-600 cursor-not-allowed'
            }`}
            disabled={loading || !saleId}
            title={saleId ? 'Post the saved sales invoice' : 'Save sales invoice first'}
          >
            {loading ? 'Posting...' : 'POST SALES INVOICE'}
          </button>
        </div>

        {/* Info Section */}
        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">📝 Usage:</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>✓ Select Warehouse (required)</li>
            <li>✓ Enter Customer Name (required)</li>
            <li>✓ Select Item from dropdown</li>
            <li>✓ Enter Quantity and Selling Price for each item</li>
            <li>✓ Grand total auto-calculates</li>
            <li>✓ Click "ADD ROW" to add more items</li>
            <li>✓ Click "SAVE SALES INVOICE" to create draft</li>
            <li>✓ Click "POST SALES INVOICE" to finalize:</li>
            <li style={{ marginLeft: '1rem' }}>• Stock reduced (qtyOut)</li>
            <li style={{ marginLeft: '1rem' }}>• COGS calculated (FIFO/LIFO)</li>
            <li style={{ marginLeft: '1rem' }}>• Revenue & AR journals created</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
