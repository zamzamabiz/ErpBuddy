import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getLotById, reserveLot, confirmSale } from '../../services/riceService';

function SellLot() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [lot, setLot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    quantity: '',
    salePrice: '',
    buyerName: '',
    brokerage: '',
    transportCost: '',
    invoiceNumber: ''
  });
  const [error, setError] = useState('');

  useEffect(() => {
    // If no lot ID provided, redirect to lots list
    if (!id) {
      navigate('/rice/lots');
      return;
    }
    loadLot();
  }, [id]);

  const loadLot = async () => {
    try {
      const res = await getLotById(id);
      setLot(res.data.data);
    } catch (err) {
      setError('Lot not found');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    
    try {
      const quantity = parseInt(formData.quantity);
      const salePrice = parseFloat(formData.salePrice);
      
      // Reserve the stock
      await reserveLot(id, quantity);
      
      // Confirm the sale
      await confirmSale(id, {
        quantity,
        salePrice,
        buyerName: formData.buyerName,
        brokerage: parseFloat(formData.brokerage) || 0,
        transportCost: parseFloat(formData.transportCost) || 0,
        invoiceNumber: formData.invoiceNumber
      });
      
      navigate('/rice/lots');
    } catch (err) {
      setError(err.response?.data?.error || 'Sale failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-center py-8">Loading...</div>;
  if (error) return <div className="text-center py-8 text-red-600">{error}</div>;

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">💰 Sell from Lot: {lot?.lotNumber}</h1>

      <div className="bg-gray-100 p-4 rounded-lg mb-6">
        <h3 className="font-semibold mb-2">Lot Details</h3>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <p>Grade: {lot?.grade}</p>
          <p>Available Bags: {lot?.remainingQuantity}</p>
          <p>Available Weight: {lot?.remainingQuantity * 50} kg</p>
          <p>Purchase Rate: ₹{lot?.purchaseRate}/kg</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Quantity to Sell (bags) *</label>
            <input type="number" name="quantity" required value={formData.quantity} onChange={handleChange} className="w-full border rounded px-3 py-2" max={lot?.remainingQuantity} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Sale Price (₹/kg) *</label>
            <input type="number" step="0.01" name="salePrice" required value={formData.salePrice} onChange={handleChange} className="w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Buyer Name</label>
            <input type="text" name="buyerName" value={formData.buyerName} onChange={handleChange} className="w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Invoice Number</label>
            <input type="text" name="invoiceNumber" value={formData.invoiceNumber} onChange={handleChange} className="w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Brokerage (₹)</label>
            <input type="number" name="brokerage" value={formData.brokerage} onChange={handleChange} className="w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Transport Cost (₹)</label>
            <input type="number" name="transportCost" value={formData.transportCost} onChange={handleChange} className="w-full border rounded px-3 py-2" />
          </div>
        </div>

        {formData.quantity && formData.salePrice && (
          <div className="mt-4 p-3 bg-blue-50 rounded">
            <p className="font-semibold">Sale Preview:</p>
            <p>Revenue: ₹{(parseInt(formData.quantity) * 50 * parseFloat(formData.salePrice)).toFixed(2)}</p>
            <p>Estimated Profit: ₹{((parseInt(formData.quantity) * 50) * (parseFloat(formData.salePrice) - (lot?.totalCost / lot?.totalWeight || 0))).toFixed(2)}</p>
          </div>
        )}

        <div className="mt-6 flex gap-3">
          <button type="submit" disabled={saving} className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 disabled:opacity-50">
            {saving ? 'Processing...' : 'Confirm Sale'}
          </button>
          <button type="button" onClick={() => navigate('/rice/lots')} className="bg-gray-300 px-6 py-2 rounded hover:bg-gray-400">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

export default SellLot;