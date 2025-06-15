import { toastConfigError } from "@/app/config/toast.config";
import { fetchWithAuth } from "@/utils/fetchWithAuth";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "react-toastify";

interface ProductData {
  name: string;
  brand: string;
  description: string;
  condition: "new" | "used" | "refurbished";
  conditionDescription?: string;
  category: {
    main: string;
    sub: string[];
    path: string[];
  };
  country: string;
  inventory: {
    sku?: string;
    lowStockAlert?: number;
    listing: {
      type: "instant" | "auction";
      instant?: {
        acceptOffer: boolean;
        price: number;
        salePrice: number;
        quantity: number;
      };
      auction?: {
        startBidPrice: number;
        reservePrice: number;
        buyNowPrice?: number;
        startTime: Date;
        endTime: Date;
        quantity: number;
        bidIncrement?: number;
      };
    };
  };
  images: string[];
  specifications: Array<{
    key: string;
    value: string;
  }>;
  shipping: {
    weight: number;
    unit: "kg" | "lbs";
    dimensions: {
      length: number;
      width: number;
      height: number;
    };
    restrictions?: string[];
  };
  variants?: Array<{
    name: string;
    options: Array<{
      value: string;
      price: number;
      inventory: number;
    }>;
  }>;
}

export const useCreateProduct = () => {
  return useMutation({
    mutationFn: async (productData: ProductData) => {
      const response = await fetchWithAuth(
        "http://localhost:5800/api/v1/products",
        {
          method: "POST",
          body: JSON.stringify(productData),
        }
      );
      if (!response.ok) {
        const errorData = await response.json();
        toast.error(errorData.message, toastConfigError);
        throw new Error(errorData.message);
      }

      return response.json();
    },
  });
};
