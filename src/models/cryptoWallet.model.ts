import mongoose, { Schema } from 'mongoose';

const CryptoWalletSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  address: { type: String, required: true },
  privateKey: { type: String, required: true, select: false }, // Encrypted
  balance: {
    USDC: { type: Number, default: 0 },
    USDT: { type: Number, default: 0 }
  },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('CryptoWallet', CryptoWalletSchema);