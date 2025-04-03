import mongoose from "mongoose";
import {Vendor} from "../types/vendor.type";

const vendorSchema = new mongoose.Schema<Vendor>(
    {
        userId: { type: mongoose.Types.ObjectId, ref: 'User' },
        businessInfo: {
          name: String,
          registrationNumber: String,
          taxId: String,
          address: {
            street: String,
            city: String,
            state: String,
            country: String,
            postalCode: String
          }
        },
        bankDetails: {
          accountHolder: String,
          accountNumber: String,
          bankName: String,
          swiftCode: String
        },
        ratings: {
          average: Number,
          count: Number
        },
        status: { type: String, enum: ['pending', 'active', 'suspended'] },
        analytics: {
            totalSales: Number,
            totalRevenue: Number,
            averageRating: Number,
            productCount: Number
          },
         settings: {
            autoAcceptOrders: Boolean,
            minOrderAmount: Number,
            shippingMethods: [{
              name: String,
              price: Number,
              estimatedDays: Number
            }]
          }
    }, {
        timestamps: true
    }   
)
const Vendor = mongoose.model<Vendor>('Vendor', vendorSchema)


export default Vendor;