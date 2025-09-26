import { fetchWithAuth } from './fetchWithAuth';

export interface AddToCartRequest {
  productId: string;
  quantity?: number;
  price?:number;
  variantId?: string;
  optionId?: string;
}


export interface UpdateCartRequest {
  productId: string;
  quantity: number;
}

export interface CartResponse {
  success: boolean;
  cart?: any[];
  data?: {
    items: any[];
    summary: {
      itemsCount: number;
      totalValue: number;
    };
  };
}

const BASE_URL = 'http://localhost:5800/api/v1';

export const cartService = {
  async getCart(): Promise<CartResponse> {
    const response = await fetchWithAuth(`${BASE_URL}/products/cart/user`);
    return response.json();
  },

  

  async addToCart(data: AddToCartRequest): Promise<CartResponse> {
    const response = await fetchWithAuth(`${BASE_URL}/products/cart`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
    return response.json();
  },

  async updateCartItem(productId: string, data: UpdateCartRequest): Promise<CartResponse> {
    const response = await fetchWithAuth(`${BASE_URL}/products/update-cart/${productId}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
    return response.json();
  },

  async clearCart(): Promise<CartResponse> {
    const response = await fetchWithAuth(`${BASE_URL}/products/clear`, {
      method: 'DELETE'
    });
    return response.json();
  },

  async getCartSummary(): Promise<{ success: boolean; data: { itemsCount: number; totalValue: number } }> {
    const response = await fetchWithAuth(`${BASE_URL}/products/cart-summary`);
    return response.json();
  },

  async syncCart(items: any[]): Promise<CartResponse> {
    // Sync multiple items to backend when user logs in
    for (const item of items) {
      await this.addToCart({
        productId: item.product._id,
        quantity: item.quantity,
        price: item.selectedVariant?.price,
        variantId: item.selectedVariant?.variantId,
        optionId: item.selectedVariant?.optionId
      });
    }
    
    return this.getCart();
  }
};