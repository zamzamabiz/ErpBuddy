import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getLots } from '../../services/riceService';

function RiceLotsList() {
  const [lots, setLots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadLots();
  }, [filter]);

  const loadLots = async () => {
    setLoading(true);
    try {
      const params = filter !== 'all' ? { status: filter } : {};
      const res = await getLots(params);
      setLots(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const colors = {
      'in-stock': 'bg-green-100 text-green-800',
      'partial': 'bg-yellow-100 text-yellow-800',
      'sold': 'bg-gray-100 text-gray-800',
      'damaged': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100';
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">📦 Rice Inventory</h1>
        <Link to="/rice/lots/new" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
          + New Lot
        </Link>
      </div>

      <div className="flex gap-2 mb-4">
        <button onClick={() => setFilter('all')} className={`px-3 py-1 rounded ${filter === 'all' ? 'bg-green-600 text-white' : 'bg-gray-200'}`}>All</button>
        <button onClick={() => setFilter('in-stock')} className={`px-3 py-1 rounded ${filter === 'in-stock' ? 'bg-green-600 text-white' : 'bg-gray-200'}`}>In Stock</button>
        <button onClick={() => setFilter('partial')} className={`px-3 py-1 rounded ${filter === 'partial' ? 'bg-green-600 text-white' : 'bg-gray-200'}`}>Partial</button>
        <button onClick={() => setFilter('sold')} className={`px-3 py-1 rounded ${filter === 'sold' ? 'bg-green-600 text-white' : 'bg-gray-200'}`}>Sold</button>
      </div>

      {loading ? (
        <div className="text-center py-8">Loading...</div>
      ) : lots.length === 0 ? (
        <div className="text-center py-8 text-gray-500">No lots found. Create your first lot!</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {lots.map((lot) => (
            <div key={lot._id} className="bg-white rounded-lg shadow p-4">
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-lg font-semibold">{lot.lotNumber}</h3>
                <span className={`px-2 py-1 rounded text-xs ${getStatusBadge(lot.status)}`}>
                  {lot.status}
                </span>
              </div>
              <div className="space-y-1 text-sm">
                <p><span className="text-gray-500">Grade:</span> {lot.grade}</p>
                <p><span className="text-gray-500">Bags:</span> {lot.quantityBags} ({lot.remainingQuantity} left)</p>
                <p><span className="text-gray-500">Weight:</span> {lot.totalWeight} kg</p>
                <p><span className="text-gray-500">Purchase Rate:</span> ₹{lot.purchaseRate}/kg</p>
                <p><span className="text-gray-500">Location:</span> {lot.storageLocation || '-'}</p>
              </div>
              <div className="mt-3 flex gap-2">
                <Link to={`/rice/lots/${lot._id}`} className="text-blue-600 text-sm hover:underline">View Details</Link>
                <Link to={`/rice/sell/${lot._id}`} className="text-green-600 text-sm hover:underline">Sell</Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default RiceLotsList;