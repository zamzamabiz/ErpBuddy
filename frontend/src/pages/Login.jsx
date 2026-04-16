import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Login() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: 'admin@demo.local',
          password: 'password123'  // Add password for authentication
        }),
      });

      const data = await res.json();
      console.log('🔐 Login response:', data);
      console.log('🔐 Response status:', res.status);

      if (!res.ok) {
        setError(`Login failed: ${data.message || 'Unknown error'}`);
        setLoading(false);
        return;
      }

      // Store token in localStorage
      // Backend returns token in data.data.accessToken per auth.service.js apiResponse
      const token = data.data?.accessToken || data.token;
      const user = data.data?.user || data.user;

      if (!token) {
        console.error('❌ No token in response:', data);
        setError('Authentication failed: No token received from server');
        setLoading(false);
        return;
      }

      console.log('✅ Token stored:', token.substring(0, 20) + '...');
      localStorage.setItem('token', token);

      if (user) {
        localStorage.setItem('user', JSON.stringify(user));
        console.log('✅ User stored:', user.email);
      }

      // Redirect to dashboard
      navigate('/');
    } catch (err) {
      console.error('❌ Login error:', err);
      setError(`Login failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-blue-600 to-blue-800">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-md p-8">
        <h1 className="text-3xl font-bold text-center mb-2 text-gray-800">ErpBuddy</h1>
        <p className="text-center text-gray-500 mb-8">ERP SaaS Platform</p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 text-lg"
          >
            {loading ? 'Logging in...' : 'ENTER APPLICATION'}
          </button>
        </form>
        
        <p className="text-center text-gray-500 text-sm mt-6">
          Click to enter the application
        </p>
      </div>
    </div>
  );
}

export default Login;
