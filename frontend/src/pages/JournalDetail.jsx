import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

function JournalDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [journal, setJournal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log("📖 Journal ID from URL:", id);

    const fetchJournalData = async () => {
      try {
        setLoading(true);
        setError(null);
        const token = localStorage.getItem("token");

        if (!token) {
          throw new Error("No authentication token found");
        }

        console.log("📖 Fetching from: http://localhost:5000/api/journal/" + id);
        const response = await fetch(`http://localhost:5000/api/journal/${id}`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          credentials: "include"
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch journal data: ${response.status}`);
        }

        const data = await response.json();
        console.log("✅ Journal data received:", data);
        setJournal(data.data || data);
      } catch (err) {
        console.error("Error fetching journal data:", err);
        setError(err.message || "Failed to load journal entry");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchJournalData();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 p-8 flex items-center justify-center">
        <div className="text-gray-600 text-lg">Loading journal entry...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 p-8 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md">
          <div className="text-red-600 text-lg font-bold mb-4">⚠️ Error: {error}</div>
          <button
            onClick={() => navigate("/")}
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!journal) {
    return (
      <div className="min-h-screen bg-gray-100 p-8 flex items-center justify-center">
        <div className="text-gray-600 text-lg">No journal entry data found</div>
      </div>
    );
  }

  // Calculate totals
  const totalDebit = (journal.lines || []).reduce((sum, line) => sum + (line.debit || 0), 0);
  const totalCredit = (journal.lines || []).reduce((sum, line) => sum + (line.credit || 0), 0);
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01;

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto bg-white p-12 rounded-lg shadow-lg">
        
        {/* Header */}
        <div className="mb-8 pb-6 border-b-2 border-gray-300">
          <h1 className="text-3xl font-bold text-gray-800">JOURNAL ENTRY</h1>
          <p className="text-gray-600 mt-1">Accounting Ledger Entry</p>
        </div>

        {/* Journal Info */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          <div>
            <div className="mb-4">
              <p className="text-gray-600 text-sm font-semibold">Journal ID</p>
              <p className="text-lg font-mono text-gray-800">{journal._id}</p>
            </div>
            <div className="mb-4">
              <p className="text-gray-600 text-sm font-semibold">Description</p>
              <p className="text-lg font-bold text-gray-800">{journal.description || "N/A"}</p>
            </div>
            <div>
              <p className="text-gray-600 text-sm font-semibold">Status</p>
              <p className={`text-lg font-bold ${journal.status === 'Posted' ? 'text-green-700' : 'text-yellow-700'}`}>
                {journal.status || "Draft"}
              </p>
            </div>
          </div>
          <div>
            <div className="mb-4">
              <p className="text-gray-600 text-sm font-semibold">Date</p>
              <p className="text-lg font-bold text-gray-800">
                {journal.date ? new Date(journal.date).toLocaleDateString() : "N/A"}
              </p>
            </div>
            <div className="mb-4">
              <p className="text-gray-600 text-sm font-semibold">Number of Lines</p>
              <p className="text-lg font-bold text-gray-800">{(journal.lines || []).length}</p>
            </div>
          </div>
        </div>

        {/* Journal Entries Table */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Journal Lines</h2>
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-200 border-2 border-gray-400">
                <th className="border border-gray-400 px-4 py-3 text-left text-gray-800 font-bold">Account</th>
                <th className="border border-gray-400 px-4 py-3 text-left text-gray-800 font-bold">Description</th>
                <th className="border border-gray-400 px-4 py-3 text-right text-gray-800 font-bold">Debit</th>
                <th className="border border-gray-400 px-4 py-3 text-right text-gray-800 font-bold">Credit</th>
              </tr>
            </thead>
            <tbody>
              {(journal.lines || []).length > 0 ? (
                journal.lines.map((line, index) => (
                  <tr key={index} className="border-b border-gray-300">
                    <td className="border border-gray-300 px-4 py-3 text-gray-800 font-mono text-sm">
                      {line.accountId}
                    </td>
                    <td className="border border-gray-300 px-4 py-3 text-gray-800">
                      {line.description || "Line " + (index + 1)}
                    </td>
                    <td className="border border-gray-300 px-4 py-3 text-right text-gray-800 font-semibold">
                      {line.debit > 0 ? line.debit.toLocaleString('en-US', { minimumFractionDigits: 2 }) : "—"}
                    </td>
                    <td className="border border-gray-300 px-4 py-3 text-right text-gray-800 font-semibold">
                      {line.credit > 0 ? line.credit.toLocaleString('en-US', { minimumFractionDigits: 2 }) : "—"}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="border border-gray-300 px-4 py-3 text-center text-gray-600">
                    No journal lines found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Totals Section */}
        <div className="flex justify-end mb-8">
          <div className="w-80">
            {/* Total Debit */}
            <div className="flex justify-between py-3 border-b-2 border-gray-400">
              <span className="text-gray-800 font-semibold">Total Debit</span>
              <span className="text-gray-800 font-bold text-lg">
                {totalDebit.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>

            {/* Total Credit */}
            <div className="flex justify-between py-3 border-b-2 border-gray-400">
              <span className="text-gray-800 font-semibold">Total Credit</span>
              <span className="text-gray-800 font-bold text-lg">
                {totalCredit.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>

            {/* Balance Status */}
            <div className="flex justify-between py-3 bg-gray-200 px-4 rounded mt-2">
              <span className="text-gray-800 font-bold">
                {isBalanced ? "✅ BALANCED" : "❌ NOT BALANCED"}
              </span>
              <span className={`text-gray-800 font-bold ${isBalanced ? 'text-green-700' : 'text-red-700'}`}>
                {isBalanced ? "OK" : "ERROR"}
              </span>
            </div>
          </div>
        </div>

        {/* Footer with Back Button */}
        <div className="mt-12 pt-6 border-t-2 border-gray-300 text-center">
          <button
            onClick={() => navigate(-1)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded transition"
          >
            ← Back to Invoice
          </button>
        </div>
      </div>
    </div>
  );
}

export default JournalDetail;
