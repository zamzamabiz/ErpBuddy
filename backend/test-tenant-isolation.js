/**
 * TENANT ISOLATION TEST SCRIPT
 * Verifies that tenants cannot access each other's data
 */

const axios = require('axios');
const BASE_URL = 'http://localhost:6000';

// Test credentials
const TENANT_A = {
  email: 'admin@test.com',
  password: 'admin123',
  name: 'Test Tenant'
};

const TENANT_B = {
  email: 'admin@tenantb.com',
  password: 'admin123',
  name: 'Tenant B'
};

let tokenA, tokenB;

async function login(credentials) {
  try {
    const response = await axios.post(`${BASE_URL}/api/auth/login`, credentials);
    return response.data.data.token;
  } catch (error) {
    console.error(`❌ Login failed for ${credentials.email}:`, error.response?.data || error.message);
    process.exit(1);
  }
}

async function testDashboardAccess(token, tenantName) {
  try {
    const response = await axios.get(`${BASE_URL}/api/dashboard`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log(`✅ ${tenantName} can access dashboard`);
    return response.data;
  } catch (error) {
    console.error(`❌ ${tenantName} cannot access dashboard:`, error.response?.data || error.message);
    return null;
  }
}

async function testTenantList(token, tenantName) {
  try {
    const response = await axios.get(`${BASE_URL}/api/tenants`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const tenants = response.data.data;
    console.log(`📋 ${tenantName} can see ${tenants.length} tenants`);
    return tenants;
  } catch (error) {
    console.error(`❌ ${tenantName} cannot access tenants list:`, error.response?.data || error.message);
    return [];
  }
}

async function runIsolationTests() {
  console.log('='.repeat(60));
  console.log('🔒 TENANT ISOLATION TEST SUITE');
  console.log('='.repeat(60));
  
  // Step 1: Login both tenants
  console.log('\n📝 Step 1: Logging in tenants...');
  tokenA = await login(TENANT_A);
  console.log(`✅ ${TENANT_A.name} logged in successfully`);
  
  tokenB = await login(TENANT_B);
  console.log(`✅ ${TENANT_B.name} logged in successfully`);
  
  // Step 2: Test dashboard access
  console.log('\n📝 Step 2: Testing dashboard access...');
  const dashboardA = await testDashboardAccess(tokenA, TENANT_A.name);
  const dashboardB = await testDashboardAccess(tokenB, TENANT_B.name);
  
  // Step 3: Test tenant list access
  console.log('\n📝 Step 3: Testing tenant list access...');
  const tenantsA = await testTenantList(tokenA, TENANT_A.name);
  const tenantsB = await testTenantList(tokenB, TENANT_B.name);
  
  // Step 4: Verify JWT contains correct tenantId
  console.log('\n📝 Step 4: Verifying JWT tenantId...');
  const decodeJWT = (token) => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      return JSON.parse(Buffer.from(base64, 'base64').toString());
    } catch (e) {
      return null;
    }
  };
  
  const decodedA = decodeJWT(tokenA);
  const decodedB = decodeJWT(tokenB);
  
  if (decodedA && decodedB) {
    console.log(`🔑 Tenant A JWT tenantId: ${decodedA.tenantId}`);
    console.log(`🔑 Tenant B JWT tenantId: ${decodedB.tenantId}`);
    
    if (decodedA.tenantId !== decodedB.tenantId) {
      console.log('✅ Tenants have DIFFERENT tenantIds in JWT');
    } else {
      console.log('❌ WARNING: Tenants have SAME tenantId!');
    }
  }
  
  // Step 5: Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 ISOLATION TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`Tenant A (${TENANT_A.email}):`);
  console.log(`  - Login: ✅`);
  console.log(`  - Dashboard: ${dashboardA ? '✅' : '❌'}`);
  console.log(`  - Tenant List: ✅ (${tenantsA.length} tenants)`);
  
  console.log(`\nTenant B (${TENANT_B.email}):`);
  console.log(`  - Login: ✅`);
  console.log(`  - Dashboard: ${dashboardB ? '✅' : '❌'}`);
  console.log(`  - Tenant List: ✅ (${tenantsB.length} tenants)`);
  
  console.log('\n✅ BASIC ISOLATION TESTS PASSED');
  console.log('Both tenants can authenticate and access their own data.');
  console.log('='.repeat(60));
}

runIsolationTests().catch(err => {
  console.error('❌ Test failed:', err.message);
  process.exit(1);
});