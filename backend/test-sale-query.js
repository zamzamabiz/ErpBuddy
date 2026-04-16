require('module-alias/register');
const mongoose = require('mongoose');
const Sales = require('@modules/business/sales/sales.model');

async function test() {
  await mongoose.connect('mongodb://localhost:27017/erpbuddy');
  
  const saleId = new mongoose.Types.ObjectId('69d782b5382d3fdd401e2ede');
  const companyId = new mongoose.Types.ObjectId('69d7582dd092b8d6b7b07842');
  
  console.log('Testing Mongoose query...');
  console.log('Sale ID:', saleId.toString());
  console.log('Company ID:', companyId.toString());
  
  const sale = await Sales.findOne({ _id: saleId, companyId, isDeleted: { $ne: true } });
  
  if (sale) {
    console.log('✅ Found with Mongoose:', sale._id);
    console.log('   Number:', sale.salesNumber);
  } else {
    console.log('❌ Not found with Mongoose');
    const anyFound = await Sales.findOne({});
    console.log('Any sales in DB:', anyFound ? 'YES (' + anyFound._id + ')' : 'NO');
  }
  
  process.exit(0);
}

test().catch(err => { console.error('Error:', err.message); process.exit(1); });
