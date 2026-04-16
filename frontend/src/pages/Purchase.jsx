import React, { useState, useEffect } from 'react';
import { createPurchase, postPurchase } from '../services/purchaseService';
import { getItems } from '../services/itemService';
import { getWarehouses } from '../services/warehouseService';
import AccountSelector from '../modules/accounts/components/AccountSelector';

export default function Purchase() {
  // Data
  const [items, setItems] = useState([
    { itemId: '', quantity: '', price: '' }
  ]);
  const [purchaseId, setPurchaseId] = useState(null);
  const [supplier, setSupplier] = useState('');
  const [supplierAccount, setSupplierAccount] = useState(null);
  const [expenseAccount, setExpenseAccount] = useState(null);
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
   * Get item name by ID
   */
  const getItemName = (itemId) => {
    const item = availableItems.find(i => i._id === itemId);
    return item ? item.name : 'Item';
  };

  /**
   * Get warehouse name by ID
   */
  const getWarehouseName = (id) => {
    const warehouse = availableWarehouses.find(w => w._id === id);
    return warehouse ? warehouse.name : 'Warehouse';
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
    
    // Validate supplier
    if (!supplier || !supplier.trim()) {
      showMessage('Supplier is required', 'error');
      return false;
    }

    // Validate supplier account
    if (!supplierAccount || !supplierAccount._id) {
      showMessage('Supplier Account is required', 'error');
      return false;
    }

    // Validate expense account
    if (!expenseAccount || !expenseAccount._id) {
      showMessage('Expense Account is required', 'error');
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
   * Save purchase (create draft)
   */
  const handleSavePurchase = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const payload = {
        supplier: supplier.trim(),
        warehouse: warehouseId,
        items: items.map(item => ({
          item: item.itemId,
          quantity: item.quantity,
          price: item.price
        }))
      };

      const response = await createPurchase(payload);
      
      if (response.data && response.data._id) {
        setPurchaseId(response.data._id);
        showMessage(`✓ Purchase saved (ID: ${response.data._id})`, 'success');
      } else {
        showMessage('Purchase created but ID not returned', 'error');
      }
    } catch (error) {
      showMessage(
        error.message || 'Failed to save purchase',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  /**
   * Post purchase (finalize and process inventory/accounting)
   */
  const handlePostPurchase = async () => {
    if (!purchaseId) {
      showMessage('Please save the purchase first', 'error');
      return;
    }

    setLoading(true);
    try {
      const response = await postPurchase(purchaseId);
      showMessage(`✓ Purchase posted successfully!`, 'success');
      
      // Reset form after successful posting
      setTimeout(() => {
        setItems([{ itemId: '', quantity: '', price: '' }]);
        setPurchaseId(null);
        setSupplier('');
        setSupplierAccount(null);
        setExpenseAccount(null);
        // Keep warehouseId as is (don't reset)
      }, 1500);
    } catch (error) {
      showMessage(
        error.message || 'Failed to post purchase',
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
          <h1 className="text-3xl font-bold text-gray-900">Purchase Entry</h1>
          {purchaseId && (
            <p className="text-sm text-gray-600 mt-2">
              Purchase ID: <span className="font-mono font-semibold">{purchaseId}</span>
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

        {/* Warehouse & Supplier Section */}
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

          {/* Supplier Input */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Supplier <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={supplier}
              onChange={(e) => setSupplier(e.target.value)}
              placeholder="Enter supplier name"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            />
          </div>
        </div>

        {/* Supplier Account & Expense Account Selection */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <AccountSelector
            label="Supplier Account"
            value={supplierAccount}
            onChange={setSupplierAccount}
            placeholder="Select Supplier Account (Payable)"
            type="liability"
            disabled={loading}
          />

          <AccountSelector
            label="Expense Account"
            value={expenseAccount}
            onChange={setExpenseAccount}
            placeholder="Select Expense Account"
            type="expense"
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
            onClick={handleSavePurchase}
            className="px-6 py-3 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 transition disabled:opacity-50"
            disabled={loading || loadingMasters}
          >
            {loading ? 'Saving...' : 'SAVE PURCHASE'}
          </button>

          <button
            onClick={handlePostPurchase}
            className={`px-6 py-3 font-semibold rounded-lg transition disabled:opacity-50 ${
              purchaseId
                ? 'bg-purple-500 text-white hover:bg-purple-600'
                : 'bg-gray-300 text-gray-600 cursor-not-allowed'
            }`}
            disabled={loading || !purchaseId}
            title={purchaseId ? 'Post the saved purchase' : 'Save purchase first'}
          >
            {loading ? 'Posting...' : 'POST PURCHASE'}
          </button>
        </div>

        {/* Info Section */}
        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">📝 Usage:</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>✓ Select Warehouse (required)</li>
            <li>✓ Enter Supplier Name (required)</li>
            <li>✓ Select Item from dropdown</li>
            <li>✓ Enter Quantity and Price for each item</li>
            <li>✓ Click "ADD ROW" to add more items</li>
            <li>✓ Click "SAVE PURCHASE" to create draft</li>
            <li>✓ Click "POST PURCHASE" to finalize and update inventory</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
