import { execSync } from 'child_process';
import dotenv from 'dotenv';

dotenv.config();

const scripts = [
  { name: 'Products', command: 'npm run seed-products' },
  { name: 'User Interactions', command: 'npm run seed-interactions' },
  { name: 'Database Indexes', command: 'npm run create-indexes' }
];

async function seedRemaining() {
  console.log('🚀 Starting remaining database seeding...\n');
  
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
  
  console.log('🎉 Remaining seeding completed successfully!');
  console.log('\n📊 Your marketplace now has:');
  console.log('   - 200+ realistic products with real images');
  console.log('   - Shopping carts and wishlists');
  console.log('   - Product reviews and analytics');
  console.log('   - Optimized database indexes');
  console.log('\n🔥 Ready for testing user interactions!');
}

seedRemaining();