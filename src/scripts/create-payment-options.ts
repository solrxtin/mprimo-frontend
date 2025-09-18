import mongoose from 'mongoose';
import PaymentOption from '../models/payment-options.model';
import connectDb from '../config/connectDb';

const paymentOptions = [
  { name: 'Credit Card' },
  { name: 'Debit Card' },
  { name: 'PayPal' },
  { name: 'Bank Transfer' },
  { name: 'Mobile Money' },
  { name: 'Apple Pay' },
  { name: 'Google Pay' },
  { name: 'Stripe' },
  { name: 'Cash on Delivery' },
  { name: 'Cryptocurrency' }
];

async function createPaymentOptions() {
  try {
    await connectDb();
    
    await PaymentOption.deleteMany({});
    await PaymentOption.insertMany(paymentOptions);
    
    console.log('✅ Payment options created successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating payment options:', error);
    process.exit(1);
  }
}

createPaymentOptions();