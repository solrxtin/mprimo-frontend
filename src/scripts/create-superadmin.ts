import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import readline from 'readline';
import User from '../models/user.model';
import { ROLE_PERMISSIONS } from '../constants/roles.config';

dotenv.config();

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const createSuperAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI!);
    console.log('✅ Connected to MongoDB');

    // Check if superadmin already exists
    // const existingSuperAdmin = await User.findOne({ 
    //   role: 'admin',
    //   'profile.firstName': 'Super',
    //   'profile.lastName': 'Admin'
    // });

    // if (existingSuperAdmin) {
    //   console.log('⚠️  Super Admin already exists!');
    //   console.log('📧 Email:', existingSuperAdmin.email);
    //   console.log('🆔 User ID:', existingSuperAdmin._id);
    //   rl.close();
    //   await mongoose.connection.close();
    //   process.exit(0);
    // }

    // Get admin details from command line or use defaults
    const email = await new Promise<string>(resolve => {
      rl.question('Enter superadmin email (default: superadmin@mprimo.com): ', (answer) => {
        resolve(answer.trim() || 'superadmin@mprimo.com');
      });
    });

    const password = await new Promise<string>(resolve => {
      rl.question('Enter superadmin password (default: SuperAdmin123!): ', (answer) => {
        resolve(answer.trim() || 'SuperAdmin123!');
      });
    });

    const firstName = await new Promise<string>(resolve => {
      rl.question('Enter first name (default: Super): ', (answer) => {
        resolve(answer.trim() || 'Super');
      });
    });

    const lastName = await new Promise<string>(resolve => {
      rl.question('Enter last name (default: Admin): ', (answer) => {
        resolve(answer.trim() || 'Admin');
      });
    });

    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log('❌ User with this email already exists');
      rl.close();
      await mongoose.connection.close();
      process.exit(1);
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create superadmin user
    const superAdmin = await User.create({
      profile: {
        firstName,
        lastName,
        phoneNumber: '+1234567890'
      },
      email,
      password: hashedPassword,
      role: 'admin',
      status: 'active',
      isEmailVerified: true,
      canMakeSales: false,
      preferences: {
        language: 'en',
        currency: 'USD',
        notifications: {
          email: {
            stockAlert: true,
            orderStatus: true,
            pendingReviews: true,
            paymentUpdates: true,
            newsletter: false
          },
          push: true,
          sms: false
        },
        marketing: false
      },
      activity: {
        lastLogin: new Date(),
        totalOrders: 0,
        totalSpent: 0
      },
      twoFactorAuth: {
        enabled: false
      },
      adminRole: 'superadmin',
      permissions: ROLE_PERMISSIONS.superadmin
    });

    console.log('\n✅ Super Admin created successfully!');
    console.log('📧 Email:', email);
    console.log('🔑 Password:', password);
    console.log('👤 Name:', `${firstName} ${lastName}`);
    console.log('🆔 User ID:', superAdmin._id);
    console.log('🔐 Admin Role:', superAdmin.adminRole);
    console.log('\n⚠️  Please change the password after first login!');

  } catch (error: any) {
    console.error('❌ Error creating Super Admin:', error.message);
    
    if (error.code === 11000) {
      console.log('📧 Email already exists. Try with a different email.');
    }
  } finally {
    rl.close();
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
};

// Run the script
createSuperAdmin();