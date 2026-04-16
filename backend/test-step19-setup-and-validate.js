/**
 * STEP 19 - Setup test data and validate stock integration
 */

const BASE_URL = 'http://localhost:5000/api';
const TEST_USER = 'user@company.local';
const TEST_PASSWORD = 'password123';

let authToken = '';
let tenantId = '';
let companyId = '';
let warehouseId = '';
let itemId = '';
let categoryId = '';

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

async function request(method, path, body = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': authToken ? `Bearer ${authToken}` : '',
      'x-tenant-id': tenantId || ''
    }
  };
  
  if (body) options.body = JSON.stringify(body);
  
  const res = await fetch(`${BASE_URL}${path}`, options);
  const data = await res.json();
  
  if (!res.ok) {
    throw new Error(`${method} ${path} failed: ${data.message || data.error}`);
  }
  
  return data;
}

async function test() {
  try {
    // 1. Login
    log('\n=== STEP 1: LOGIN ===', 'info');
    let res = await request('POST', '/auth/login', {
      email: TEST_USER,
      password: TEST_PASSWORD
    });
    
    authToken = res.data.token;
    tenantId = res.data.user.tenantId;
    log(`✅ Logged in. Tenant: ${tenantId}`, 'success');

    // 1.5 Get Company ID (Skip for now, use tenantId as fallback)
    companyId = tenantId; // Use tenant ID as company ID
    log(`✅ Using Company/Tenant: ${companyId}`, 'success');

    // 2. Create Category
    log('\n=== STEP 2: CREATE CATEGORY ===', 'info');
    res = await request('POST', '/categories', {
      name: `Test Category ${Date.now()}`,
      description: 'Test category for inventory'
    });
    categoryId = res.data._id;
    log(`✅ Category created: ${categoryId}`, 'success');

    // 3. Create Item
    log('\n=== STEP 3: CREATE ITEM ===', 'info');
    res = await request('POST', '/items', {
      name: `Test Item ${Date.now()}`,
      sku: `SKU-${Date.now()}`,
      categoryId: categoryId,
      unit: 'PCS',
      description: 'Test item for inventory',
      type: 'PRODUCT'
    });
    itemId = res.data._id;
    log(`✅ Item created: ${itemId}`, 'success');
    log(`   SKU: ${res.data.sku}`, 'info');

    // 4. Create Warehouse
    log('\n=== STEP 4: CREATE WAREHOUSE ===', 'info');
    res = await request('POST', '/warehouses', {
      name: `Test Warehouse ${Date.now()}`,
      code: `WH-${Date.now()}`,
      location: 'Test Location',
      manager: 'Test Manager',
      companyId: companyId
    });
    warehouseId = res.data._id;
    log(`✅ Warehouse created: ${warehouseId}`, 'success');

    // 5. Create Purchase with Stock
    log('\n=== STEP 5: CREATE PURCHASE (should auto-create stock) ===', 'info');
    res = await request('POST', '/purchase', {
      vendorName: 'Test Vendor',
      vendorCode: `TV-${Date.now()}`,
      items: [{
        itemId: itemId,
        quantity: 100,
        unitPrice: 500,
        batchNo: `BATCH-${Date.now()}`
      }],
      warehouseId: warehouseId,
      charges: [],
      totalAmount: 50000
    });
    
    const purchaseId = res.data.purchase._id;
    const stockCreated = res.data.stock?.entriesCreated || 0;
    
    log(`✅ Purchase created: ${purchaseId}`, 'success');
    log(`   ${stockCreated} stock entries created`, 'info');
    
    if (stockCreated === 0) {
      log(`⚠️  WARNING: No stock entries were created!`, 'warning');
    }

    // 6. Get Stock Balance
    log('\n=== STEP 6: GET STOCK BALANCE ===', 'info');
    res = await request('GET', `/inventory/stock-balance`);
    
    log(`✅ Stock records: ${res.data.count}`, 'success');
    log(`   Total value: ₹${res.data.totalValue.toFixed(2)}`, 'info');
    
    if (res.data.count > 0) {
      const item = res.data.items[0];
      log(`   First item: ${item.itemId?.name} (Qty: ${item.quantity})`, 'info');
    }

    // 7. Get Warehouse Stock
    log('\n=== STEP 7: GET WAREHOUSE STOCK ===', 'info');
    res = await request('GET', `/inventory/stock-balance/warehouse/${warehouseId}`);
    
    log(`✅ Warehouse stock records: ${res.data.itemCount}`, 'success');
    log(`   Total value: ₹${res.data.totalStockValue.toFixed(2)}`, 'info');

    // 8. Get Item Stock
    log('\n=== STEP 8: GET ITEM TOTAL STOCK ===', 'info');
    res = await request('GET', `/inventory/stock-balance/item/${itemId}`);
    
    log(`✅ Item total quantity: ${res.data.totalQuantity}`, 'success');
    log(`   Across ${res.data.totalWarehouses} warehouse(s)`, 'info');
    log(`   Total value: ₹${res.data.totalValue.toFixed(2)}`, 'info');

    // 9. Check Stock Availability
    log('\n=== STEP 9: CHECK STOCK AVAILABILITY ===', 'info');
    res = await request('POST', `/inventory/stock-balance/check-availability`, {
      itemId: itemId,
      warehouseId: warehouseId,
      quantity: 50
    });
    
    log(`✅ Availability check: ${res.data.isAvailable ? 'IN STOCK' : 'OUT OF STOCK'}`, 'success');
    log(`   Message: ${res.data.message}`, 'info');

    log('\n=== ALL TESTS COMPLETED ===', 'success');

  } catch (error) {
    log(`❌ Error: ${error.message}`, 'error');
    process.exit(1);
  }
}

test();
