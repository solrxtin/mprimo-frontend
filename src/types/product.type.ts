import { Types } from "mongoose";
import { ICountry } from "../models/country.model";

type ListingType = "instant" | "auction";

type CategoryType = {
  main: Types.ObjectId;
  sub?: Types.ObjectId[];
  path?: string[];
};

type InventoryType = {
  sku?: string;
  lowStockAlert?: number;
  listing: {
    type: ListingType;
    instant?: {
      acceptOffer?: boolean;
      // Removed price, salePrice, quantity - handled by variants
    };
    auction?: {
      startBidPrice?: number;
      reservePrice?: number;
      buyNowPrice?: number;
      finalPrice?: number;
      startTime: Date;
      endTime: Date;
      quantity: number;
      bidIncrement?: number;
      isStarted?: boolean;
      isExpired?: boolean;
      reservePriceMet?: boolean;
      relistCount: number;
      priorityScore: number;
    };
  };
};

type VariantOptionType = {
  value: string;
  sku: string;
  price: number;
  salePrice?: number;
  quantity: number;
  isDefault?: boolean;
};

type VariantType = {
  name: string;
  isDefault?: boolean;
  options: VariantOptionType[];
};

export type ReviewType = {
  userId: Types.ObjectId;
  rating: number;
  comment: string;
  createdAt: Date;
  helpful: Types.Array<Types.ObjectId>;
  vendorResponse?: {
    response: string;
    createdAt: Date;
  };
};

export interface ReviewDocument extends ReviewType, Document {}

type BidType = {
  userId: Types.ObjectId;
  maxAmount: number;
  currentAmount: number;
  createdAt: Date;
  isWinning?: boolean;
};

type OfferType = {
  userId: Types.ObjectId;
  userOffers: { amount: number; accepted?: boolean; rejected?: boolean; createdAt?: Date }[];
  counterOffers: { amount: number; accepted?: boolean; rejected?: boolean; createdAt?: Date }[];
};

type AnalyticsType = {
  views: number;
  purchases: number;
  wishlist: number;
  addToCart: number;
  conversionRate: number;
};

type SpecificationType = {
  key: string;
  value: string;
};

type ShippingType = {
  weight: number;
  unit: "kg" | "lbs";
  dimensions: {
    length: number;
    width: number;
    height: number;
  };
  restrictions?: ("hazardous" | "fragile" | "perishable" | "oversized" | "none")[];
};

export type ProductType = {
  _id?: Types.ObjectId;
  vendorId: Types.ObjectId;
  name: string;
  slug: string;
  brand: string;
  description: string;
  condition: "new" | "used" | "refurbished";
  conditionDescription?: string;
  category: CategoryType;
  country: Types.ObjectId | ICountry;
  inventory: InventoryType;
  images: string[];
  specifications: SpecificationType[];
  shipping: ShippingType;
  status: "active" | "inactive" | "outOfStock";
  reviews: Types.DocumentArray<ReviewDocument>;
  rating: number;
  variants: VariantType[];
  analytics: AnalyticsType;
  offers: OfferType[];
  bids: BidType[];
  createdAt?: Date;
  updatedAt?: Date;
  isFeatured: boolean;
  featuredExpiry?: Date;
};