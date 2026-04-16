/**
 * Debug require chain
 */
console.log('Testing require chain...');

try {
  console.log('1. Requiring purchase.service...');
  const purchaseService = require('./src/modules/business/purchase/purchase.service');
  console.log('✅ purchase.service loaded');
  console.log('   Methods:', Object.keys(purchaseService));
} catch (error) {
  console.error('❌ Error loading purchase.service:', error.message);
  console.error(error.stack);
}

try {
  console.log('\n2. Requiring journal.service...');
  const journalService = require('./src/modules/finance/journal/journal.service');
  console.log('✅ journal.service loaded');
} catch (error) {
  console.error('❌ Error loading journal.service:', error.message);
  console.error(error.stack);
}

try {
  console.log('\n3. Requiring account-init.service...');
  const accountInitService = require('./src/modules/accounting/accounts/account-init.service');
  console.log('✅ account-init.service loaded');
} catch (error) {
  console.error('❌ Error loading account-init.service:', error.message);
  console.error(error.stack);
}

console.log('\n✅ All services loaded successfully');
