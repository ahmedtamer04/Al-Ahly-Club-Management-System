import dotenv from 'dotenv';
import connectDB from './config/db.js';
import User from './models/User.js';

dotenv.config();

async function checkWalletData() {
  try {
    await connectDB();
    
    const users = await User.find({}).select('email wallet first_name last_name').lean();
    
    console.log(`\n📊 Total users in database: ${users.length}\n`);
    
    let badWalletCount = 0;
    const badUsers = [];
    
    users.forEach(user => {
      if (typeof user.wallet === 'number') {
        badWalletCount++;
        badUsers.push(user);
        console.log(`❌ Bad wallet for: ${user.email} (${user.first_name} ${user.last_name})`);
        console.log(`   Wallet value: ${user.wallet} (type: ${typeof user.wallet})\n`);
      }
    });
    
    if (badWalletCount === 0) {
      console.log('✅ All user wallets are properly formatted!\n');
    } else {
      console.log(`\n⚠️  Found ${badWalletCount} users with corrupted wallet data\n`);
      console.log('Fixing corrupted wallets...\n');
      
      // Use direct MongoDB update to bypass schema validation
      const mongoose = (await import('mongoose')).default;
      
      for (const badUser of badUsers) {
        const walletValue = badUser.wallet;
        const newWallet = {
          balance: typeof walletValue === 'number' ? walletValue : 0,
          currency: 'USD',
          transactions: []
        };
        
        // Direct MongoDB update
        await mongoose.connection.collection('users').updateOne(
          { _id: badUser._id },
          { $set: { wallet: newWallet } }
        );
        console.log(`✅ Fixed wallet for: ${badUser.email} (balance: ${newWallet.balance})`);
      }
      
      console.log('\n✅ All wallets have been fixed!\n');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkWalletData();
