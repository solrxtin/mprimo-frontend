// This script creates an admin user in the MongoDB database.
// It prompts for the admin's email, password, and name, checks if the user already exists,
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import readline from 'readline';
import User from '../models/user.model';

dotenv.config();

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI!)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });


async function createAdminUser() {
  try {
    // Get admin details from command line
    const email = await new Promise(resolve => {
      rl.question('Enter admin email: ', resolve);
    });
    
    const password = await new Promise(resolve => {
      rl.question('Enter admin password: ', resolve);
    });
    
    const firstName: string = await new Promise(resolve => {
      rl.question('Enter admin\'s first name: ', resolve);
    });

    const lastName: string = await new Promise(resolve => {
      rl.question('Enter admin\'s last name: ', resolve);
    });

    const profile = {
        firstName: firstName.trim(),
        lastName: lastName.trim()
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log('User with this email already exists');
      process.exit(0);
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password as string, salt);

    // Create admin user
    const admin = await User.create({
      email,
      password: hashedPassword,
      profile,
      role: 'admin',
      isVerified: true
    });

    console.log('Admin user created successfully:', admin.email);
  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    rl.close();
    mongoose.disconnect();
  }
}

createAdminUser();


// 683d2c3998d96c73245b2a60