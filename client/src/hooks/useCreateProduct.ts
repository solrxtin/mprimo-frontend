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
        // price: number;
        // salePrice: number;
        // quantity: number;
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
    isDefault?: boolean;
    options: Array<{
      value: string;
      price: number;
      salePrice: number;
      quantity: number;
      sku: string;
      isDefault?: boolean;
    }>;
  }>;
}

export const useCreateProduct = () => {
  return useMutation({
    mutationFn: async (productData: ProductData) => {
      console.log('Sending product data:', productData);
      
      const response = await fetchWithAuth(
        "http://localhost:5800/api/v1/products",
        {
          method: "POST",
          body: JSON.stringify(productData),
        }
      );
      
      const responseData = await response.json();
      
      if (!response.ok) {
        console.error('Product creation failed:', responseData);
        toast.error(responseData.message || 'Failed to create product', toastConfigError);
        throw new Error(responseData.message || 'Failed to create product');
      }

      toast.success('Product created successfully!');
      return responseData;
    },
  });
};

// Hook for creating multiple products
export const useCreateMultipleProducts = () => {
  return useMutation({
    mutationFn: async (productsData: ProductData[]) => {
      const results = [];
      const errors = [];
      
      for (let i = 0; i < productsData.length; i++) {
        try {
          const response = await fetchWithAuth(
            "http://localhost:5800/api/v1/products",
            {
              method: "POST",
              body: JSON.stringify(productsData[i]),
            }
          );
          
          const responseData = await response.json();
          
          if (!response.ok) {
            errors.push({ index: i, error: responseData.message });
          } else {
            results.push(responseData);
          }
        } catch (error) {
          errors.push({ index: i, error: 'Network error' });
        }
      }
      
      if (errors.length > 0) {
        toast.error(`${errors.length} products failed to create`, toastConfigError);
      }
      
      if (results.length > 0) {
        toast.success(`${results.length} products created successfully!`);
      }
      
      return { results, errors };
    },
  });
};
