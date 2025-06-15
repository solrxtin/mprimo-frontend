type ListingType = "instant" | "auction";

type PopulatedCategory = {
  _id: string;
  name: string;
  slug: string;
}

type CategoryType = {
  main: string | PopulatedCategory;
  sub?: string[] | PopulatedCategory[];
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
      salePrice?: number;
      quantity?: number;
    };
    auction?: {
      startBidPrice?: number;
      reservePrice?: number;
      buyNowPrice?: number;
      startTime?: Date;
      endTime?: Date;
      quantity?: number;
      bidIncrement?: number;
    };
  };
};

type CountryType = {
  _id: string;
  name: string;
  currency: string;
}

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
  userId: string;
  rating: number;
  comment: string;
  createdAt: Date;
};

type BidType = {
  userId: string;
  amount: number;
  createdAt: Date;
  isWinning?: boolean;
};

type OfferType = {
  userId: string;
  userOffers: { amount: number; accepted: boolean; createdAt: Date }[];
  counterOffers: { amount: number; accepted: boolean; createdAt: Date }[];
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
  vendorId: string;
  name: string;
  brand: string;
  description: string;
  condition: "new" | "used" | "refurbished";
  conditionDescription?: string;
  category: CategoryType;
  country: string | CountryType;
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
  createdAt?: string;
  updatedAt?: string;
};