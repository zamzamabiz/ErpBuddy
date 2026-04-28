 Lot API Automated Test Script
 * 
 * Run with: node backend/tests/riceLot.test.js
 * 
 * This script tests the complete Rice Lot API workflow:
 * 1. Create tenant
 * 2. Create rice lot
 * 3. Get all lots
 * 4. Sell from lot
 * 5. Get profit summary
 * 6. Get inventory value
 * 7. Get available lots
 * 8. Clean up
 */

// Check for axios dependency
let axios;
try {
  axios = require('axios');
} catch (error) {
  console.log('\x1b[31m%s\x1b[0m', '❌ ERROR: axios is not installed.');
  console.log('\x1b[33m%s\x1b[0m', '📦 Please install it with: npm install axios');
  process.exit(1);
}

// Configuration
const BASE_URL = process.env.API_URL || 'http://localhost:5005';
const API_PREFIX = '/api';

// Test state
let testResults = { passed: 0, failed: 0, total: 0 };
let tenantId = null;
let lotId = null;

// Color helpers
const green = (text) => `\x1b[32m${text}\x1b[0m`;
const red = (text) => `\x1b[31m${text}\x1b[0m`;
const yellow = (text) => `\x1b[33m${text}\x1b[0m`;
const blue = (text) => `\x1b[34m${text}\x1b[0m`;

// Test helper function
async function runTest(name, testFn) {
  testResults.total++;
  try {
    await testFn();
    testResults.passed++;
    console.log(green(`✅ PASS: ${name}`));
    return true;
  } catch (error) {
    testResults.failed++;
    console.log(red(`❌ FAIL: ${name}`));
    console.log(red(`   Error: ${error.message}`));
    throw error; // Stop on first error
  }
}

// Main test function
async function runTests() {
  console.log('\n');
  console.log(blue('═══════════════════════════════════════════════════════════'));
  console.log(blue('           RICE LOT API AUTOMATED TEST SUITE'));
  console.log(blue('═══════════════════════════════════════════════════════════'));
  console.log(blue(`Base URL: ${BASE_URL}`));
  console.log(blue('═══════════════════════════════════════════════════════════'));
  console.log('\n');

  try {
    // Test 1: Create a tenant
    await runTest('Create Tenant', async () => {
      const response = await axios.post(`${BASE_URL}${API_PREFIX}/tenants`, {
        name: 'Test Tenant',
        companyName: 'Test Company',
        email: `test-${Date.now()}@example.com`,
        phone: '1234567890',
        address: 'Test Address'
      });

      if (!response.data.success) {
        throw new Error('Tenant creation failed');
      }

      tenantId = response.data.data._id;
      console.log(`   Tenant ID: ${tenantId}`);
    });

    // Test 2: Create a rice lot
    await runTest('Create Rice Lot', async () => {
      const response = await axios.post(
        `${BASE_URL}${API_PREFIX}/rice-lots`,
        {
          lotNumber: `LOT-${Date.now()}`,
          supplier: 'Test Supplier',
          purchaseDate: new Date().toISOString(),
          purchasePricePerTon: 500,
          quantityTons: 100,
          storageLocation: 'Warehouse A',
          quality: 'Premium',
          moisture: 14,
          notes: 'Test lot'
        },
        {
          headers: {
            'x-tenant-id': tenantId,
            'Authorization': 'Bearer test-token' // Would need real token in production
          }
        }
      );

      if (!response.data.success) {
        throw new Error('Rice lot creation failed');
      }

      lotId = response.data.data._id;
      console.log(`   Lot ID: ${lotId}`);
      console.log(`   Lot Number: ${response.data.data.lotNumber}`);
    });

    // Test 3: Get all lots
    await runTest('Get All Lots', async () => {
      const response = await axios.get(`${BASE_URL}${API_PREFIX}/rice-lots`, {
        headers: {
          'x-tenant-id': tenantId,
          'Authorization': 'Bearer test-token'
        }
      });

      if (!response.data.success) {
        throw new Error('Get all lots failed');
      }

      console.log(`   Total lots: ${response.data.data.length}`);
      console.log(`   Pagination: Page ${response.data.pagination.page} of ${response.data.pagination.pages}`);
    });

    // Test 4: Get available lots
    await runTest('Get Available Lots', async () => {
      const response = await axios.get(`${BASE_URL}${API_PREFIX}/rice-lots/available`, {
        headers: {
          'x-tenant-id': tenantId,
          'Authorization': 'Bearer test-token'
        }
      });

      if (!response.data.success) {
        throw new Error('Get available lots failed');
      }

      console.log(`   Available lots: ${response.data.count}`);
    });

    // Test 5: Get inventory value
    await runTest('Get Inventory Value', async () => {
      const response = await axios.get(`${BASE_URL}${API_PREFIX}/rice-lots/inventory-value`, {
        headers: {
          'x-tenant-id': tenantId,
          'Authorization': 'Bearer test-token'
        }
      });

      if (!response.data.success) {
        throw new Error('Get inventory value failed');
      }

      console.log(`   Total inventory value: $${response.data.data.totalValue.toFixed(2)}`);
    });

    // Test 6: Sell from lot
    await runTest('Sell From Lot', async () => {
      const response = await axios.post(
        `${BASE_URL}${API_PREFIX}/rice-lots/${lotId}/sell`,
        {
          quantitySold: 25,
          sellingPricePerTon: 600
        },
        {
          headers: {
            'x-tenant-id': tenantId,
            'Authorization': 'Bearer test-token'
          }
        }
      );

      if (!response.data.success) {
        throw new Error('Sell from lot failed');
      }

      console.log(`   Quantity sold: ${response.data.data.saleDetails.quantitySold} tons`);
      console.log(`   Revenue: $${response.data.data.saleDetails.revenue.toFixed(2)}`);
      console.log(`   Profit: $${response.data.data.saleDetails.profit.toFixed(2)}`);
      console.log(`   Remaining quantity: ${response.data.data.saleDetails.remainingQuantity} tons`);
    });

    // Test 7: Get profit summary
    await runTest('Get Profit Summary', async () => {
      const response = await axios.get(`${BASE_URL}${API_PREFIX}/rice-lots/profit-summary`, {
        params: {
          startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          endDate: new Date().toISOString()
        },
        headers: {
          'x-tenant-id': tenantId,
          'Authorization': 'Bearer test-token'
        }
      });

      if (!response.data.success) {
        throw new Error('Get profit summary failed');
      }

      console.log(`   Total quantity: ${response.data.data.totalQuantity} tons`);
      console.log(`   Total sold: ${response.data.data.totalSold} tons`);
      console.log(`   Total cost: $${response.data.data.totalCost.toFixed(2)}`);
      console.log(`   Remaining value: $${response.data.data.totalRemainingValue.toFixed(2)}`);
    });

    // Test 8: Get single lot by ID
    await runTest('Get Lot By ID', async () => {
      const response = await axios.get(`${BASE_URL}${API_PREFIX}/rice-lots/${lotId}`, {
        headers: {
          'x-tenant-id': tenantId,
          'Authorization': 'Bearer test-token'
        }
      });

      if (!response.data.success) {
        throw new Error('Get lot by ID failed');
      }

      console.log(`   Lot number: ${response.data.data.lotNumber}`);
      console.log(`   Status: ${response.data.data.status}`);
      console.log(`   Remaining: ${response.data.data.remainingQuantity} tons`);
    });

    // Test 9: Update lot
    await runTest('Update Lot', async () => {
      const response = await axios.put(
        `${BASE_URL}${API_PREFIX}/rice-lots/${lotId}`,
        {
          notes: 'Updated test notes',
          storageLocation: 'Warehouse B'
        },
        {
          headers: {
            'x-tenant-id': tenantId,
            'Authorization': 'Bearer test-token'
          }
        }
      );

      if (!response.data.success) {
        throw new Error('Update lot failed');
      }

      console.log(`   Updated storage: ${response.data.data.storageLocation}`);
    });

    // Test 10: Delete lot (cleanup)
    await runTest('Delete Lot (Cleanup)', async () => {
      const response = await axios.delete(`${BASE_URL}${API_PREFIX}/rice-lots/${lotId}`, {
        headers: {
          'x-tenant-id': tenantId,
          'Authorization': 'Bearer test-token'
        }
      });

      if (!response.data.success) {
        throw new Error('Delete lot failed');
      }

      console.log(`   ${response.data.message}`);
    });

  } catch (error) {
    // Test stopped on first error
    console.log('\n');
    console.log(red('═══════════════════════════════════════════════════════════'));
    console.log(red('TEST SUITE STOPPED - First failure encountered'));
    console.log(red('═══════════════════════════════════════════════════════════'));
  }

  // Print summary
  console.log('\n');
  console.log(blue('═══════════════════════════════════════════════════════════'));
  console.log(blue('                        TEST SUMMARY'));
  console.log(blue('═══════════════════════════════════════════════════════════'));

  const passRate = testResults.total > 0 ? ((testResults.passed / testResults.total) * 100).toFixed(1) : 0;

  console.log(blue(`Total Tests: ${testResults.total}`));
  console.log(green(`Passed: ${testResults.passed}`));
  console.log(red(`Failed: ${testResults.failed}`));
  console.log(yellow(`Pass Rate: ${passRate}%`));

  console.log(blue('═══════════════════════════════════════════════════════════'));

  if (testResults.failed === 0) {
    console.log(green('🎉 All tests passed!'));
  } else {
    console.log(red('⚠️  Some tests failed. Check the output above for details.'));
  }

  console.log('\n');
}

// Run the tests
runTests().then(() => {
  process.exit(testResults.failed > 0 ? 1 : 0);
}).catch(error => {
  console.error(red('Unexpected error:'), error);
  process.exit(1);
});