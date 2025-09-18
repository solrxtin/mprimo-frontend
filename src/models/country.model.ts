import mongoose, { Document, Types } from "mongoose";
import { ISubscriptionPlan } from "./subscription-plan.model";
import { IPaymentOption } from "./payment-options.model";

type AccountType = {
  bankName: string;
  accountNumber: string;
  sortCodeOrIban: string;
  routingNumber: string;
  accountName: string;
  currency: string;
  reference: string;
  note: string;
};

export interface ICountry extends Document {
  name: string;
  currency: string;
  currencySymbol: string;
  exchangeRate: number;
  lastExchangeUpdate?: Date;
  delisted: boolean;
  mprimoAccountDetails?: AccountType;
  paymentOptions?: IPaymentOption[];
  localizedSubscritpionPlan: [
    {
      plan: ISubscriptionPlan;
      price: number;
      transactionFeePercent: number;
    }
  ];
  bidIncrement: number;
  createdBy: Types.ObjectId;
  updatedBy: Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

const CountrySchema = new mongoose.Schema<ICountry>(
  {
    name: { type: String, required: true, unique: true },
    currency: { type: String, required: true },
    currencySymbol: { type: String, required: true },
    exchangeRate: { type: Number, required: true, default: 1 }, // Rate to USD
    lastExchangeUpdate: { type: Date, default: Date.now },
    delisted: { type: Boolean, default: false },
    // mprimoAccountDetails: {
    //   name: { type: String, required: true },
    //   bankName: { type: String, required: true },
    //   accountNumber: { type: String, required: true },
    //   routingNumber: { type: String, required: true },
    //   sortCodeOrIban: { type: String, required: true },
    //   currency: { type: String, required: true },
    //   reference: { type: String, required: true },
    //   note: { type: String, required: true },
    // },
    localizedSubscritpionPlan: [
      {
        plan: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "SubscriptionPlan",
          required: true,
        },
        price: { type: Number, required: true },
        transactionFeePercent: { type: Number, default: 0, min: 0, max: 100 },
      },
    ],
    paymentOptions: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "PaymentOption"
    }],
    bidIncrement: { type: Number, default: 0.01, min: 0.01 },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Country = mongoose.model<ICountry>("Country", CountrySchema);

export default Country;
