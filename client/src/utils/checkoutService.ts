import { fetchWithAuth } from './fetchWithAuth';
import { getApiUrl } from '@/config/api';

export interface CartValidationResponse {
  success: boolean;
  checkout: {
    items: any[];
    unavailableItems: Array<{
      productId: string;
      name: string;
      images: string[];
      variantId: string;
      optionId: string;
      quantity: number;
      price: number;
      addedAt: string;
      reason: string;
      availableQuantity: number;
    }>;
    pricing: {
      subtotal: number;
      tax: number;
      shipping: number;
      total: number;
      currency: string;
    };
    paymentMethods: any[];
    userWallet: any;
    canProceed: boolean;
  };
}

export interface CheckoutData {
  validatedItems: Array<{
    productId: string;
    quantity: number;
    price?: number;
    variantId?: string;
  }>;
  pricing: {
    subtotal: number;
    shipping: number;
    tax: number;
    total: number;
    currency: string;
  };
  paymentData: any;
  address: any;
}

export const checkoutService = {
  async createOrder(data: CheckoutData) {
    const response = await fetchWithAuth(getApiUrl('orders'), {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.json();
  },
  async createPaymentIntent(data: { paymentMethod: string, tokenType?: string }) {
    const response = await fetchWithAuth(getApiUrl('checkout/payment-intent'), {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.json();
  },

  // : Promise<CartValidationResponse>
  async validateCart() {
    const response = await fetchWithAuth(getApiUrl('checkout/validate'), {
      method: 'POST',
    });
    return response.json();
  },

  async getShippingRates(address: any) {
    return fetchWithAuth(getApiUrl('checkout/shipping-rates'), {
      method: 'POST',
      body: JSON.stringify({ address }),
    });
  }
};