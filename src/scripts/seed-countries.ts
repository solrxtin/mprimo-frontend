// src/scripts/seed-countries.ts
import mongoose from "mongoose";
import Country from "../models/country.model";
import SubscriptionPlan from "../models/subscription-plan.model";
import PaymentOption from "../models/payment-options.model";
import connectDb from "../config/connectDb";


async function seedCountries() {
  try {
    await connectDb();
    
    // Get subscription plans and payment options
    const plans = await SubscriptionPlan.find({});
    const paymentOptions = await PaymentOption.find({});
    
    await Country.deleteMany({});
    console.log("Cleared existing countries");

    const adminId = new mongoose.Types.ObjectId("68c94179472546523eca304c");
    
    const countries = [
      {
        name: "United States",
        currency: "USD",
        currencySymbol: "$",
        exchangeRate: 1,
        paymentOptions: paymentOptions.map(p => p._id),
        localizedSubscritpionPlan: [
          { plan: plans.find(p => p.name === 'Starter')?._id, price: 29, transactionFeePercent: 2.9 },
          { plan: plans.find(p => p.name === 'Pro')?._id, price: 99, transactionFeePercent: 2.5 },
          { plan: plans.find(p => p.name === 'Elite')?._id, price: 299, transactionFeePercent: 2.0 }
        ],
        bidIncrement: 0.01,
        createdBy: adminId,
        updatedBy: adminId
      },
      {
        name: "United Kingdom",
        currency: "GBP",
        currencySymbol: "£",
        exchangeRate: 0.79,
        paymentOptions: paymentOptions.map(p => p._id),
        localizedSubscritpionPlan: [
          { plan: plans.find(p => p.name === 'Starter')?._id, price: 23, transactionFeePercent: 2.9 },
          { plan: plans.find(p => p.name === 'Pro')?._id, price: 78, transactionFeePercent: 2.5 },
          { plan: plans.find(p => p.name === 'Elite')?._id, price: 236, transactionFeePercent: 2.0 }
        ],
        bidIncrement: 0.01,
        createdBy: adminId,
        updatedBy: adminId
      },
      {
        name: "Nigeria",
        currency: "NGN",
        currencySymbol: "₦",
        exchangeRate: 1530,
        paymentOptions: paymentOptions.map(p => p._id),
        localizedSubscritpionPlan: [
          { plan: plans.find(p => p.name === 'Starter')?._id, price: 24650, transactionFeePercent: 3.5 },
          { plan: plans.find(p => p.name === 'Pro')?._id, price: 84150, transactionFeePercent: 3.0 },
          { plan: plans.find(p => p.name === 'Elite')?._id, price: 254150, transactionFeePercent: 2.5 }
        ],
        bidIncrement: 1,
        createdBy: adminId,
        updatedBy: adminId
      },
      {
        name: "South Africa",
        currency: "ZAR",
        currencySymbol: "R",
        exchangeRate: 18.5,
        paymentOptions: paymentOptions.map(p => p._id),
        localizedSubscritpionPlan: [
          { plan: plans.find(p => p.name === 'Starter')?._id, price: 537, transactionFeePercent: 3.2 },
          { plan: plans.find(p => p.name === 'Pro')?._id, price: 1832, transactionFeePercent: 2.8 },
          { plan: plans.find(p => p.name === 'Elite')?._id, price: 5532, transactionFeePercent: 2.3 }
        ],
        bidIncrement: 0.1,
        createdBy: adminId,
        updatedBy: adminId
      },
      {
        name: "Ghana",
        currency: "GHS",
        currencySymbol: "₵",
        exchangeRate: 12.1,
        paymentOptions: paymentOptions.map(p => p._id),
        localizedSubscritpionPlan: [
          { plan: plans.find(p => p.name === 'Starter')?._id, price: 351, transactionFeePercent: 3.5 },
          { plan: plans.find(p => p.name === 'Pro')?._id, price: 1198, transactionFeePercent: 3.0 },
          { plan: plans.find(p => p.name === 'Elite')?._id, price: 3618, transactionFeePercent: 2.5 }
        ],
        bidIncrement: 0.1,
        createdBy: adminId,
        updatedBy: adminId
      }
    ];

    await Country.insertMany(countries);
    console.log("✅ Countries seeded successfully");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding countries:", error);
    process.exit(1);
  }
}

seedCountries();