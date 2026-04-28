/**
 * 📊 REPORT SERVICE
 * ========================
 * Handles all API calls for financial reports
 */

import axios from 'axios';

const API_BASE = '/api/reports';

/**
 * 🔷 GET GENERAL LEDGER
 * Fetch ledger for a specific account
 */
export const getLedger = async (accountId, filters = {}) => {
  try {
    const token = localStorage.getItem('token');
    const params = new URLSearchParams();
    
    if (filters.fromDate) params.append('fromDate', filters.fromDate);
    if (filters.toDate) params.append('toDate', filters.toDate);
    if (filters.includeOpening) params.append('includeOpening', filters.includeOpening);

    const headers = {
      'Content-Type': 'application/json'
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await axios.get(
      `${API_BASE}/ledger/${accountId}?${params.toString()}`,
      { headers }
    );

    return response.data;
  } catch (error) {
    console.error('❌ getLedger Error:', error.message);
    throw error;
  }
};

/**
 * 🔷 GET TRIAL BALANCE
 * Fetch trial balance with optional grouping
 */
export const getTrialBalance = async (filters = {}) => {
  try {
    const token = localStorage.getItem('token');
    const params = new URLSearchParams();
    
    if (filters.fromDate) params.append('fromDate', filters.fromDate);
    if (filters.toDate) params.append('toDate', filters.toDate);
    if (filters.byType) params.append('byType', filters.byType);

    const headers = {
      'Content-Type': 'application/json'
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await axios.get(
      `${API_BASE}/trial-balance?${params.toString()}`,
      { headers }
    );

    return response.data;
  } catch (error) {
    console.error('❌ getTrialBalance Error:', error.message);
    throw error;
  }
};

/**
 * 🔷 GET FINANCIAL SUMMARY
 * Fetch quick financial overview
 */
export const getSummary = async (filters = {}) => {
  try {
    const token = localStorage.getItem('token');
    const params = new URLSearchParams();
    
    if (filters.fromDate) params.append('fromDate', filters.fromDate);
    if (filters.toDate) params.append('toDate', filters.toDate);

    const headers = {
      'Content-Type': 'application/json'
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await axios.get(
      `${API_BASE}/summary?${params.toString()}`,
      { headers }
    );

    return response.data;
  } catch (error) {
    console.error('❌ getSummary Error:', error.message);
    throw error;
  }
};
