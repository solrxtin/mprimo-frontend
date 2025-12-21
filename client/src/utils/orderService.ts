import { fetchWithAuth } from './fetchWithAuth';
import { getApiUrl } from '@/config/api';

export interface Order {
  _id: string;
  userId: string;
  items: Array<{
    productId: {
      _id: string;
      name: string;
      images: string[];
      price: number;
    };
    quantity: number;
    price: number;
    variantId?: string;
  }>;
  
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'failed';
  shipping: {
    address: any;
    carrier: string;
    trackingNumber: string;
    status: string;
    estimatedDelivery: string;
  };
  paymentId: string;
  createdAt: string;
  updatedAt: string;
}

export const orderService = {
  async getUserOrders(page = 1, limit = 10, status?: string) {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(status && { status })
    });
    
    const response = await fetchWithAuth(getApiUrl(`orders/user?${params}`));
    const data = await response.json();
    console.log("Fetched user orders:", data);
    return data
  },

  async getOrderById(orderId: string) {
    const response = await fetchWithAuth(getApiUrl(`orders/${orderId}`));
    const data = await response.json();
    console.log("Fetched order by ID:", data);
    return data;
  },

  async trackOrder(trackingNumber: string) {
    const response = await fetchWithAuth(getApiUrl(`orders/track/${trackingNumber}`));
    return response.json();
  },

  async cancelOrder(orderId: string, reason?: string) {
    const response = await fetchWithAuth(getApiUrl(`orders/${orderId}/cancel`), {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
    return response.json();
  },

  async requestRefund(orderId: string, reason: string, amount?: number) {
    const response = await fetchWithAuth(getApiUrl('refunds/request'), {
      method: 'POST',
      body: JSON.stringify({ orderId, reason, amount }),
    });
    return response.json();
  }
};