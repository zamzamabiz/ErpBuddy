/**
 * Script to create admin user for testing
 * Run with: node create-admin-user.js
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

async function createAdminUser() {
  console.log('🔐 Creating admin user...\n');
  
  try {
    const response = await axios.post(`${BASE_URL}/auth/register`, {
      name: 'Admin User',
      email: 'admin@demo.local',
      password: 'password123',
      tenantId: '69dd0cb31c5468a5b63511b7',
      role: 'admin'
    });
    
    console.log('✅ Admin user created successfully!');
    console.log('User:', response.data.data);
    
  } catch (error) {
    console.error('❌ Failed to create admin user:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

createAdminUser();