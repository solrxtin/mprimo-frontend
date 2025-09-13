import mongoose, { Document, Types } from "mongoose";

export interface IPromotion extends Document {
  title: string;
  description: string;
  status: "active" | "inactive" | "expired";
  startDate: Date;
  endDate: Date;
  createdBy: Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

const promotionSchema = new mongoose.Schema<IPromotion>({
  title: {
    type: String,
    required: true,
    maxlength: 100
  },
  description: {
    type: String,
    required: true,
    maxlength: 500
  },
  status: {
    type: String,
    enum: ["active", "inactive", "expired"],
    default: "inactive"
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  }
}, {
  timestamps: true
});

const Promotion = mongoose.model<IPromotion>("Promotion", promotionSchema);
export default Promotion;