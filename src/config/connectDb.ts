import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Connect to MongoDB
const connectDb = async() => {
  try {
      const conn = await mongoose.connect(process.env.MONGODB_URI!)
      console.log(`MongoDB connected: ${conn.connection.host}`)
  } catch (error: any) {
      console.log(`Error connecting to Database: ${error.message}`)
      process.exit(1);
  }
}

export default connectDb