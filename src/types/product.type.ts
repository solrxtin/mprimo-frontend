import { Types } from "mongoose";

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
      price?: number;
      salePrice: number;
      quantity: number;
    };
    auction?: {
      startBidPrice?: number;
      reservePrice?: number;
      buyNowPrice?: number;
      startTime: Date;
      endTime: Date;
      quantity: number;
      bidIncrement?: number;
      isStarted?: boolean;
      isExpired?: boolean;
    };
  };
};

type VariantOptionType = {
  value: string;
  price: number;
  inventory: number;
};

type VariantType = {
  name: string;
  options: VariantOptionType[];
};

type ReviewType = {
  userId: Types.ObjectId;
  rating: number;
  comment: string;
  createdAt: Date;
};

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
  country: Types.ObjectId;
  inventory: InventoryType;
  images: string[];
  specifications: SpecificationType[];
  shipping: ShippingType;
  status: "active" | "inactive" | "outOfStock";
  reviews: ReviewType[];
  rating: number;
  variants: VariantType[];
  analytics: AnalyticsType;
  offers: OfferType[];
  bids: BidType[];
  createdAt?: Date;
  updatedAt?: Date;
};