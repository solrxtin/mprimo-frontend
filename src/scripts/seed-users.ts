// src/scripts/seed-users.ts
import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import User from "../models/user.model";
import getCountryPreferences from "../utils/get-country-preferences";
import { LoggerService } from "../services/logger.service";
import { tokenWatcher } from "..";
import { CryptoPaymentService } from "../services/crypto-payment.service";

dotenv.config();

const logger = LoggerService.getInstance();
const cryptoService = new CryptoPaymentService();

const MONGO_URI = process.env.MONGODB_URI!;
const ADMIN_ID = new mongoose.Types.ObjectId("683d2c3998d96c73245b2a60");
const PASSWORD = "UserPass123!";

const seedData = [
  {
    country: "United States",
    profiles: [
      { firstName: "John", lastName: "Smith", email: "john.smith@example.com", phone: "+1-212-555-0147" },
      { firstName: "Emily", lastName: "Johnson", email: "emily.johnson@example.com", phone: "+1-646-555-0198" },
      { firstName: "Michael", lastName: "Williams", email: "michael.williams@example.com", phone: "+1-718-555-0123" },
      { firstName: "Sarah", lastName: "Brown", email: "sarah.brown@example.com", phone: "+1-917-555-0171" },
      { firstName: "David", lastName: "Jones", email: "david.jones@example.com", phone: "+1-347-555-0182" },
    ],
  },
  {
    country: "United Kingdom",
    profiles: [
      { firstName: "Oliver", lastName: "Wilson", email: "oliver.wilson@example.co.uk", phone: "+44-20-7946-0123" },
      { firstName: "Amelia", lastName: "Taylor", email: "amelia.taylor@example.co.uk", phone: "+44-20-7946-0456" },
      { firstName: "Harry", lastName: "Brown", email: "harry.brown@example.co.uk", phone: "+44-20-7946-0789" },
      { firstName: "Isla", lastName: "Davies", email: "isla.davies@example.co.uk", phone: "+44-20-7946-0110" },
      { firstName: "Jack", lastName: "Evans", email: "jack.evans@example.co.uk", phone: "+44-20-7946-0221" },
    ],
  },
  {
    country: "Canada",
    profiles: [
      { firstName: "Emma", lastName: "Martin", email: "emma.martin@example.ca", phone: "+1-416-555-0134" },
      { firstName: "Liam", lastName: "Thompson", email: "liam.thompson@example.ca", phone: "+1-604-555-0167" },
      { firstName: "Sophia", lastName: "White", email: "sophia.white@example.ca", phone: "+1-647-555-0190" },
      { firstName: "Noah", lastName: "Anderson", email: "noah.anderson@example.ca", phone: "+1-780-555-0121" },
      { firstName: "Mia", lastName: "Clark", email: "mia.clark@example.ca", phone: "+1-514-555-0174" },
    ],
  },
  {
    country: "Nigeria",
    profiles: [
      { firstName: "Chinedu", lastName: "Okoro", email: "chinedu.okoro@example.ng", phone: "+234-803-555-0145" },
      { firstName: "Aisha", lastName: "Abubakar", email: "aisha.abubakar@example.ng", phone: "+234-805-555-0168" },
      { firstName: "Emeka", lastName: "Nwosu", email: "emeka.nwosu@example.ng", phone: "+234-807-555-0191" },
      { firstName: "Funke", lastName: "Olabisi", email: "funke.olabisi@example.ng", phone: "+234-802-555-0112" },
      { firstName: "Tunde", lastName: "Adebayo", email: "tunde.adebayo@example.ng", phone: "+234-806-555-0133" },
    ],
  },
  {
    country: "China",
    profiles: [
      { firstName: "李", lastName: "伟", email: "li.wei@example.cn", phone: "+86-10-88881234" },
      { firstName: "王", lastName: "芳", email: "wang.fang@example.cn", phone: "+86-10-88883456" },
      { firstName: "张", lastName: "伟", email: "zhang.wei@example.cn", phone: "+86-21-88884567" },
      { firstName: "刘", lastName: "洋", email: "liu.yang@example.cn", phone: "+86-10-88885678" },
      { firstName: "陈", lastName: "敏", email: "chen.min@example.cn", phone: "+86-21-88886789" },
    ],
  },
  {
    country: "Australia",
    profiles: [
      { firstName: "Oliver", lastName: "Bennett", email: "oliver.bennett@example.com.au", phone: "+61-2-9123-4567" },
      { firstName: "Charlotte", lastName: "Mitchell", email: "charlotte.mitchell@example.com.au", phone: "+61-2-9234-5678" },
      { firstName: "Jack", lastName: "Turner", email: "jack.turner@example.com.au", phone: "+61-3-9123-6789" },
      { firstName: "Amelia", lastName: "Clark", email: "amelia.clark@example.com.au", phone: "+61-3-9234-7890" },
      { firstName: "William", lastName: "Walker", email: "william.walker@example.com.au", phone: "+61-7-4123-8901" },
    ],
  },
  {
    country: "India",
    profiles: [
      { firstName: "Rahul", lastName: "Sharma", email: "rahul.sharma@example.in", phone: "+91-22-23451234" },
      { firstName: "Priya", lastName: "Patel", email: "priya.patel@example.in", phone: "+91-22-23452345" },
      { firstName: "Amit", lastName: "Singh", email: "amit.singh@example.in", phone: "+91-22-23453456" },
      { firstName: "Sneha", lastName: "Kumar", email: "sneha.kumar@example.in", phone: "+91-22-23454567" },
      { firstName: "Raj", lastName: "Gupta", email: "raj.gupta@example.in", phone: "+91-22-23455678" },
    ],
  },
  {
    country: "Germany",
    profiles: [
      { firstName: "Leon", lastName: "Müller", email: "leon.mueller@example.de", phone: "+49-30-12345678" },
      { firstName: "Emma", lastName: "Schmidt", email: "emma.schmidt@example.de", phone: "+49-30-23456789" },
      { firstName: "Ben", lastName: "Schneider", email: "ben.schneider@example.de", phone: "+49-30-34567890" },
      { firstName: "Mia", lastName: "Fischer", email: "mia.fischer@example.de", phone: "+49-30-45678901" },
      { firstName: "Jonas", lastName: "Weber", email: "jonas.weber@example.de", phone: "+49-30-56789012" },
    ],
  },
  {
    country: "South Africa",
    profiles: [
      { firstName: "Thabo", lastName: "Nkosi", email: "thabo.nkosi@example.za", phone: "+27-21-5551234" },
      { firstName: "Lerato", lastName: "Mokoena", email: "lerato.mokoena@example.za", phone: "+27-11-5552345" },
      { firstName: "Sipho", lastName: "Zulu", email: "sipho.zulu@example.za", phone: "+27-31-5553456" },
      { firstName: "Zanele", lastName: "Dlamini", email: "zanele.dlamini@example.za", phone: "+27-21-5554567" },
      { firstName: "Mandla", lastName: "Makhanya", email: "mandla.makhanya@example.za", phone: "+27-11-5555678" },
    ],
  },
  {
    country: "Canada",
    profiles: [
      {
        firstName: "Olivia",
        lastName: "Lemoine",
        email: "olivia.lemoine@example.ca",
        phone: "+1-416-555-0101"
      },
      {
        firstName: "Noah",
        lastName: "Desrosiers",
        email: "noah.desrosiers@example.ca",
        phone: "+1-604-555-0202"
      },
      {
        firstName: "Ava",
        lastName: "Dubois",
        email: "ava.dubois@example.ca",
        phone: "+1-438-555-0303"
      },
      {
        firstName: "Liam",
        lastName: "Tremblay",
        email: "liam.tremblay@example.ca",
        phone: "+1-587-555-0404"
      },
      {
        firstName: "Charlotte",
        lastName: "Morin",
        email: "charlotte.morin@example.ca",
        phone: "+1-709-555-0505"
      }
    ]
  }
  
];

async function seedUsers() {
  await mongoose.connect(MONGO_URI);
  console.log("Connected to MongoDB");

//   await User.deleteMany({ role: "personal" });
  const hashed = await bcrypt.hash(PASSWORD, 10);

  let count = 0;
  for (const block of seedData.filter(b => b.profiles.length)) {
    const prefs = getCountryPreferences(block.country);
    for (const p of block.profiles) {
      const tokenHash = await bcrypt.hash(Math.random().toString(), 10);
      const user = await User.create({
        email: p.email,
        password: hashed,
        profile: { firstName: p.firstName, lastName: p.lastName, phoneNumber: p.phone, avatar: "" },
        role: "personal",
        status: "active",
        isEmailVerified: true,
        country: block.country,
        preferences: {
          language: prefs.language,
          currency: prefs.currency,
          notifications: {
            email: {
              stockAlert: true,
              orderStatus: true,
              pendingReviews: true,
              paymentUpdates: true,
              newsletter: false,
            },
            push: true,
            sms: false,
          },
          marketing: false
        },
        activity: { lastLogin: new Date(), totalOrders: 0, totalSpent: 0 },
        verificationToken: tokenHash,
        verificationTokenExpiresAt: Date.now() + 120000,
      });

      const wallet = await cryptoService.createWallet(user._id);
      tokenWatcher.addAddressToWatch(wallet.address);
      logger.info(`Seeded user: ${p.email} (${block.country})`);
      count++;
    }
  }

  console.log(`🎯 Seeded ${count} verified personal users.`);
  process.exit(0);
}

seedUsers();
