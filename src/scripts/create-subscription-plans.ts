import mongoose from 'mongoose';
import SubscriptionPlan from '../models/subscription-plan.model';
import connectDb from '../config/connectDb';


const subscriptionPlans = [
  {
    name: 'Starter',
    productListingLimit: 50,
    featuredProductSlots: 0,
    analyticsDashboard: false,
    customStoreBranding: 'none',
    messagingTools: 'basic',
    bulkUpload: false,
    payoutOptions: ['weekly'],
    adCreditMonthly: 0,
    prioritySupport: 'none'
  },
  {
    name: 'Pro',
    productListingLimit: 500,
    featuredProductSlots: 5,
    analyticsDashboard: true,
    customStoreBranding: 'basic',
    messagingTools: 'full',
    bulkUpload: true,
    payoutOptions: ['weekly', 'bi-weekly'],
    adCreditMonthly: 100,
    prioritySupport: 'basic'
  },
  {
    name: 'Elite',
    productListingLimit: -1, // unlimited
    featuredProductSlots: 20,
    analyticsDashboard: true,
    customStoreBranding: 'premium',
    messagingTools: 'full_priority',
    bulkUpload: true,
    payoutOptions: ['weekly', 'bi-weekly', 'instant'],
    adCreditMonthly: 500,
    prioritySupport: 'premium'
  }
];

async function createSubscriptionPlans() {
  try {
    await connectDb();
    
    // Clear existing plans
    await SubscriptionPlan.deleteMany({});
    
    // Create new plans
    await SubscriptionPlan.insertMany(subscriptionPlans);
    
    console.log('✅ Subscription plans created successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating subscription plans:', error);
    process.exit(1);
  }
}

createSubscriptionPlans();