// src/scripts/seed-countries.ts
import mongoose from "mongoose";
import dotenv from "dotenv";
import Country from "../models/country.model";

dotenv.config();

mongoose
  .connect(process.env.MONGODB_URI!)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });

async function seedCountries() {
  try {
    // Clear existing countries
    await Country.deleteMany({});
    console.log("Cleared existing countries");

    const adminId = new mongoose.Types.ObjectId("683d2c3998d96c73245b2a60");
    
    // Create countries with currency symbols and exchange rates
    const countries = [
      {
        name: "United States",
        currency: "USD",
        currencySymbol: "$",
        exchangeRate: 1,
        createdBy: adminId,
        updatedBy: adminId
      },
      {
        name: "United Kingdom",
        currency: "GBP",
        currencySymbol: "£",
        exchangeRate: 0.79,
        createdBy: adminId,
        updatedBy: adminId
      },
      {
        name: "Nigeria",
        currency: "NGN",
        currencySymbol: "₦",
        exchangeRate: 850,
        createdBy: adminId,
        updatedBy: adminId
      },
      {
        name: "South Africa",
        currency: "ZAR",
        currencySymbol: "R",
        exchangeRate: 18.5,
        createdBy: adminId,
        updatedBy: adminId
      },
      {
        name: "Ghana",
        currency: "GHS",
        currencySymbol: "₵",
        exchangeRate: 12.1,
        createdBy: adminId,
        updatedBy: adminId
      },
      {
        name: "China",
        currency: "CNY",
        currencySymbol: "¥",
        exchangeRate: 7.2,
        createdBy: adminId,
        updatedBy: adminId
      },
      {
        name: "Canada",
        currency: "CAD",
        currencySymbol: "C$",
        exchangeRate: 1.35,
        createdBy: adminId,
        updatedBy: adminId
      },
      {
        name: "Australia",
        currency: "AUD",
        currencySymbol: "A$",
        exchangeRate: 1.52,
        createdBy: adminId,
        updatedBy: adminId
      },
      {
        name: "India",
        currency: "INR",
        currencySymbol: "₹",
        exchangeRate: 83.2,
        createdBy: adminId,
        updatedBy: adminId
      },
      {
        name: "Germany",
        currency: "EUR",
        currencySymbol: "€",
        exchangeRate: 0.92,
        createdBy: adminId,
        updatedBy: adminId
      }
    ];

    await Country.insertMany(countries);
    console.log("Countries seeded successfully");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding countries:", error);
    process.exit(1);
  }
}

seedCountries();