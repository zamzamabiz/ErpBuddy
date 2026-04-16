/**
 * Quick diagnostic test to check inventory routes
 */

const BASE_URL = 'http://localhost:5000/api';

const TEST_USER = 'user@company.local';
const TEST_PASSWORD = 'password123';

async function test() {
  const colors = {
    info: '\x1b[34m',
    success: '\x1b[32m',
    error: '\x1b[31m',
    warning: '\x1b[33m',
    reset: '\x1b[0m'
  };

  function log(msg, type = 'info') {
    console.log(`${colors[type]}${msg}${colors.reset}`);
  }

  console.log('Starting diagnostic test...');

  try {
    // 1. Login
    log('\n[1] Logging in...', 'info');
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: TEST_USER,
        password: TEST_PASSWORD
      })
    });

    const loginData = await loginRes.json();
    const token = loginData.data?.token;
    const tenantId = loginData.data?.user?.tenantId;

    if (!token) {
      throw new Error('No token received from login');
    }

    log(`✅ Logged in. Tenant: ${tenantId}`, 'success');

    // 2. Test inventory endpoint with GET /api/inventory
    log('\n[2] Testing GET /api/inventory', 'info');
    const invRes = await fetch(`${BASE_URL}/inventory`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    log(`   Status: ${invRes.status}`, 'info');
    const invData = await invRes.text();
    log(`   Response: ${invData.substring(0, 100)}`, 'info');

    // 3. Test stock-balance endpoint with GET /api/inventory/stock-balance
    log('\n[3] Testing GET /api/inventory/stock-balance', 'info');
    const sbRes = await fetch(`${BASE_URL}/inventory/stock-balance`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    log(`   Status: ${sbRes.status}`, 'info');
    const sbData = await sbRes.text();
    log(`   Response: ${sbData.substring(0, 100)}`, 'info');

    // 4. Test warehouse stock endpoint
    log('\n[4] Testing GET /api/inventory/stock-balance/warehouse/test123', 'info');
    const wsRes = await fetch(`${BASE_URL}/inventory/stock-balance/warehouse/test123`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    log(`   Status: ${wsRes.status}`, 'info');
    const wsData = await wsRes.text();
    log(`   Response: ${wsData.substring(0, 100)}`, 'info');

    // 5. List all warehouses
    log('\n[5] Testing GET /api/warehouses', 'info');
    const whRes = await fetch(`${BASE_URL}/warehouses`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    log(`   Status: ${whRes.status}`, 'info');
    const whData = await whRes.json();
    log(`   Warehouses: ${whData.data?.length || 0}`, 'success');

  } catch (error) {
    log(`❌ Error: ${error.message}`, 'error');
  }
}

test();
