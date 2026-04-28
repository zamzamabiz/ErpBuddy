import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createLot } from '../../services/riceService';

function NewLotForm() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    lotNumber: '',
    supplierName: '',
    quantityBags: '',
    weightPerBag: 50,
    grade: 'B',
    moisture: '',
    brokenPercentage: '',
    purchaseRate: '',
    storageLocation: '',
    purchaseDate: new Date().toISOString().split('T')[0]
  });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const data = {
        ...formData,
        quantityBags: parseInt(formData.quantityBags),
        weightPerBag: parseInt(formData.weightPerBag),
        moisture: parseFloat(formData.moisture) || 0,
        brokenPercentage: parseFloat(formData.brokenPercentage) || 0,
        purchaseRate: parseFloat(formData.purchaseRate),
      };
      await createLot(data);
      navigate('/rice/lots');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create lot');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">➕ Create New Rice Lot</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Lot Number *</label>
            <input type="text" name="lotNumber" required value={formData.lotNumber} onChange={handleChange} className="w-full border rounded px-3 py-2" placeholder="RICE-001" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Supplier Name *</label>
            <input type="text" name="supplierName" required value={formData.supplierName} onChange={handleChange} className="w-full border rounded px-3 py-2" placeholder="Supplier name" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Quantity (Bags) *</label>
            <input type="number" name="quantityBags" required value={formData.quantityBags} onChange={handleChange} className="w-full border rounded px-3 py-2" placeholder="100" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Weight per Bag (kg)</label>
            <input type="number" name="weightPerBag" value={formData.weightPerBag} onChange={handleChange} className="w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Grade</label>
            <select name="grade" value={formData.grade} onChange={handleChange} className="w-full border rounded px-3 py-2">
              <option value="Premium">Premium</option>
              <option value="A">A</option>
              <option value="B">B</option>
              <option value="C">C</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Purchase Rate (₹/kg) *</label>
            <input type="number" name="purchaseRate" required value={formData.purchaseRate} onChange={handleChange} className="w-full border rounded px-3 py-2" placeholder="45" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Moisture (%)</label>
            <input type="number" step="0.1" name="moisture" value={formData.moisture} onChange={handleChange} className="w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Broken (%)</label>
            <input type="number" step="0.1" name="brokenPercentage" value={formData.brokenPercentage} onChange={handleChange} className="w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Storage Location</label>
            <input type="text" name="storageLocation" value={formData.storageLocation} onChange={handleChange} className="w-full border rounded px-3 py-2" placeholder="Warehouse A" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Purchase Date</label>
            <input type="date" name="purchaseDate" value={formData.purchaseDate} onChange={handleChange} className="w-full border rounded px-3 py-2" />
          </div>
        </div>
        
        <div className="mt-6 flex gap-3">
          <button type="submit" disabled={loading} className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 disabled:opacity-50">
            {loading ? 'Creating...' : 'Create Lot'}
          </button>
          <button type="button" onClick={() => navigate('/rice/lots')} className="bg-gray-300 px-6 py-2 rounded hover:bg-gray-400">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

export default NewLotForm;