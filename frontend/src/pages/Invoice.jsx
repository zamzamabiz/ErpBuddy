import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

function Invoice() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [sale, setSale] = useState(null);
  const [journal, setJournal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Debug log
    console.log("📌 Invoice ID from URL:", id);
    console.log("📌 Is valid 24-char ObjectId:", /^[a-f0-9]{24}$/.test(id));

    const fetchSaleData = async () => {
      try {
        setLoading(true);
        setError(null);
        const token = localStorage.getItem("token");
        
        if (!token) {
          throw new Error("No authentication token found");
        }

        console.log("📌 Fetching from: http://localhost:5000/api/sales/" + id);
        const response = await fetch(`http://localhost:5000/api/sales/${id}`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          credentials: "include"
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch sale data: ${response.status}`);
        }

        const data = await response.json();
        console.log("✅ Sale data received:", data);
        const saleData = data.data || data;
        setSale(saleData);

        // Fetch journal details if journalId exists
        if (saleData.journalId) {
          console.log("📖 Fetching journal:", saleData.journalId);
          try {
            const journalResponse = await fetch(
              `http://localhost:5000/api/journal/${saleData.journalId}`,
              {
                method: "GET",
                headers: {
                  Authorization: `Bearer ${token}`,
                  "Content-Type": "application/json"
                },
                credentials: "include"
              }
            );

            if (journalResponse.ok) {
              const journalData = await journalResponse.json();
              console.log("✅ Journal data received:", journalData);
              setJournal(journalData.data || journalData);
            } else {
              console.warn("⚠️ Could not fetch journal:", journalResponse.status);
            }
          } catch (journalErr) {
            console.warn("⚠️ Journal fetch error:", journalErr.message);
          }
        }
      } catch (err) {
        console.error("Error fetching sale data:", err);
        setError(err.message || "Failed to load invoice");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchSaleData();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 p-8 flex items-center justify-center">
        <div className="text-gray-600 text-lg">Loading invoice...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 p-8 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md">
          <div className="text-red-600 text-lg font-bold mb-4">⚠️ Error: {error}</div>
          <div className="bg-gray-50 p-4 rounded mb-4 text-sm text-gray-700">
            <p className="font-mono text-xs mb-2">📌 Invoice ID: {id}</p>
            <p className="font-mono text-xs">✅ Expected: 24-character MongoDB ObjectId (a-f, 0-9)</p>
            <p className="font-mono text-xs text-gray-500 mt-2">Example: 69d73f912946fb9c3966d8bf</p>
          </div>
          <button
            onClick={() => navigate('/')}
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!sale) {
    return (
      <div className="min-h-screen bg-gray-100 p-8 flex items-center justify-center">
        <div className="text-gray-600 text-lg">No invoice data found</div>
      </div>
    );
  }

  // Calculate totals from sale data
  const subtotal = sale.totalAmount || 0;
  const tax = subtotal * 0.1; // 10% tax
  const total = subtotal + tax;

  // Get customer and items from sale data
  const customer = sale.customer || {};
  const items = sale.items || [];

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto bg-white p-12 rounded-lg shadow-lg print:shadow-none">
        
        {/* Header */}
        <div className="mb-8 pb-6 border-b-2 border-gray-300">
          <h1 className="text-3xl font-bold text-gray-800">RICE TRADING CO.</h1>
          <p className="text-gray-600 mt-1">Premium Rice Supplier</p>
          <p className="text-gray-500 text-sm mt-2">Address: 123 Business Street, Karachi, Pakistan</p>
          <p className="text-gray-500 text-sm">Phone: +92-21-1234567 | Email: info@ricetrading.com</p>
        </div>

        {/* Invoice Title */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-800">SALES INVOICE</h2>
        </div>

        {/* Invoice Details */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          <div>
            <div className="mb-4">
              <p className="text-gray-600 text-sm font-semibold">Invoice Number</p>
              <p className="text-lg font-bold text-gray-800">{sale.salesNumber || "N/A"}</p>
            </div>
            <div className="mb-4">
              <p className="text-gray-600 text-sm font-semibold">Invoice Date</p>
              <p className="text-lg font-bold text-gray-800">
                {sale.salesDate ? new Date(sale.salesDate).toLocaleDateString() : "N/A"}
              </p>
            </div>
            <div>
              <p className="text-gray-600 text-sm font-semibold">Commodity</p>
              <p className="text-lg font-bold text-gray-800">{sale.commodity || "N/A"}</p>
            </div>
          </div>
          <div>
            <div className="mb-4">
              <p className="text-gray-600 text-sm font-semibold">Bill To</p>
              <p className="text-lg font-bold text-gray-800">{sale.customer?.name || "Walk-in Customer"}</p>
              <p className="text-gray-600 text-sm mt-1">{sale.customer?.contact || ""}</p>
            </div>
            <div className="mt-4">
              <p className="text-gray-600 text-sm font-semibold">Broker</p>
              <p className="text-lg font-bold text-gray-800">{sale.broker?.name || "N/A"}</p>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="mb-8">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-200 border-2 border-gray-400">
                <th className="border border-gray-400 px-4 py-3 text-left text-gray-800 font-bold">Item Description</th>
                <th className="border border-gray-400 px-4 py-3 text-center text-gray-800 font-bold">Quantity</th>
                <th className="border border-gray-400 px-4 py-3 text-center text-gray-800 font-bold">Total KG</th>
                <th className="border border-gray-400 px-4 py-3 text-right text-gray-800 font-bold">Rate (PKR/KG)</th>
                <th className="border border-gray-400 px-4 py-3 text-right text-gray-800 font-bold">Amount</th>
              </tr>
            </thead>
            <tbody>
              {items.length > 0 ? (
                items.map((item, index) => (
                  <tr key={index} className="border-b border-gray-300">
                    <td className="border border-gray-300 px-4 py-3 text-gray-800">
                      <div>{item?.item?.name || item?.name || "Item"}</div>
                      <div className="text-sm text-gray-500 mt-1">
                        Bags: {item?.bags || "-"} | Weight/Bag: {item?.weightPerBag || "-"} kg
                      </div>
                    </td>
                    <td className="border border-gray-300 px-4 py-3 text-center text-gray-800">
                      {item?.quantity || 0}
                    </td>
                    <td className="border border-gray-300 px-4 py-3 text-center text-gray-800">
                      {(item?.quantity || 0).toLocaleString()} kg
                    </td>
                    <td className="border border-gray-300 px-4 py-3 text-right text-gray-800">
                      PKR {(item?.unitPrice || 0).toLocaleString()}
                    </td>
                    <td className="border border-gray-300 px-4 py-3 text-right text-gray-800 font-semibold">
                      PKR {(item?.totalPrice || 0).toLocaleString()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="border border-gray-300 px-4 py-3 text-center text-gray-600">
                    No items found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Total Section */}
        <div className="flex justify-end mb-8">
          <div className="w-80">
            {/* Subtotal */}
            <div className="flex justify-between py-2 border-b border-gray-300">
              <span className="text-gray-700 font-semibold">Subtotal</span>
              <span className="text-gray-800 font-semibold">PKR {subtotal.toLocaleString()}</span>
            </div>

            {/* Tax */}
            <div className="flex justify-between py-2 border-b border-gray-300">
              <span className="text-gray-700 font-semibold">Tax (10%)</span>
              <span className="text-gray-800 font-semibold">PKR {tax.toLocaleString('en-US', { maximumFractionDigits: 0 })}</span>
            </div>

            {/* Broker Commission */}
            <div className="flex justify-between py-2 border-b border-gray-300">
              <span className="text-gray-700 font-semibold">Broker Commission</span>
              <span className="text-gray-800 font-semibold">PKR {(sale.brokerCommission || 0).toLocaleString()}</span>
            </div>

            {/* Total */}
            <div className="flex justify-between py-3 bg-gray-200 px-4 rounded mt-2">
              <span className="text-gray-800 font-bold text-lg">TOTAL</span>
              <span className="text-gray-800 font-bold text-lg">PKR {total.toLocaleString('en-US', { maximumFractionDigits: 0 })}</span>
            </div>
          </div>
        </div>

        {/* Accounting Impact Section */}
        {sale.journalId && journal && (
          <div className="mb-8 p-6 bg-blue-50 border-l-4 border-blue-500 rounded">
            <h3 className="text-lg font-bold text-blue-900 mb-4">💰 Accounting Impact</h3>
            
            <div className="grid grid-cols-2 gap-6 mb-4">
              <div className="bg-white p-4 rounded border border-blue-200">
                <p className="text-gray-600 text-sm font-semibold mb-1">Journal ID</p>
                <p className="text-sm font-mono text-blue-700">{journal._id}</p>
              </div>
              <div className="bg-white p-4 rounded border border-blue-200">
                <p className="text-gray-600 text-sm font-semibold mb-1">Status</p>
                <p className="text-sm font-semibold text-green-700">{sale.status}</p>
              </div>
            </div>

            {journal.lines && journal.lines.length > 0 && (
              <div className="mb-4">
                <p className="text-gray-600 text-sm font-semibold mb-2">Journal Entries ({journal.lines.length} lines):</p>
                <table className="w-full text-sm border-collapse bg-white rounded">
                  <thead>
                    <tr className="bg-blue-100">
                      <th className="border border-blue-200 px-3 py-2 text-left font-semibold text-gray-800">Account</th>
                      <th className="border border-blue-200 px-3 py-2 text-right font-semibold text-gray-800">Debit</th>
                      <th className="border border-blue-200 px-3 py-2 text-right font-semibold text-gray-800">Credit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {journal.lines.map((line, idx) => (
                      <tr key={idx} className="border-b border-blue-100">
                        <td className="border border-blue-200 px-3 py-2 text-gray-700">{line.description}</td>
                        <td className="border border-blue-200 px-3 py-2 text-right text-gray-800 font-semibold">
                          {line.debit > 0 ? `PKR ${line.debit.toLocaleString()}` : '—'}
                        </td>
                        <td className="border border-blue-200 px-3 py-2 text-right text-gray-800 font-semibold">
                          {line.credit > 0 ? `PKR ${line.credit.toLocaleString()}` : '—'}
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-blue-50 font-bold">
                      <td className="border border-blue-200 px-3 py-2 text-gray-800">TOTAL</td>
                      <td className="border border-blue-200 px-3 py-2 text-right text-gray-800">
                        PKR {(journal.lines.reduce((sum, line) => sum + (line.debit || 0), 0)).toLocaleString()}
                      </td>
                      <td className="border border-blue-200 px-3 py-2 text-right text-gray-800">
                        PKR {(journal.lines.reduce((sum, line) => sum + (line.credit || 0), 0)).toLocaleString()}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            <div className="mt-4">
              <button
                onClick={() => navigate(`/journal/${sale.journalId}`)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded transition"
              >
                📖 View Journal Entry
              </button>
            </div>
          </div>
        )}

        {sale.journalId && !journal && (
          <div className="mb-8 p-4 bg-yellow-50 border-l-4 border-yellow-500 rounded">
            <p className="text-yellow-800 text-sm">⚠️ Journal entry linked but details not available</p>
          </div>
        )}

        {/* Rice Business Summary */}
        <div className="mt-4 text-sm text-gray-600 border-t pt-4">
          <p><strong>Total Quantity (KG):</strong> {sale.totalQuantity || (items.reduce((sum, item) => sum + (item?.quantity || 0), 0).toLocaleString())} kg</p>
        </div>

        {/* Footer */}
        <div className="mt-12 pt-6 border-t-2 border-gray-300 text-center">
          <p className="text-gray-600 text-sm">Thank you for your business!</p>
          <p className="text-gray-500 text-xs mt-2">This is a computer-generated invoice. No signature is required.</p>
        </div>
      </div>

      {/* Print Button */}
      <div className="text-center mt-6 print:hidden">
        <button
          onClick={() => window.print()}
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-6 rounded"
        >
          Print Invoice
        </button>
      </div>
    </div>
  );
}

export default Invoice;
