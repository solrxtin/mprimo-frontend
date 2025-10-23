import { fetchWithAuth } from './fetchWithAuth';

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
    price: number;
    variantId?: string;
  }>;
  pricing: {
    subtotal: number;
    shipping: number;
    tax: number;
    discount: number;
    total: number;
    currency: string;
  };
  paymentData: {
    type: 'stripe' | 'crypto' | 'bank-transfer';
    paymentIntentId?: string;
    tokenType?: string;
    amount?: number;
  };
  address: {
    firstName: string;
    lastName: string;
    email: string;
    country: string;
    state: string;
    postalCode: string;
    homeAddress: string;
    isDefault?: boolean;
  };
}

export const checkoutService = {
  async createOrder(data: CheckoutData) {
    return fetchWithAuth('/api/v1/orders/make-order', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  async createPaymentIntent(amount: number, currency: string = 'usd') {
    return fetchWithAuth('/api/v1/payments/create-intent', {
      method: 'POST',
      body: JSON.stringify({ amount, currency }),
    });
  },

  // : Promise<CartValidationResponse>
  async validateCart() {
    const response = await fetchWithAuth('http://localhost:5800/api/v1/checkout/validate', {
      method: 'POST',
    });
    return response.json();
  },

  async getShippingRates(address: any) {
    return fetchWithAuth('/api/v1/checkout/shipping-rates', {
      method: 'POST',
      body: JSON.stringify({ address }),
    });
  }
};