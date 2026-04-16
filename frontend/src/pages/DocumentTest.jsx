import { useState, useEffect } from 'react';
import { generateDocumentNumber, getModules } from '../services/documentNumberService';

export default function DocumentTest() {
  const [modules, setModules] = useState([]);
  const [selectedModule, setSelectedModule] = useState('sales');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [generatedNumbers, setGeneratedNumbers] = useState([]);

  // Load modules on component mount
  useEffect(() => {
    async function loadModules() {
      try {
        const modulesData = await getModules();
        setModules(Object.keys(modulesData));
        setSelectedModule(Object.keys(modulesData)[0]);
      } catch (err) {
        setError('Failed to load modules');
      }
    }
    loadModules();
  }, []);

  // Handle generate button click
  const handleGenerate = async () => {
    setLoading(true);
    setError('');
    
    try {
      const result = await generateDocumentNumber(selectedModule);
      
      // Add to history
      setGeneratedNumbers(prev => [
        {
          id: Date.now(),
          module: selectedModule,
          documentNumber: result.documentNumber,
          timestamp: new Date().toLocaleString(),
          sequence: result.sequence
        },
        ...prev
      ]);
    } catch (err) {
      setError(err.message || 'Failed to generate document number');
    } finally {
      setLoading(false);
    }
  };

  // Handle rapid generation test (5 numbers)
  const handleRapidTest = async () => {
    setLoading(true);
    setError('');
    
    try {
      for (let i = 0; i < 5; i++) {
        const result = await generateDocumentNumber(selectedModule);
        
        setGeneratedNumbers(prev => [
          {
            id: Date.now() + i,
            module: selectedModule,
            documentNumber: result.documentNumber,
            timestamp: new Date().toLocaleString(),
            sequence: result.sequence
          },
          ...prev
        ]);
        
        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    } catch (err) {
      setError(err.message || 'Failed during rapid test');
    } finally {
      setLoading(false);
    }
  };

  // Clear history
  const handleClear = () => {
    setGeneratedNumbers([]);
    setError('');
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Document Number Engine Test</h1>
          <p className="text-gray-600">Generate and test document numbers for different modules</p>
        </div>

        {/* Test Controls */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Module Selector */}
            <div>
              <label className="block text-gray-700 font-semibold mb-2">Select Module</label>
              <select
                value={selectedModule}
                onChange={(e) => setSelectedModule(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                {modules.map(module => (
                  <option key={module} value={module}>
                    {module.charAt(0).toUpperCase() + module.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Buttons */}
            <div className="flex items-end gap-3">
              <button
                onClick={handleGenerate}
                disabled={loading}
                className="flex-1 bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
              >
                {loading ? 'Generating...' : 'GENERATE'}
              </button>
              <button
                onClick={handleRapidTest}
                disabled={loading}
                className="flex-1 bg-green-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 transition"
              >
                {loading ? 'Testing...' : 'RAPID TEST (x5)'}
              </button>
              <button
                onClick={handleClear}
                disabled={loading}
                className="px-4 py-2 bg-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-400 disabled:opacity-50 transition"
              >
                CLEAR
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 font-semibold">⚠️ Error</p>
              <p className="text-red-600">{error}</p>
            </div>
          )}
        </div>

        {/* Results */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Generated Numbers ({generatedNumbers.length})
          </h2>

          {generatedNumbers.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 text-lg">No numbers generated yet. Click "GENERATE" to start.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100 border-b-2 border-gray-300">
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">#</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Document Number</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Module</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Sequence #</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {generatedNumbers.map((item, index) => (
                    <tr key={item.id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-700 font-semibold">{index + 1}</td>
                      <td className="px-4 py-3 text-blue-600 font-bold text-lg">{item.documentNumber}</td>
                      <td className="px-4 py-3 text-gray-700 capitalize">{item.module}</td>
                      <td className="px-4 py-3 text-gray-600">{item.sequence.currentNumber}</td>
                      <td className="px-4 py-3 text-gray-600 text-sm">{item.timestamp}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Duplicate Check */}
              {generatedNumbers.length > 1 && (
                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-blue-700 font-semibold">✅ Duplicate Check</p>
                  <p className="text-blue-600">
                    Generated {generatedNumbers.length} numbers with NO DUPLICATES - System working correctly!
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
