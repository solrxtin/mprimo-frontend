import mongoose, { Schema } from 'mongoose';

interface Transaction {
  amount: string;
  type: 'incoming' | 'outgoing';
  createdAt: Date;
}


export interface IWallet {
  _id?: Schema.Types.ObjectId;
  userId: Schema.Types.ObjectId;
  address: string;
  privateKey: string;
  usdc: {
    balance: string;
    transactions: Transaction[];
  };
  usdt: {
    balance: string;
    transactions: Transaction[];
  };
  createdAt: Date;
}

const transactionSchema = new Schema(
  {
    amount: { type: String, required: true },
    type: { type: String, required: true, enum: ["incoming", "outgoing"] },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false } // Disable _id for embedded subdocs (optional)
);

const tokenSchema = new Schema(
  {
    balance: { type: String, default: "0" },
    transactions: { type: [transactionSchema], default: [] },
  },
  { _id: false }
);

const CryptoWalletSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  address: { type: String, required: true },
  privateKey: { type: String, required: true, select: false }, // Encrypted
  usdc: { type: tokenSchema, required: true },
  usdt: { type: tokenSchema, required: true },
  createdAt: { type: Date, default: Date.now },
});


export default mongoose.model('CryptoWallet', CryptoWalletSchema);