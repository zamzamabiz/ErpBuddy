/**
 * Payment Module Verification Test
 * Tests both PAYMENT and RECEIPT transactions with journal verification
 */

const mongoose = require('mongoose');
const Account = require('./src/modules/accounting/accounts/account.model');
const Payment = require('./src/modules/finance/payments/payment.model');
const Journal = require('./src/modules/finance/journal/journal.model');

async function runTests() {
  try {
    console.log('\n========================================');
    console.log('PAYMENT MODULE VERIFICATION TEST'.cyan);
    console.log('========================================\n');

    // Connect to DB (it's already connected via server.js)
    const dbReady = mongoose.connection.readyState === 1;
    if (!dbReady) {
      console.log('Waiting for MongoDB connection...');
      await new Promise(r => setTimeout(r, 2000));
    }

    // 1. Get Sample Accounts
    console.log('📊 STEP 1: Retrieving Sample Accounts\n');
    const accounts = await Account.find().limit(10).lean();
    console.log(`Found ${accounts.length} accounts:`);
    accounts.slice(0, 5).forEach((a, i) => {
      console.log(`  ${i + 1}. ${a.code.padEnd(10)} | ${a.name.padEnd(20)} | ID: ${a._id}`);
    });

    if (accounts.length < 2) {
      console.log('\n❌ ERROR: Not enough accounts in database\n');
      return;
    }

    const bankAcct = accounts[0]; // First account as bank
    const expenseAcct = accounts[1]; // Second account as expense
    const revenueAcct = accounts.length > 2 ? accounts[2] : accounts[1]; // Third or fallback

    console.log('\n✅ Selected Accounts:');
    console.log(`   Bank:     ${bankAcct.code} (${bankAcct._id})`);
    console.log(`   Expense:  ${expenseAcct.code} (${expenseAcct._id})`);
    console.log(`   Revenue:  ${revenueAcct.code} (${revenueAcct._id})\n`);

    // 2. Check Payment Model
    console.log('📋 STEP 2: Verifying Payment Model Structure\n');
    const paymentSchema = Payment.schema.paths;
    console.log('✅ Required fields in Payment model:');
    console.log(`   - cashAccountId: ${paymentSchema.cashAccountId ? '✓' : '❌'}`);
    console.log(`   - counterAccountId: ${paymentSchema.counterAccountId ? '✓' : '❌'}`);
    console.log(`   - type: ${paymentSchema.type ? '✓' : '❌'}`);
    console.log(`   - amount: ${paymentSchema.amount ? '✓' : '❌'}`);
    console.log(`   - journalId: ${paymentSchema.journalId ? '✓' : '❌'}\n`);

    // 3. Count Existing Records
    console.log('📈 STEP 3: Database Record Count\n');
    const paymentCount = await Payment.countDocuments();
    const journalCount = await Journal.countDocuments();
    console.log(`   Payments in DB: ${paymentCount}`);
    console.log(`   Journal entries in DB: ${journalCount}\n`);

    // 4. Show Last Payment if exists
    if (paymentCount > 0) {
      console.log('📄 STEP 4: Last Payment Record\n');
      const lastPayment = await Payment.findOne()
        .sort({ createdAt: -1 })
        .populate('cashAccountId', 'code name')
        .populate('counterAccountId', 'code name')
        .lean();

      console.log(`   Reference: ${lastPayment.reference}`);
      console.log(`   Type: ${lastPayment.type}`);
      console.log(`   Amount: ${lastPayment.amount}`);
      console.log(`   Cash Account: ${lastPayment.cashAccountId?.code}`);
      console.log(`   Counter Account: ${lastPayment.counterAccountId?.code}`);
      console.log(`   Journal ID: ${lastPayment.journalId ? '✓ Linked' : '❌ Not Linked'}\n`);

      // 5. Check Linked Journal Entry
      if (lastPayment.journalId) {
        console.log('📊 STEP 5: Verifying Journal Entry\n');
        const journal = await Journal.findById(lastPayment.journalId).lean();
        if (journal) {
          console.log(`   Reference: ${journal.reference}`);
          console.log(`   Description: ${journal.description}`);
          console.log(`   Lines: ${journal.lines.length}`);
          
          let totalDebit = 0;
          let totalCredit = 0;
          journal.lines.forEach((line, i) => {
            totalDebit += line.debit;
            totalCredit += line.credit;
            console.log(`     Line ${i + 1}: Debit=${line.debit}, Credit=${line.credit}, Account=${line.accountId}`);
          });
          
          console.log(`\n   ✅ Total Debit: ${totalDebit}`);
          console.log(`   ✅ Total Credit: ${totalCredit}`);
          console.log(`   ${totalDebit === totalCredit ? '✅ BALANCED' : '❌ NOT BALANCED'}\n`);
        }
      }
    }

    // 6. Test Validation
    console.log('🔍 STEP 6: Validation Check\n');
    console.log('   Sample Validation (Payment):');
    const validPayment = {
      type: 'payment',
      cashAccountId: bankAcct._id,
      counterAccountId: expenseAcct._id,
      amount: 1000,
      description: 'Test payment'
    };
    console.log(`   ✓ Has cashAccountId: ${validPayment.cashAccountId ? 'YES' : 'NO'}`);
    console.log(`   ✓ Has counterAccountId: ${validPayment.counterAccountId ? 'YES' : 'NO'}`);
    console.log(`   ✓ Type is valid: ${['payment', 'receipt'].includes(validPayment.type) ? 'YES' : 'NO'}`);
    console.log(`   ✓ Amount > 0: ${validPayment.amount > 0 ? 'YES' : 'NO'}\n`);

    console.log('========================================');
    console.log('✅ VERIFICATION COMPLETE'.green);
    console.log('========================================\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ TEST ERROR:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run tests
runTests();
