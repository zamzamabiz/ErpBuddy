// Brand Module Test Suite - Using Node.js fetch API

const BASE_URL = 'http://localhost:5000/api';
const TENANT_ID = '67a1c2b3f4e5d6c7a8b9c0d1';

const headers = {
  'Content-Type': 'application/json',
  'x-tenant-id': TENANT_ID,
};

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
  console.log('  BRAND MODULE TEST SUITE');
  console.log('======================================');

  let brandId;

  // TEST 1: Create first brand
  await test('TEST 1: Create first brand (Guard)', async () => {
    const res = await fetch(`${BASE_URL}/brands`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        name: 'Guard',
        manufacturer: 'Guard Group',
        brandType: 'PREMIUM',
      }),
    });
    const data = await res.json();
    console.log('✓ Status:', res.status);
    console.log('✓ Brand:', data.data.name);
    brandId = data.data._id;
  });

  // TEST 2: Create second brand
  await test('TEST 2: Create second brand (Samsung)', async () => {
    const res = await fetch(`${BASE_URL}/brands`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        name: 'Samsung',
        manufacturer: 'Samsung Electronics',
        brandType: 'IMPORTED',
      }),
    });
    const data = await res.json();
    console.log('✓ Status:', res.status);
    console.log('✓ Brand:', data.data.name);
  });

  // TEST 3: Create third brand
  await test('TEST 3: Create third brand (Local)', async () => {
    const res = await fetch(`${BASE_URL}/brands`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        name: 'LocalBrand',
        manufacturer: 'Local Company',
        brandType: 'LOCAL',
      }),
    });
    const data = await res.json();
    console.log('✓ Status:', res.status);
    console.log('✓ Brand:', data.data.name);
  });

  // TEST 4: Get all brands
  await test('TEST 4: Get all brands', async () => {
    const res = await fetch(`${BASE_URL}/brands`, {
      method: 'GET',
      headers,
    });
    const data = await res.json();
    console.log('✓ Status:', res.status);
    console.log('✓ Total:', data.data.length);
    data.data.forEach((b) => {
      console.log(`  - ${b.name} (${b.brandType})`);
    });
  });

  // TEST 5: Get brand by ID
  await test('TEST 5: Get brand by ID', async () => {
    const res = await fetch(`${BASE_URL}/brands/${brandId}`, {
      method: 'GET',
      headers,
    });
    const data = await res.json();
    console.log('✓ Status:', res.status);
    console.log('✓ Brand:', data.data.name);
  });

  // TEST 6: Duplicate name validation
  await test('TEST 6: Duplicate name (should fail with 400)', async () => {
    const res = await fetch(`${BASE_URL}/brands`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        name: 'Guard',
        manufacturer: 'Different',
      }),
    });
    const data = await res.json();
    if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}`);
    console.log('✓ Status:', res.status);
    console.log('✓ Error:', data.error);
  });

  // TEST 7: Invalid brand type
  await test('TEST 7: Invalid brand type (should fail with 400)', async () => {
    const res = await fetch(`${BASE_URL}/brands`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        name: 'TestBrand',
        brandType: 'INVALID',
      }),
    });
    const data = await res.json();
    if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}`);
    console.log('✓ Status:', res.status);
    console.log('✓ Error:', data.error);
  });

  // TEST 8: Missing tenant ID
  await test('TEST 8: Missing tenant ID (should fail with 400)', async () => {
    const res = await fetch(`${BASE_URL}/brands`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Test' }),
    });
    if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}`);
    console.log('✓ Status:', res.status);
    console.log('✓ Tenant ID validation works');
  });

  // TEST 9: Get non-existent brand
  await test('TEST 9: Get non-existent (should fail with 404)', async () => {
    const res = await fetch(`${BASE_URL}/brands/507f1f77bcf86cd799439011`, {
      method: 'GET',
      headers,
    });
    if (res.status !== 404) throw new Error(`Expected 404, got ${res.status}`);
    console.log('✓ Status:', res.status);
    console.log('✓ Not found handling works');
  });

  console.log('\n======================================');
  console.log('  ✓ ALL TESTS COMPLETED');
  console.log('======================================');
}

runTests().catch(console.error);
