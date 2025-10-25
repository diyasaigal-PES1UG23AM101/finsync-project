const mongoose = require('mongoose');
const User = require('../models/User');
const Transaction = require('../models/Transaction');

mongoose.connect('mongodb://localhost:27017/finsync', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function seedData() {
  try {
    // Clear existing data
    await User.deleteMany({});
    await Transaction.deleteMany({});

    console.log('🗑️  Cleared existing data');

    // Create learner with FinSync Code
    const learner = new User({
      name: 'Grandma Sharma',
      email: 'grandma@finsync.com',
      password: 'password123',
      role: 'learner',
      finsyncCode: 'FSDEMO1' // Demo code for testing
    });
    await learner.save();
    console.log(`✅ Learner created with FinSync Code: ${learner.finsyncCode}`);

    // Create mentor linked to learner
    const mentor = new User({
      name: 'Raj Sharma',
      email: 'raj@finsync.com',
      password: 'password123',
      role: 'mentor',
      linkedUserId: learner._id
    });
    await mentor.save();
    console.log('✅ Mentor created and linked to learner');

    // Link learner back to mentor
    learner.linkedUserId = mentor._id;
    await learner.save();
    console.log('✅ Bidirectional linking completed');

    // Create sample transactions for learner
    const transactions = [
      {
        userId: learner._id,
        payee: 'Electricity Bill',
        amount: 1250,
        category: 'bills',
        status: 'pending'
      },
      {
        userId: learner._id,
        payee: 'Medical Store',
        amount: 450,
        category: 'healthcare',
        status: 'completed'
      },
      {
        userId: learner._id,
        payee: 'Unknown Vendor',
        amount: 5000,
        category: 'other',
        status: 'pending',
        flagged: true,
        flagReason: 'High amount to unknown payee'
      },
      {
        userId: learner._id,
        payee: 'Grocery Store',
        amount: 2300,
        category: 'groceries',
        status: 'completed'
      }
    ];

    await Transaction.insertMany(transactions);
    console.log('✅ Sample transactions created');

    console.log('\n========================================');
    console.log('✅ SEED DATA CREATED SUCCESSFULLY!');
    console.log('========================================');
    console.log('\n📝 Demo Accounts:');
    console.log('------------------');
    console.log('Learner:');
    console.log('  Email: grandma@finsync.com');
    console.log('  Password: password123');
    console.log(`  FinSync Code: ${learner.finsyncCode}`);
    console.log('\nMentor:');
    console.log('  Email: raj@finsync.com');
    console.log('  Password: password123');
    console.log(`  Linked to: ${learner.name}`);
    console.log('========================================\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    process.exit(1);
  }
}

seedData();
