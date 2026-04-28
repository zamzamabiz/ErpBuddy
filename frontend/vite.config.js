/**
 * ERP BUDDY - VITE CONFIGURATION
 * Frontend build tool configuration for React + Vite
 * 
 * @version 1.0.0
 * @author ErpBuddy Team
 */

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// https://vitejs.dev/config/
export default defineConfig({
  // Plugins
  plugins: [react()],
  
  // SPA fallback for client-side routing
  appType: 'spa',
  
  // Server configuration
  server: {
    port: 5173,
    strictPort: false, // If port 5173 is taken, try next available
    host: true, // Listen on all local addresses (0.0.0.0)
    open: false, // Don't auto-open browser
    
    // CORS for development
    cors: true,
    
     // Proxy configuration for API requests
    proxy: {
      '/api': {
        target: 'http://localhost:8000',  // ✅ Changed from 6000 to 8000
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path,
        configure: (proxy, options) => {
          proxy.on('error', (err, req, res) => {
            console.log('Proxy error:', err);
          });
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log(`Proxying: ${req.method} ${req.url} -> http://localhost:8000${req.url}`);
          });
        }
      },
      '/health': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false
      }
    },
    
    // Hot Module Replacement
    hmr: {
      overlay: true,
      protocol: 'ws',
      host: 'localhost',
      port: 5173
    },
    
    // Watch options
    watch: {
      usePolling: false,
      interval: 1000
    }
  },
  
  // Build configuration
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: process.env.NODE_ENV === 'development',
    minify: 'esbuild',
    target: 'es2020',
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'redux-vendor': ['react-redux', '@reduxjs/toolkit'],
          'ui-vendor': ['lucide-react', 'recharts'],
          'xlsx-vendor': ['xlsx']
        }
      }
    },
    chunkSizeWarningLimit: 1000,
    emptyOutDir: true
  },
  
  // Preview configuration (for production testing)
  preview: {
    port: 4173,
    strictPort: false,
    host: true
  },
  
  // Resolve aliases for cleaner imports
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@pages': path.resolve(__dirname, './src/pages'),
      '@services': path.resolve(__dirname, './src/services'),
      '@modules': path.resolve(__dirname, './src/modules'),
      '@layouts': path.resolve(__dirname, './src/layouts'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@assets': path.resolve(__dirname, './src/assets'),
      '@styles': path.resolve(__dirname, './src/styles')
    }
  },
  
  // CSS configuration
  css: {
    devSourcemap: true,
    modules: {
      localsConvention: 'camelCase',
      generateScopedName: '[name]__[local]___[hash:base64:5]'
    },
    preprocessorOptions: {
      scss: {
        additionalData: `@import "@/styles/variables.scss";`
      }
    }
  },
  
  // Environment variables
  define: {
    __APP_VERSION__: JSON.stringify('1.0.0'),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString())
  },
  
  // Optimize dependencies
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'react-redux',
      '@reduxjs/toolkit',
      'axios',
      'lucide-react',
      'recharts',
      'xlsx'
    ],
    exclude: []
  },
  
  // ESBuild configuration
  esbuild: {
    logOverride: { 'this-is-undefined-in-esm': 'silent' },
    target: 'es2020',
    supported: {
      'top-level-await': true
    }
  },
  
  // Logging
  logLevel: 'info',
  
  // Clear screen on reload
  clearScreen: true
});