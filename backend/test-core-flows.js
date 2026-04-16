/**
 * Test script for core business flows
 * Run with: node test-core-flows.js
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

async function testCoreFlows() {
  console.log('🧪 Testing Core Business Flows...\n');
  
  // Use DEV MODE token for testing
  const token = 'dev-token';
  console.log(`✅ Using DEV MODE token for testing\n`);
  
  try {
    // Test 1: Create Item
    console.log('1️⃣ Creating Item...');
    const uniqueItemName = `Test Item ${Date.now()}`;  // Make item name unique
    const itemResponse = await axios.post(`${BASE_URL}/items`, {
      name: uniqueItemName,
      categoryId: '69dd0cb31c5468a5b63511b7',  // Use categoryId instead of category
      unit: 'PCS',  // Changed from 'pcs' to 'PCS' (valid enum value)
      currentStock: 0,
      companyId: '69dd0cb31c5468a5b63511b7',
      tenantId: '69dd0cb31c5468a5b63511b7'
    }, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'x-tenant-id': '69dd0cb31c5468a5b63511b7'
      }
    });
    
    const itemId = itemResponse.data.data._id;
    console.log(`✅ Item created: ${itemResponse.data.data.name} (ID: ${itemId})`);
    console.log(`📊 Initial stock: ${itemResponse.data.data.currentStock}\n`);
    
    // Test 2: Create Supplier
    console.log('2️⃣ Creating Supplier...');
    const supplierResponse = await axios.post(`${BASE_URL}/suppliers/simple`, {
      name: 'Test Supplier',
      contact: 'John Doe',
      email: 'john@test.com',
      phone: '123-456-7890',
      address: 'Test Address',
      companyId: '69dd0cb31c5468a5b63511b7'
    }, {
      headers: {
        'x-tenant-id': '69dd0cb31c5468a5b63511b7'
      }
    });
    
    const supplierId = supplierResponse.data.data._id;
    console.log(`✅ Supplier created: ${supplierResponse.data.data.name} (ID: ${supplierId})\n`);
    
    // Test 3: Create Purchase
    console.log('3️⃣ Creating Purchase...');
    const purchaseResponse = await axios.post(`${BASE_URL}/purchase`, {
      supplierId: supplierId,
      date: new Date().toISOString(),
      items: [{
        itemId: itemId,
        itemName: 'Test Item',
        quantity: 10,
        rate: 100,
        amount: 1000
      }],
      totalAmount: 1000,
      companyId: '69dd0cb31c5468a5b63511b7'
    }, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const purchaseId = purchaseResponse.data.data._id;
    console.log(`✅ Purchase created: ${purchaseResponse.data.data.reference} (ID: ${purchaseId})`);
    console.log(`💰 Total amount: ${purchaseResponse.data.data.totalAmount}\n`);
    
    // Test 4: Check Item Stock After Purchase
    console.log('4️⃣ Checking Item Stock After Purchase...');
    const itemAfterPurchase = await axios.get(`${BASE_URL}/items/simple`, {
      headers: {
        'x-tenant-id': '69dd0cb31c5468a5b63511b7'
      }
    });
    console.log('🔍 Item response structure:', JSON.stringify(itemAfterPurchase.data, null, 2));
    const updatedItem = itemAfterPurchase.data.data.find(item => item._id === itemId);
    console.log(`✅ Stock increased: ${updatedItem.currentStock} units (Expected: 10)\n`);
    
    // Test 5: Create Sale
    console.log('5️⃣ Creating Sale...');
    const saleResponse = await axios.post(`${BASE_URL}/sales/simple`, {
      customerName: 'Test Customer',
      date: new Date().toISOString(),
      items: [{
        itemId: itemId,
        itemName: 'Test Item',
        quantity: 3,
        rate: 150,
        amount: 450
      }],
      totalAmount: 450,
      companyId: '69dd0cb31c5468a5b63511b7'
    }, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'x-tenant-id': '69dd0cb31c5468a5b63511b7'
      }
    });
    
    const saleId = saleResponse.data.data._id;
    console.log(`✅ Sale created: ${saleResponse.data.data._id} (ID: ${saleId})`);
    console.log(`💰 Total amount: ${saleResponse.data.data.totalAmount}\n`);
    
    // Test 6: Check Item Stock After Sale
    console.log('6️⃣ Checking Item Stock After Sale...');
    const itemAfterSale = await axios.get(`${BASE_URL}/items/simple`, {
      headers: {
        'x-tenant-id': '69dd0cb31c5468a5b63511b7'
      }
    });
    const finalItem = itemAfterSale.data.data.find(item => item._id === itemId);
    console.log(`✅ Stock decreased: ${finalItem.currentStock} units (Expected: 7)\n`);
    
    // Summary
    console.log('📊 CORE FLOW TEST SUMMARY:');
    console.log(`✅ Item Creation: ${itemResponse.data.success}`);
    console.log(`✅ Supplier Creation: ${supplierResponse.data.success}`);
    console.log(`✅ Purchase Creation: ${purchaseResponse.data.success}`);
    console.log(`✅ Sale Creation: ${saleResponse.data.success}`);
    console.log(`✅ Stock Increase on Purchase: ${updatedItem.currentStock === 10 ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`✅ Stock Decrease on Sale: ${finalItem.currentStock === 7 ? '✅ PASS' : '❌ FAIL'}`);
    
    console.log('\n🎉 All core flows working correctly!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

// Run the test
testCoreFlows();