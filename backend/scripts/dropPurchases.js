require('module-alias/register');
const mongoose = require('mongoose');
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/erpbuddy';

(async () => {
  try {
    await mongoose.connect(MONGO_URI);
    const db = mongoose.connection.db;
    
    // Drop the problematic purchase collection
    await db.collection('purchases').drop().catch(e => console.log('Collection not found or already dropped'));
    console.log('✅ Purchases collection dropped');
    
    // Close connection
    await mongoose.disconnect();
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
})();
