#!/usr/bin/env node

// Quick test for Journal module
const axios = require('axios');

const API = 'http://localhost:5000/api';
let authToken = '';
let tenantId = '';
let accountIds = [];

async function login() {
  try {
    const res = await axios.post(`${API}/auth/login`, {
      email: 'admin@demo.local',
      password: 'Admin@123'
    });
    authToken = res.data.token;
    tenantId = res.data.user.tenantId;
    console.log('✅ Logged in successfully');
    return true;
  } catch (err) {
    console.error('❌ Login failed:', err.response?.data?.message || err.message);
    return false;
  }
}

async function loadAccounts() {
  try {
    const res = await axios.get(`${API}/accounts`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    // Flatten tree to get all accounts
    const flat = [];
    const traverse = (nodes) => {
      nodes.forEach(node => {
        flat.push(node);
        if (node.children?.length) traverse(node.children);
      });
    };
    traverse(res.data || []);
    
    accountIds = flat.map(a => a._id).slice(0, 10);
    console.log(`✅ Loaded ${accountIds.length} accounts`);
    return true;
  } catch (err) {
    console.error('❌ Failed to load accounts:', err.response?.data?.message || err.message);
    return false;
  }
}

async function testBalancedEntry() {
  try {
    const entry = {
      date: new Date().toISOString().split('T')[0],
      description: 'Test balanced entry',
      lines: [
        { accountId: accountIds[0], debit: 1000, credit: 0, description: 'Debit line' },
        { accountId: accountIds[1], debit: 0, credit: 1000, description: 'Credit line' }
      ]
    };

    const res = await axios.post(`${API}/journal`, entry, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    console.log('✅ TEST 1: Balanced entry created successfully');
    console.log(`   Reference: ${res.data.data.reference}`);
    console.log(`   Status: ${res.data.data.status}`);
    console.log(`   Total Debit: ${res.data.data.totalDebit}, Total Credit: ${res.data.data.totalCredit}`);
    return res.data.data;
  } catch (err) {
    console.error('❌ TEST 1 FAILED:', err.response?.data?.message || err.message);
    return null;
  }
}

async function testUnbalancedEntry() {
  try {
    const entry = {
      date: new Date().toISOString().split('T')[0],
      description: 'Test unbalanced entry (should fail)',
      lines: [
        { accountId: accountIds[2], debit: 1000, credit: 0, description: 'Debit line' },
        { accountId: accountIds[3], debit: 0, credit: 500, description: 'Credit line (unbalanced)' }
      ]
    };

    await axios.post(`${API}/journal`, entry, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    console.log('❌ TEST 2 FAILED: Unbalanced entry should have been rejected');
    return null;
  } catch (err) {
    if (err.response?.data?.message?.includes('balanced')) {
      console.log('✅ TEST 2: Unbalanced entry correctly rejected');
      console.log(`   Message: ${err.response.data.message}`);
      return true;
    } else {
      console.error('❌ TEST 2 FAILED: Wrong error:', err.response?.data?.message || err.message);
      return null;
    }
  }
}

async function testPostJournal(journalId) {
  try {
    const res = await axios.post(`${API}/journal/${journalId}/post`, {}, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    console.log('✅ TEST 3: Journal posted successfully');
    console.log(`   Status changed to: ${res.data.data.status}`);
    return true;
  } catch (err) {
    console.error('❌ TEST 3 FAILED:', err.response?.data?.message || err.message);
    return null;
  }
}

async function testListJournals() {
  try {
    const res = await axios.get(`${API}/journal`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    console.log(`✅ TEST 4: Listed journals successfully`);
    console.log(`   Total entries: ${res.data.data.length}`);
    if (res.data.data.length > 0) {
      console.log(`   Latest: ${res.data.data[0].reference} (${res.data.data[0].status})`);
    }
    return true;
  } catch (err) {
    console.error('❌ TEST 4 FAILED:', err.response?.data?.message || err.message);
    return null;
  }
}

async function runTests() {
  console.log('='.repeat(50));
  console.log('JOURNAL MODULE TEST SUITE');
  console.log('='.repeat(50));

  if (!await login()) return;
  if (!await loadAccounts()) return;

  console.log('\n--- Running Tests ---\n');

  const journal = await testBalancedEntry();
  if (!journal) return;

  await testUnbalancedEntry();
  await testPostJournal(journal._id);
  await testListJournals();

  console.log('\n' + '='.repeat(50));
  console.log('ALL TESTS COMPLETED');
  console.log('='.repeat(50));

  process.exit(0);
}

runTests().catch(err => {
  console.error('Test suite error:', err.message);
  process.exit(1);
});
