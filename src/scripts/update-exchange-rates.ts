import mongoose from 'mongoose';
import { CurrencyService } from '../services/currency.service';
import dotenv from 'dotenv';

dotenv.config();

async function updateExchangeRates() {
  try {
    await mongoose.connect(process.env.MONGODB_URI!);
    console.log('Connected to MongoDB');
    
    await CurrencyService.updateExchangeRates();
    console.log('✅ Exchange rates updated successfully');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error updating exchange rates:', error);
    process.exit(1);
  }
}

updateExchangeRates();