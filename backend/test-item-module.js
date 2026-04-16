// Item Module Comprehensive Test Suite

const BASE_URL = 'http://localhost:5000/api';
const TENANT_ID = '67a1c2b3f4e5d6c7a8b9c0d1';

// Generate unique names to avoid duplicates
const timestamp = Date.now();
const UNIQUE_CATEGORY_NAME = `Basmati Rice ${timestamp}`;
const UNIQUE_BRAND_NAME = `Guard ${timestamp}`;
const UNIQUE_ITEM_NAME = `1121 Basmati Rice ${timestamp}`;
const UNIQUE_SKU = `SKU${timestamp}`;

const headers = {
  'Content-Type': 'application/json',
  'x-tenant-id': TENANT_ID,
};

let categoryId, brandId, itemId;

async function test(testName, fn) {
  try {
    console.log(`\n${testName}`);
    await fn();
  } catch (error) {
    console.error(`✗ ${error.message}`);
  }
}

async function runTests() {
  console.log('======================================');
  console.log('  ITEM MODULE TEST SUITE');
  console.log('======================================');

  // SETUP: Create Category
  await test(`SETUP 1: Create test category (${UNIQUE_CATEGORY_NAME})`, async () => {
    const res = await fetch(`${BASE_URL}/categories`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        name: UNIQUE_CATEGORY_NAME,
        parentId: null,
      }),
    });
    const data = await res.json();
    if (res.status !== 201) {
      console.log('Response:', JSON.stringify(data));
      throw new Error(`Expected 201, got ${res.status}: ${data.error}`);
    }
    categoryId = data.data._id;
    console.log('✓ Category created:', categoryId);
  });

  // SETUP: Create Brand
  await test(`SETUP 2: Create test brand (${UNIQUE_BRAND_NAME})`, async () => {
    const res = await fetch(`${BASE_URL}/brands`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        name: UNIQUE_BRAND_NAME,
        manufacturer: 'Guard Group',
        brandType: 'PREMIUM',
      }),
    });
    const data = await res.json();
    if (res.status !== 201) {
      console.log('Response:', JSON.stringify(data));
      throw new Error(`Expected 201, got ${res.status}: ${data.error}`);
    }
    brandId = data.data._id;
    console.log('✓ Brand created:', brandId);
  });

  console.log('\n======================================');
  console.log('  ITEM CREATION TESTS');
  console.log('======================================');

  // TEST 1: Create simple item (category + unit only)
  await test('TEST 1: Create simple item (minimal fields)', async () => {
    const res = await fetch(`${BASE_URL}/items`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        name: `Simple Rice ${timestamp}`,
        sku: `SIMPLE-${timestamp}`,
        categoryId,
        unit: 'KG',
      }),
    });
    const data = await res.json();
    if (res.status !== 201) throw new Error(`Expected 201, got ${res.status}: ${data.error}`);
    console.log('✓ Status:', res.status);
    console.log('✓ Item:', data.data.name);
  });

  // TEST 2: Create item with brand and attributes
  await test('TEST 2: Create item with brand and attributes', async () => {
    const res = await fetch(`${BASE_URL}/items`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        name: UNIQUE_ITEM_NAME,
        sku: UNIQUE_SKU,
        categoryId,
        brandId,
        unit: 'KG',
        isBatchEnabled: true,
        purchasePrice: 2500,
        salePrice: 2800,
        attributes: {
          quality: 'Sortex',
          processing: 'Silky',
          damagePercent: 6,
        },
      }),
    });
    const data = await res.json();
    if (res.status !== 201) throw new Error(`Expected 201, got ${res.status}: ${data.error}`);
    itemId = data.data._id;
    console.log('✓ Status:', res.status);
    console.log('✓ Item:', data.data.name);
    console.log('✓ SKU:', data.data.sku);
  });

  // TEST 3: Create item with serial enabled
  await test('TEST 3: Create item with serial enabled', async () => {
    const res = await fetch(`${BASE_URL}/items`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        name: `Premium Basmati ${timestamp}`,
        sku: `PREMIUM-${timestamp}`,
        categoryId,
        unit: 'BAG',
        isSerialEnabled: true,
        salePrice: 3500,
      }),
    });
    const data = await res.json();
    if (res.status !== 201) {
      console.log('Response error:', data.error);
      throw new Error(`Expected 201, got ${res.status}: ${data.error}`);
    }
    console.log('✓ Status:', res.status);
    console.log('✓ Item:', data.data.name);
  });

  console.log('\n======================================');
  console.log('  RETRIEVAL TESTS');
  console.log('======================================');

  // TEST 4: Get all items
  await test('TEST 4: Get all items', async () => {
    const res = await fetch(`${BASE_URL}/items`, {
      method: 'GET',
      headers,
    });
    const data = await res.json();
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    console.log('✓ Status:', res.status);
    console.log('✓ Total items:', data.data.length);
    data.data.forEach((item) => {
      console.log(`  - ${item.name} (${item.unit})`);
    });
  });

  // TEST 5: Get item by ID
  await test('TEST 5: Get item by ID', async () => {
    const res = await fetch(`${BASE_URL}/items/${itemId}`, {
      method: 'GET',
      headers,
    });
    const data = await res.json();
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    console.log('✓ Status:', res.status);
    console.log('✓ Item:', data.data.name);
    console.log('✓ Category:', data.data.categoryId.name);
    console.log('✓ Brand:', data.data.brandId.name);
  });

  console.log('\n======================================');
  console.log('  VALIDATION TESTS');
  console.log('======================================');

  // TEST 6: Duplicate item name
  await test('TEST 6: Duplicate item name (should fail)', async () => {
    const res = await fetch(`${BASE_URL}/items`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        name: UNIQUE_ITEM_NAME,
        categoryId,
        unit: 'KG',
      }),
    });
    const data = await res.json();
    if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}`);
    console.log('✓ Status:', res.status);
    console.log('✓ Error:', data.error);
  });

  // TEST 7: Duplicate SKU
  await test('TEST 7: Duplicate SKU (should fail)', async () => {
    const res = await fetch(`${BASE_URL}/items`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        name: 'Different Name',
        sku: UNIQUE_SKU,
        categoryId,
        unit: 'KG',
      }),
    });
    const data = await res.json();
    if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}`);
    console.log('✓ Status:', res.status);
    console.log('✓ Error:', data.error);
  });

  // TEST 8: Invalid category (should fail)
  await test('TEST 8: Invalid category (should fail)', async () => {
    const res = await fetch(`${BASE_URL}/items`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        name: 'Test Item',
        categoryId: '507f1f77bcf86cd799439011',
        unit: 'KG',
      }),
    });
    const data = await res.json();
    if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}`);
    console.log('✓ Status:', res.status);
    console.log('✓ Error:', data.error);
  });

  // TEST 9: Invalid brand (should fail)
  await test('TEST 9: Invalid brand (should fail)', async () => {
    const res = await fetch(`${BASE_URL}/items`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        name: 'Test Item',
        categoryId,
        brandId: '507f1f77bcf86cd799439011',
        unit: 'KG',
      }),
    });
    const data = await res.json();
    if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}`);
    console.log('✓ Status:', res.status);
    console.log('✓ Error:', data.error);
  });

  // TEST 10: Missing required fields
  await test('TEST 10: Missing required fields (should fail)', async () => {
    const res = await fetch(`${BASE_URL}/items`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        name: 'Test Item',
        // missing categoryId and unit
      }),
    });
    const data = await res.json();
    if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}`);
    console.log('✓ Status:', res.status);
    console.log('✓ Error:', data.error);
  });

  // TEST 11: Missing tenant ID
  await test('TEST 11: Missing tenant ID (should fail)', async () => {
    const res = await fetch(`${BASE_URL}/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test Item',
        categoryId,
        unit: 'KG',
      }),
    });
    const data = await res.json();
    if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}`);
    console.log('✓ Status:', res.status);
    console.log('✓ Tenant ID validation working');
  });

  // TEST 12: Get non-existent item
  await test('TEST 12: Get non-existent item (should fail)', async () => {
    const res = await fetch(`${BASE_URL}/items/507f1f77bcf86cd799439011`, {
      method: 'GET',
      headers,
    });
    if (res.status !== 404) throw new Error(`Expected 404, got ${res.status}`);
    console.log('✓ Status:', res.status);
    console.log('✓ Not found handling works');
  });

  console.log('\n======================================');
  console.log('  MULTI-TENANT ISOLATION TEST');
  console.log('======================================');

  // TEST 13: Multi-tenant isolation - category from different tenant
  await test('TEST 13: Cross-tenant category validation', async () => {
    const differentTenantHeaders = {
      'Content-Type': 'application/json',
      'x-tenant-id': 'differentTenantId123',
    };

    const res = await fetch(`${BASE_URL}/items`, {
      method: 'POST',
      headers: differentTenantHeaders,
      body: JSON.stringify({
        name: 'Test Item',
        categoryId: categoryId, // from different tenant
        unit: 'KG',
      }),
    });
    const data = await res.json();
    if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}`);
    console.log('✓ Status:', res.status);
    console.log('✓ Error:', data.error);
    console.log('✓ Cross-tenant protection working');
  });

  console.log('\n======================================');
  console.log('  ✓ ALL TESTS COMPLETED');
  console.log('======================================');
}

runTests().catch(console.error);
