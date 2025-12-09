import mongoose, { Types, Document } from "mongoose";
import { IPayment } from "./payment.type";
import { ProductType } from "./product.type";

export interface ItemType {
  productId: Types.ObjectId | ProductType;
  variantId: string;
  quantity: number;
  price: number;
}

interface ItemTypePopulated extends ItemType {
  productId: ProductType; // Replace with your actual Product type
}


export interface IOrderPopulated extends IOrder {
  paymentId: IPayment; 
  items: ItemTypePopulated[];
}


export interface IConfirmationEntry {
  role: "buyer" | "courier";
  confirmedAt: Date;
}

export interface IReceivedItem {
  productId: Types.ObjectId;
  vendorId: Types.ObjectId;
  receivedAt?: Date;
  receivedBy?: Types.ObjectId; 
}

export interface IRejectedItem {
  productId: Types.ObjectId;
  vendorId: Types.ObjectId;
  reason: string;
  explanation: string;
  rejectedAt?: Date;
  rejectedBy?: Types.ObjectId; 
}

export interface IShipment {
  _id?: Types.ObjectId;
  vendorId: Types.ObjectId;
  items: Array<{
    productId: Types.ObjectId;
    variantId: string;
    quantity: number;
    price: number;
  }>;
  origin: {
    vendorLocation: {
      country: string;
      city: string;
      address: string;
      coordinates?: {
        latitude: number;
        longitude: number;
      };
    };
    warehouseId?: string;
  };
  shipping: {
    carrier: string;
    service: "standard" | "express" | "overnight";
    trackingNumber?: string;
    waybill?: string;
    status: "pending" | "processing" | "picked_up" | "in_transit" | "out_for_delivery" | "delivered" | "failed";
    estimatedPickup?: Date;
    actualPickup?: Date;
    estimatedDelivery: Date;
    actualDelivery?: Date;
    cost: {
      amount: number;
      currency: string;
    };
    customs?: {
      declarationNumber?: string;
      dutyPaid: boolean;
      customsStatus: "pending" | "cleared" | "held";
    };
  };
  deliveryAddress: {
    street: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IOrder extends Document {
  userId: Types.ObjectId;
  items: ItemType[];
  paymentId: Types.ObjectId | IPayment;
  shipments: IShipment[];
  deliveryCoordination: {
    estimatedDeliveryRange: {
      earliest: Date;
      latest: Date;
    };
    consolidatedDelivery: boolean;
    deliveryInstructions?: string;
  };
  status: "pending" | "processing" | "partially_shipped" | "shipped" | "delivered" | "cancelled";
  cancellationReason?: string;
  cancelledAt?: Date;
  confirmations?: IConfirmationEntry[];
  receivedItems: IReceivedItem[];
  rejectedItems: IRejectedItem[];
  refund?: {
    amount: number;
    reason: string;
    method: "original" | "store_credit" | "manual";
    status: "pending" | "completed" | "failed";
    transactionId: string;
    processedAt?: Date;
  };
  deliveryMethod: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IRefund {
  _id?: Types.ObjectId;
  orderId: Types.ObjectId;
  vendorId: Types.ObjectId;
  amount: number;
  reason?: string;
  processedBy: Types.ObjectId;
  processedAt: Date;
  status: "pending" | "processed" | "failed";
}
