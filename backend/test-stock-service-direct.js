/**
 * Direct test of stock balance service (no HTTP)
 */

require('module-alias/register');
require('./src/loaders/mongodb.loader').connectDB();

const StockBalance = require('./src/modules/inventory/stockBalance/stockBalance.model');
const stockBalanceService = require('./src/modules/inventory/stockBalance/stockBalance.service');

async function test() {
  const colors = {
    success: '\x1b[32m',
    error: '\x1b[31m',
    info: '\x1b[34m',
    reset: '\x1b[0m'
  };

  function log(msg, type = 'info') {
    console.log(`${colors[type]}${msg}${colors.reset}`);
  }

  try {
    log('\n=== STOCK BALANCE SERVICE TEST ===', 'info');

    // Test data
    const tenantId = '69dd0cb31c5468a5b63511b7'; // Use the known tenant from login
    const itemId = '69dd54fc27e2c1a48ebc0b8c'; // Use the created item ID
    const warehouseId = '69dd54fd27e2c1a48ebc0b8f'; // Use a test warehouse ID
    const quantity = 100;
    const costPrice = 500;

    log('\n[TEST 1] Increase Stock', 'info');
    const result = await stockBalanceService.increaseStock(
      tenantId,
      itemId,
      warehouseId,
      quantity,
      costPrice,
      'BATCH-001'
    );

    log(`✅ Stock increased:`, 'success');
    log(`   Quantity: ${result.quantity}`, 'info');
    log(`   Cost Price: ${result.costPrice}`, 'info');
    log(`   Total Value: ${result.totalCostValue}`, 'info');

    log('\n[TEST 2] Get All Stock', 'info');
    const allStock = await StockBalance.find({ tenantId });
    log(`✅ Found ${allStock.length} stock records`, 'success');

    log('\n[TEST 3] Get Item Total Stock', 'info');
    const itemTotal = await stockBalanceService.getItemTotalStock(tenantId, itemId);
    log(`✅ Item total quantity: ${itemTotal.totalQuantity}`, 'success');

    log('\n✅ ALL TESTS PASSED', 'success');
    process.exit(0);

  } catch (error) {
    log(`❌ Error: ${error.message}`, 'error');
    console.error(error.stack);
    process.exit(1);
  }
}

test();
