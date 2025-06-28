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
    
    // Create countries
    const countries = [
      {
        name: "United States",
        currency: "USD",
        createdBy: adminId,
        updatedBy: adminId
      },
      {
        name: "United Kingdom",
        currency: "GBP",
        createdBy: adminId,
        updatedBy: adminId
      },
      {
        name: "Nigeria",
        currency: "NGN",
        createdBy: adminId,
        updatedBy: adminId
      },
      {
        name: "South Africa",
        currency: "ZAR",
        createdBy: adminId,
        updatedBy: adminId
      },
      {
        name: "Ghana",
        currency: "GHS",
        createdBy: adminId,
        updatedBy: adminId
      },
      {
        name: "China",
        currency: "CNY",
        createdBy: adminId,
        updatedBy: adminId
      },
      {
        name: "Canada",
        currency: "CAD",
        createdBy: adminId,
        updatedBy: adminId
      },
      {
        name: "Australia",
        currency: "AUD",
        createdBy: adminId,
        updatedBy: adminId
      },
      {
        name: "India",
        currency: "INR",
        createdBy: adminId,
        updatedBy: adminId
      },
      {
        name: "Germany",
        currency: "EUR",
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