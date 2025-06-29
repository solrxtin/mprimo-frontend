import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import User from "../models/user.model";
import Vendor from "../models/vendor.model";
import getCountryPreferences from "../utils/get-country-preferences";
import { LoggerService } from "../services/logger.service";
import { tokenWatcher } from "..";
import { CryptoPaymentService } from "../services/crypto-payment.service";


dotenv.config();
const MONGO_URI = process.env.MONGODB_URI!;
const ADMIN_ID = new mongoose.Types.ObjectId("683d2c3998d96c73245b2a60");

const logger = LoggerService.getInstance();
const cryptoService = new CryptoPaymentService();

const data = [
  {
    country: "United States", city: "New York", state: "NY", postalCode: "10019", phonePrefix: "+1",
    businesses: [
      { name: "Empire Electronics", street: "350 5th Ave", phone: "+1-212-123-4567" },
      { name: "Hudson Apparel Co.", street: "201 W 39th St", phone: "+1-212-234-5678" },
      { name: "Broadway Books", street: "1453 Broadway", phone: "+1-212-345-6789" },
    ],
  },
  {
    country: "United Kingdom", city: "London", state: "England", postalCode: "SW1A 1AA", phonePrefix: "+44",
    businesses: [
      { name: "Thames Tech Ltd", street: "10 Downing St", phone: "+44-20-1234-5678" },
      { name: "Camden Coffee Roasters", street: "5 Camden High St", phone: "+44-20-2345-6789" },
      { name: "Soho Style Boutique", street: "22 Greek St", phone: "+44-20-3456-7890" },
    ],
  },
  {
    country: "Nigeria", city: "Lagos", state: "Lagos", postalCode: "100001", phonePrefix: "+234",
    businesses: [
      { name: "Lagos Logistics", street: "12 Marina Rd", phone: "+234-803-123-4567" },
      { name: "Eko Electronics", street: "45 Broad St", phone: "+234-803-234-5678" },
      { name: "Victoria Island Ventures", street: "78 Ozumba Mbadiwe", phone: "+234-803-345-6789" },
    ],
  },
  {
    country: "South Africa", city: "Cape Town", state: "Western Cape", postalCode: "8001", phonePrefix: "+27",
    businesses: [
      { name: "Table Mountain Tours", street: "19 Kloof Nek Rd", phone: "+27-21-123-4567" },
      { name: "Cape Crafts Co.", street: "15 Long St", phone: "+27-21-234-5678" },
      { name: "Garden Route Gear", street: "34 Bree St", phone: "+27-21-345-6789" },
    ],
  },
  {
    country: "Ghana", city: "Accra", state: "Greater Accra", postalCode: "GA 001", phonePrefix: "+233",
    businesses: [
      { name: "Accra Artisans", street: "8 Oxford St", phone: "+233-24-123-4567" },
      { name: "Golden Coast Traders", street: "39 Liberation Rd", phone: "+233-24-234-5678" },
      { name: "Tema Tech Solutions", street: "22 Tema Harbour Rd", phone: "+233-24-345-6789" },
    ],
  },
  {
    country: "China", city: "Beijing", state: "Beijing", postalCode: "100010", phonePrefix: "+86",
    businesses: [
      { name: "Great Wall Gadgets", street: "15 Wangfujing St", phone: "+86-10-12345678" },
      { name: "Silk Road Studios", street: "8 Tianze Rd", phone: "+86-10-23456789" },
      { name: "Forbidden City Crafts", street: "24 Xichang'an St", phone: "+86-10-34567890" },
    ],
  },
  {
    country: "Canada", city: "Toronto", state: "Ontario", postalCode: "M5V 2T6", phonePrefix: "+1",
    businesses: [
      { name: "Maple Leaf Makers", street: "100 King St W", phone: "+1-647-123-4567" },
      { name: "Downtown Décor", street: "200 Queen St E", phone: "+1-647-234-5678" },
      { name: "Lakeview Electronics", street: "300 Bloor St W", phone: "+1-647-345-6789" },
    ],
  },
  {
    country: "Australia", city: "Sydney", state: "NSW", postalCode: "2000", phonePrefix: "+61",
    businesses: [
      { name: "Sydney Surf Gear", street: "1 George St", phone: "+61-2-1234-5678" },
      { name: "Opera House Gifts", street: "2 Macquarie St", phone: "+61-2-2345-6789" },
      { name: "Harbour Electronics", street: "3 Circular Quay", phone: "+61-2-3456-7890" },
    ],
  },
  {
    country: "India", city: "Mumbai", state: "Maharashtra", postalCode: "400001", phonePrefix: "+91",
    businesses: [
      { name: "Gateway Gadgets", street: "10 Marine Dr", phone: "+91-22-1234-5678" },
      { name: "Bollywood Boutique", street: "5 Linking Rd", phone: "+91-22-2345-6789" },
      { name: "Chhatrapati Crafts", street: "8 CST Rd", phone: "+91-22-3456-7890" },
    ],
  },
  {
    country: "Germany", city: "Berlin", state: "Berlin", postalCode: "10117", phonePrefix: "+49",
    businesses: [
      { name: "Brandenburg Books", street: "Pariser Platz", phone: "+49-30-1234567" },
      { name: "Berlin Brew Co.", street: "Alexanderplatz", phone: "+49-30-2345678" },
      { name: "Checkpoint Charlie Crafts", street: "Zimmerstr.", phone: "+49-30-3456789" },
    ],
  },
];

async function seedVendors() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB");

    const password = await bcrypt.hash("VendorPass123!", 10);

    for (const countryBlock of data) {
      const prefs = getCountryPreferences(countryBlock.country);

      for (const biz of countryBlock.businesses) {
        const email = `${biz.name.replace(/\s+/g, "").toLowerCase()}@example.com`;
        const phone = biz.phone;

        const user = await User.create({
          email,
          password,
          role: "business",
          status: "active",
          businessName: biz.name,
          country: countryBlock.country,
          phone,
          preferences: {
            language: prefs.language,
            currency: prefs.currency,
            notifications: { email: true, push: true, sms: true },
            marketing: false,
          },
          activity: { lastLogin: new Date(), totalOrders: 0, totalSpent: 0 },
          createdBy: ADMIN_ID,
          updatedBy: ADMIN_ID,
        });

        const wallet = await cryptoService.createWallet(user._id);
        tokenWatcher.addAddressToWatch(wallet.address);

        await Vendor.create({
          userId: user._id,
          accountType: "business",
          businessInfo: {
            name: biz.name,
            address: {
              street: biz.street,
              city: countryBlock.city,
              state: countryBlock.state,
              postalCode: countryBlock.postalCode,
              country: countryBlock.country,
            },
          },
          createdBy: ADMIN_ID,
          updatedBy: ADMIN_ID,
        });

        logger.info(`🎯 Seeded vendor: ${biz.name} in ${countryBlock.country}`);
      }
    }

    console.log("✅ Successfully seeded 30 realistic vendors.");
    process.exit(0);

  } catch (err) {
    console.error("Error seeding vendors:", err);
    process.exit(1);
  }
}

seedVendors();
