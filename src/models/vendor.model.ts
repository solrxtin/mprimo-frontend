import mongoose from "mongoose";
import {Vendor} from "../types/vendor.type";

const vendorSchema = new mongoose.Schema<Vendor>({
  userId: { type: mongoose.Types.ObjectId, ref: 'User', required: [true, 'User ID is required.'] },
  accountType: { type: String, enum: ['individual', 'business'], required: true },
  kycStatus: { type: String, enum: ['pending', 'verified', 'rejected'], default: 'pending' },
  businessInfo: {
      name: { type: String, required: [true, 'Business name is required.'], trim: true },
      registrationNumber: { type: String, required: [true, 'Registration number is required.'], unique: true },
      taxId: { type: String, required: [true, 'Tax ID is required.'], unique: true },
      address: {
          street: { type: String, required: [true, 'Street address is required.'] },
          city: { type: String, required: [true, 'City is required.'] },
          state: { type: String, required: [true, 'State is required.'] },
          country: { type: String, required: [true, 'Country is required.'] },
          postalCode: { 
              type: String, 
              required: [true, 'Postal code is required.'], 
              match: [/^\d{5}(-\d{4})?$/, 'Invalid postal code format.']
          }
      }
  },
  bankDetails: {
      accountHolder: { type: String, required: [true, 'Account holder name is required.'] },
      accountNumber: { 
          type: String, 
          required: [true, 'Account number is required.'], 
          match: [/^\d{10,20}$/, 'Account number must be between 10 and 20 digits.'] 
      },
      bankName: { type: String, required: [true, 'Bank name is required.'] },
      swiftCode: { 
          type: String, 
          match: [/^[A-Z0-9]{8,11}$/, 'Invalid SWIFT code format.'] 
      }
  },
  ratings: {
      average: { type: Number, min: [0, 'Average rating cannot be negative.'], max: [5, 'Average rating cannot exceed 5.'] },
      count: { type: Number, min: [0, 'Rating count cannot be negative.'] }
  },
  status: { type: String, enum: { values: ['pending', 'active', 'suspended'], message: 'Invalid status value.' }, default: 'pending' },
  analytics: {
      totalSales: { type: Number, min: [0, 'Total sales cannot be negative.'] },
      totalRevenue: { type: Number, min: [0, 'Total revenue cannot be negative.'] },
      averageRating: { type: Number, min: [0, 'Average rating cannot be negative.'], max: [5, 'Average rating cannot exceed 5.'] },
      productCount: { type: Number, min: [0, 'Product count cannot be negative.'] }
  },
  settings: {
      autoAcceptOrders: { type: Boolean, default: false },
      minOrderAmount: { type: Number, min: [0, 'Minimum order amount cannot be negative.'] },
      shippingMethods: [{
          name: { type: String, required: [true, 'Shipping method name is required.'] },
          price: { type: Number, min: [0, 'Shipping price cannot be negative.'] },
          estimatedDays: { type: Number, min: [1, 'Estimated delivery days must be at least 1.'] }
      }]
  }
}, {
  timestamps: true
});
const Vendor = mongoose.model<Vendor>('Vendor', vendorSchema)


export default Vendor;