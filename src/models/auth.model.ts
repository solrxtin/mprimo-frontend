import { ObjectId, Schema, model } from "mongoose";


interface IRefreshToken {
  token: string;
  userId: ObjectId;
  expiresAt: Date;
}

// Refresh token model (using Mongoose as example)
const RefreshTokenSchema = new Schema<IRefreshToken>({
    userId: { 
      type: Schema.Types.ObjectId, 
      ref: 'User', 
      required: true,
      unique: true // Ensure one token per user
    },
    token: { 
      type: String, 
      required: true 
    },
    expiresAt: { 
      type: Date, 
      required: true 
    }
  });
  
  // Add index for better query performance
  // RefreshTokenSchema.index({ userId: 1 });

const RefreshToken = model<IRefreshToken>("RefreshToken", RefreshTokenSchema);

export default RefreshToken;
