import axios from 'axios';

const API = axios.create({ baseURL: '/api/rice' });

API.interceptors.request.use((req) => {
  const token = localStorage.getItem('token');
  if (token) req.headers.Authorization = `Bearer ${token}`;
  return req;
});

// Lot endpoints
export const createLot = (data) => API.post('/lots', data);
export const getLots = (params) => API.get('/lots', { params });
export const getLotById = (id) => API.get(`/lots/${id}`);
export const reserveLot = (id, quantity) => API.post(`/lots/${id}/reserve`, { quantity });
export const confirmSale = (id, data) => API.post(`/lots/${id}/confirm-sale`, data);
export const getLotProfit = (id) => API.get(`/lots/${id}/profit`);

// Reports endpoints
export const getStockReport = () => API.get('/reports/stock');
export const getProfitLossReport = () => API.get('/reports/profit-loss');
export const getLotPerformance = () => API.get('/reports/lot-performance');
export const getDashboardReport = () => API.get('/reports/dashboard');