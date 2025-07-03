import { execSync } from 'child_process';
import dotenv from 'dotenv';

dotenv.config();

const scripts = [
  { name: 'Countries', command: 'npm run seed-countries' },
  { name: 'Categories', command: 'npm run seed-categories' },
  { name: 'Users', command: 'npm run seed-users' },
  { name: 'Vendors', command: 'npm run seed-vendors' },
  { name: 'Products', command: 'npm run seed-products' },
  { name: 'User Interactions', command: 'npm run seed-interactions' },
  { name: 'Database Indexes', command: 'npm run create-indexes' }
];

async function seedAll() {
  console.log('🚀 Starting complete database seeding...\n');
  
  for (const script of scripts) {
    try {
      console.log(`📦 Seeding ${script.name}...`);
      execSync(script.command, { stdio: 'inherit' });
      console.log(`✅ ${script.name} completed successfully\n`);
    } catch (error) {
      console.error(`❌ Error seeding ${script.name}:`, error);
      process.exit(1);
    }
  }
  
  console.log('🎉 All seeding completed successfully!');
  console.log('\n📊 Your marketplace now has:');
  console.log('   - Countries and categories');
  console.log('   - 50+ personal users with crypto wallets');
  console.log('   - 30+ business vendors with crypto wallets');
  console.log('   - 200+ realistic products with reviews');
  console.log('   - Shopping carts and wishlists');
  console.log('   - Product analytics and interactions');
  console.log('   - Optimized database indexes');
  console.log('\n🔥 Ready for testing user interactions!');
}

seedAll();