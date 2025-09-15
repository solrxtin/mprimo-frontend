import mongoose, { Document, Types } from "mongoose";

export interface IInventoryLog extends Document {
  productId: Types.ObjectId;
  variantSku: string;
  changeType: "restock" | "sale" | "adjustment" | "return";
  quantityBefore: number;
  quantityAfter: number;
  quantityChanged: number;
  reason?: string;
  orderId?: Types.ObjectId;
  userId?: Types.ObjectId;
  createdAt: Date;
}

const inventoryLogSchema = new mongoose.Schema<IInventoryLog>({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
    index: true
  },
  variantSku: {
    type: String,
    required: true,
    index: true
  },
  changeType: {
    type: String,
    enum: ["restock", "sale", "adjustment", "return"],
    required: true
  },
  quantityBefore: {
    type: Number,
    required: true
  },
  quantityAfter: {
    type: Number,
    required: true
  },
  quantityChanged: {
    type: Number,
    required: true
  },
  reason: String,
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Order"
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }
}, {
  timestamps: true
});

inventoryLogSchema.index({ productId: 1, createdAt: -1 });
inventoryLogSchema.index({ variantSku: 1, createdAt: -1 });

const InventoryLog = mongoose.model<IInventoryLog>("InventoryLog", inventoryLogSchema);
export default InventoryLog;