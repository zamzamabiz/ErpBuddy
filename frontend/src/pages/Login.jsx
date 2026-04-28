/**
 * ERP BUDDY - LOGIN PAGE
 * Authentication page for ERP SaaS Platform
 * 
 * @version 1.0.0
 * @author ErpBuddy Team
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Login = () => {
  // State management
  const [email, setEmail] = useState('admin@erpbuddy.com');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const navigate = useNavigate();

  // Check if already logged in - use useCallback to prevent infinite loop
  const checkAuth = useCallback(() => {
    const token = localStorage.getItem('token');
    const devMode = localStorage.getItem('devMode');
    
    if (token || devMode === 'true') {
      navigate('/dashboard');
    }
  }, [navigate]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      // Use axios with proper base URL
      const BASE_URL = window.location.hostname === 'localhost' 
        ? 'http://localhost:8000/api' 
        : '/api';
      
      const response = await axios.post(`${BASE_URL}/auth/login`, {
        email: email.trim(),
        password: password
      });
      
      const data = response.data;
      
      if (response.status === 200 && data.success) {
        // Store authentication data
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user || { email }));
        localStorage.setItem('devMode', 'false');
        
        // Redirect to dashboard using React Router
        navigate('/dashboard');
      } else {
        setError(data.error || data.message || 'Login failed. Invalid credentials.');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Unable to connect to server. Please ensure backend is running on port 8000.');
    } finally {
      setLoading(false);
    }
  };

  // DEV MODE - Skip authentication
  const handleDevMode = () => {
    // Use fixed token that matches backend auth middleware
    localStorage.setItem('token', 'dev-token');
    localStorage.setItem('devMode', 'true');
    localStorage.setItem('user', JSON.stringify({
      email: 'dev@erpbuddy.com',
      name: 'Development User',
      role: 'admin',
      tenantId: 'dev-tenant'
    }));
    navigate('/dashboard');
  };

  // Demo credentials
  const setDemoAdmin = () => {
    setEmail('admin@erpbuddy.com');
    setPassword('password123');
    setError('');
  };

  const setDemoStaff = () => {
    setEmail('staff@erpbuddy.com');
    setPassword('staff123');
    setError('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 to-blue-800">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-8">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white text-2xl font-bold">EB</span>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-800">ErpBuddy</h1>
          <p className="text-gray-500 mt-1">Enterprise Resource Planning System</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-gray-700 text-sm font-semibold mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter your email"
              disabled={loading}
              required
            />
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-semibold mb-2">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your password"
                disabled={loading}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Logging in...
              </span>
            ) : (
              'LOGIN'
            )}
          </button>
        </form>

        {/* DEV MODE Button */}
        <div className="mt-4">
          <button
            onClick={handleDevMode}
            className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded-lg transition duration-200"
          >
            🚀 DEV MODE (Skip Login)
          </button>
        </div>

        {/* Demo Credentials */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center mb-3">Demo Credentials:</p>
          <div className="flex gap-3 justify-center">
            <button
              type="button"
              onClick={setDemoAdmin}
              className="text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-1 rounded"
            >
              Admin: admin@erpbuddy.com / password123
            </button>
            <button
              type="button"
              onClick={setDemoStaff}
              className="text-xs bg-gray-50 hover:bg-gray-100 text-gray-700 px-3 py-1 rounded"
            >
              Staff: staff@erpbuddy.com / staff123
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-400">
            &copy; {new Date().getFullYear()} ErpBuddy. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;