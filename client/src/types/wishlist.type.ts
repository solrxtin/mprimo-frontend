export interface WishlistItem {
  _id: string;
  productId: {
    _id: string;
    name: string;
    images: string[];
    variants: Array<{
      options: Array<{
        price: number;
        salePrice?: number;
      }>;
    }>;
  };
  priceWhenAdded: number;
  addedAt: string;
}

export interface WishlistResponse {
  success: boolean;
  data: {
    items: WishlistItem[];
  };
}
