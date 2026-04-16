/**
 * Debug script to check Journal entries in database
 */

require('module-alias/register');

const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const Journal = require('@modules/finance/journal/journal.model');

async function checkJournals() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/erpbuddy');
    console.log('📊 Connected to MongoDB\n');

    const totalJournals = await Journal.countDocuments();
    console.log(`Total journals in database: ${totalJournals}\n`);

    const journals = await Journal.find().limit(10);
    
    if (journals.length === 0) {
      console.log('⚠️ No journals found in database');
    } else {
      console.log('Recent journals:');
      journals.forEach(j => {
        console.log(`\n- Journal ID: ${j._id}`);
        console.log(`  Status: ${j.status}`);
        console.log(`  Date: ${j.date}`);
        console.log(`  Company: ${j.company}`);
        console.log(`  Reference: ${j.reference || j.referenceType} ${j.referenceId || ''}`);
        console.log(`  Lines: ${(j.lines || []).length}`);
        if (j.lines && j.lines.length > 0) {
          j.lines.forEach((line, idx) => {
            const code = line.accountCode || line.code;
            const name = line.accountName || line.name;
            const debit = line.debit || 0;
            const credit = line.credit || 0;
            console.log(`    [${idx + 1}] ${code} - ${name} | D: ₹${debit} | C: ₹${credit}`);
          });
        }
      });
    }

    // Check filtered journals
    console.log('\n\n💰 Checking today\'s journals:');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const todayJournals = await Journal.find({
      date: { $gte: today, $lt: tomorrow },
      status: 'POSTED'
    });
    
    console.log(`Today's POSTED journals: ${todayJournals.length}`);
    
    if (todayJournals.length === 0) {
      console.log('⚠️ No journals posted today');
    } else {
      let totalDebit = 0, totalCredit = 0;
      todayJournals.forEach(j => {
        (j.lines || []).forEach(line => {
          totalDebit += parseFloat(line.debit || 0);
          totalCredit += parseFloat(line.credit || 0);
        });
      });
      console.log(`Total Debit: ₹${totalDebit.toFixed(2)}`);
      console.log(`Total Credit: ₹${totalCredit.toFixed(2)}`);
      console.log(`Balanced: ${Math.abs(totalDebit - totalCredit) < 0.01 ? '✓' : '✗'}`);
    }

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.log('❌ Error:', error.message);
    process.exit(1);
  }
}

checkJournals();
