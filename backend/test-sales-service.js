require('module-alias/register');
const mongoose = require('mongoose');
const SalesService = require('@modules/business/sales/sales.service');

async function createAndTestSale() {
  try {
    await mongoose.connect('mongodb://localhost:27017/erpbuddy');
    
    // Mock user with proper tenant context
    const mockUser = {
      _id: new mongoose.Types.ObjectId('69d7582dd092b8d6b7b07846'),
      email: 'admin@demo.local',
      company: '69d7582dd092b8d6b7b07842',
      tenantId: '69d7582dd092b8d6b7b07840'
    };
    
    // Create sale using the service
    const saleData = {
      customerId:  '69d75b63ca9d6b5bc8c88bcf',
      warehouseId: '69d75b63ca9d6b5bc8c88bd2',
      currencyId: '69d75b63ca9d6b5bc8c88bd5',
      items: [{
        itemId: '69d75b63ca9d6b5bc8c88bd8',
        quantity: 1000,
        unitPrice: 150
      }]
    };
    
    const result = await SalesService.create(saleData, mockUser);
    console.log('✅ Sale created via service');
    console.log('Sale ID:', result._id);
    console.log('Sales Number:', result.salesNumber);
    console.log('Total Amount:', result.totalAmount);
    
    // Try to find it immediately
    const found = await SalesService.findById(result._id, mockUser);
    if (found) {
      console.log('✅ Sale found via service');
    } else {
      console.log('❌ Sale NOT found via service');
    }
    
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    process.exit(0);
  }
}

createAndTestSale();
