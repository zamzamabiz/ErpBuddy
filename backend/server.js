/**
 * ERP BUDDY - BACKEND SERVER
 * Main entry point for the ERP SaaS Platform
 * 
 * @version 1.0.0
 * @author ErpBuddy Team
 */

// ============================================
// DEPENDENCIES
// ============================================
require('module-alias/register');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables - explicitly set path
dotenv.config({ path: path.join(__dirname, '.env') });

// Debug: Log the PORT value
console.log('🔍 PORT from env:', process.env.PORT);
console.log('🔍 __dirname:', __dirname);

// Local imports
const { connectDB } = require('./src/loaders/mongodb.loader');
const authRoutes = require('./src/modules/core/auth/auth.routes.simple');
const userRoutes = require('./src/modules/core/users/user.routes');
const tenantRoutes = require('./src/routes/tenant.routes');
const dashboardRoutes = require('./src/modules/dashboard/dashboard.routes');
const purchaseRoutes = require('./src/modules/business/purchase/purchase.routes');
const salesRoutes = require('./src/modules/business/sales/sales.routes');
const inventoryRoutes = require('./src/modules/inventory/inventory.routes');
const journalRoutes = require('./src/modules/finance/journal/journal.routes');
const ledgerRoutes = require('./src/modules/finance/ledger/ledger.routes');
const trialBalanceRoutes = require('./src/modules/finance/trialBalance/trialBalance.routes');
const reportsRoutes = require('./src/modules/reports/reports.routes');
const riceLotRoutes = require('./src/modules/rice/riceLot.routes');

// ============================================
// APP INITIALIZATION
// ============================================
const app = express();
const PORT = process.env.PORT || 6000;

// ============================================
// NEW MODULE ROUTES (Phase E & F) - IMPORTS ONLY
// ============================================

// Expense module routes
const expenseRoutes = require('./src/modules/finance/expense/expense.routes');

// Profit reports routes
const profitRoutes = require('./src/modules/reports/profit/profit.routes');

// ============================================
// USER MODEL IMPORT
// ============================================
// Use the centralized User model from core module
const User = require('./src/modules/core/users/user.model');

// ============================================
// MIDDLEWARE
// ============================================

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Logging middleware (disable in production for performance)
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// CORS configuration
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174'
  ],
  credentials: true,
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'x-tenant-id',
    'x-company-id',
    'x-branch-id'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  optionsSuccessStatus: 200
}));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`📝 ${req.method} ${req.url}`);
  next();
});

// ============================================
// HEALTH CHECK ENDPOINTS
// ============================================

// Basic health check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    port: PORT
  });
});

// API health check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// Test endpoint
app.get('/api/test', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API working correctly',
    timestamp: new Date().toISOString()
  });
});

// ============================================
// API ROUTES
// ============================================

// Authentication routes
app.use('/api/auth', authRoutes);

// Dev login route (development only)
if (process.env.NODE_ENV === 'development') {
  const devLoginRoutes = require('./src/modules/core/auth/devLogin.routes');
  app.use('/api/auth', devLoginRoutes);
}

// Core module routes
app.use('/api/users', userRoutes);
app.use('/api/tenants', tenantRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Business module routes
app.use('/api/purchases', purchaseRoutes);
app.use('/api/sales', salesRoutes);

// Inventory module routes
app.use('/api/inventory', inventoryRoutes);

// Finance module routes
app.use('/api/journal', journalRoutes);
app.use('/api/ledger', ledgerRoutes);
app.use('/api/trial-balance', trialBalanceRoutes);

// Reports module routes
app.use('/api/reports', reportsRoutes);

// Rice Trading module routes
app.use('/api/rice', riceLotRoutes);

// Milling module routes (Paddy → Rice conversion)
const millingRoutes = require('./src/modules/rice/milling/milling.routes');
app.use('/api/rice/milling', millingRoutes);

// Profit Engine module routes
const profitEngineRoutes = require('./src/modules/rice/profitEngine.routes');
app.use('/api/rice/profit', profitEngineRoutes);

// Rice Reports module routes
const riceReportsRoutes = require('./src/modules/rice/riceReports.routes');
app.use('/api/rice/reports', riceReportsRoutes);

// Expense module routes (Phase E)
app.use('/api/expenses', expenseRoutes);

// Profit reports routes (Phase F)
app.use('/api/profit', profitRoutes);

// ============================================
// 404 HANDLER (Route not found)
// ============================================
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    path: req.originalUrl,
    method: req.method
  });
});

// ============================================
// ERROR HANDLING MIDDLEWARE
// ============================================
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.stack);
  
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  
  res.status(statusCode).json({
    success: false,
    error: message,
    timestamp: new Date().toISOString(),
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
});

// ============================================
// DEFAULT USER CREATION (Helper function)
// ============================================
const bcrypt = require('bcrypt');

const createDefaultUsers = async () => {
  try {
    // Get the first active tenant to assign default users
    const Tenant = mongoose.models.Tenant || mongoose.model('Tenant');
    const defaultTenant = await Tenant.findOne({ isActive: true }).sort({ createdAt: 1 });
    
    if (!defaultTenant) {
      console.log('⚠️ No active tenant found. Skipping default user creation.');
      return;
    }
    
    const tenantId = defaultTenant._id;
    console.log(`📌 Assigning default users to tenant: ${defaultTenant.name} (${tenantId})`);
    
    // Check if admin user exists
    const adminExists = await User.findOne({ email: 'admin@erpbuddy.com' });
    
    if (!adminExists) {
      const hashedPassword = await bcrypt.hash('password123', 10);
      await User.create({
        email: 'admin@erpbuddy.com',
        password: hashedPassword,
        role: 'admin',
        name: 'System Administrator',
        userRole: 'admin',
        tenantId: tenantId
      });
      console.log('✅ Default admin user created: admin@erpbuddy.com / password123');
    } else {
      console.log('✅ Admin user already exists');
    }
    
    // Check if demo user exists
    const demoExists = await User.findOne({ email: 'demo@erpbuddy.com' });
    
    if (!demoExists) {
      const hashedPassword = await bcrypt.hash('demo123', 10);
      await User.create({
        email: 'demo@erpbuddy.com',
        password: hashedPassword,
        role: 'user',
        name: 'Demo User',
        userRole: 'staff',
        tenantId: tenantId
      });
      console.log('✅ Demo user created: demo@erpbuddy.com / demo123');
    }
    
    // Check if staff user exists
    const staffExists = await User.findOne({ email: 'staff@erpbuddy.com' });
    
    if (!staffExists) {
      const hashedPassword = await bcrypt.hash('staff123', 10);
      await User.create({
        email: 'staff@erpbuddy.com',
        password: hashedPassword,
        role: 'user',
        name: 'Staff User',
        userRole: 'staff',
        tenantId: tenantId
      });
      console.log('✅ Staff user created: staff@erpbuddy.com / staff123');
    }
    
  } catch (error) {
    console.log('⚠️ User creation error:', error.message);
  }
};

// ============================================
// SERVER INITIALIZATION
// ============================================
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();
    console.log('✅ MongoDB connected successfully');
    
    // Create default users (optional - comment out if not needed)
    await createDefaultUsers();
    
    // Start listening
    app.listen(PORT, () => {
      console.log('='.repeat(50));
      console.log(`🚀 ERP BUDDY SERVER RUNNING`);
      console.log('='.repeat(50));
      console.log(`📡 Port: ${PORT}`);
      console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🕐 Started at: ${new Date().toISOString()}`);
      console.log('='.repeat(50));
      console.log(`✅ Health check: http://localhost:${PORT}/health`);
      console.log(`✅ API test: http://localhost:${PORT}/api/test`);
      console.log('='.repeat(50));
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received. Closing server...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received. Closing server...');
  process.exit(0);
});

// ============================================
// START THE SERVER
// ============================================
startServer();

// Export for testing
module.exports = { app, startServer };