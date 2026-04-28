/**
 * PM2 Ecosystem Configuration
 * Production deployment configuration for ErpBuddy ERP
 */

module.exports = {
  apps: [
    {
      name: 'erpbuddy',
      script: './server.js',
      
      // Environment variables
      env: {
        NODE_ENV: 'production',
        PORT: 8000,
        MONGODB_URI: 'mongodb://localhost:27017/erpbuddy'
      },
      
      // Development environment
      env_development: {
        NODE_ENV: 'development',
        PORT: 6000,
        MONGODB_URI: 'mongodb://localhost:27017/erpbuddy_dev'
      },
      
      // Process management
      instances: 1,
      exec_mode: 'fork', // Use 'cluster' for multi-core scaling
      
      // Error handling
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      
      // Logging
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_file: './logs/combined.log',
      time: true,
      
      // Advanced features
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      
      // Graceful shutdown
      kill_timeout: 3000,
      wait_ready: true,
      listen_timeout: 10000,
      
      // Source map support
      source_map_support: true
    }
  ]
};