import { fetchWithAuth } from './fetchWithAuth';

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
    
    return fetchWithAuth(`/api/v1/orders?${params}`);
  },

  async getOrderById(orderId: string) {
    return fetchWithAuth(`/api/v1/orders/${orderId}`);
  },

  async trackOrder(trackingNumber: string) {
    return fetchWithAuth(`/api/v1/orders/track/${trackingNumber}`);
  },

  async cancelOrder(orderId: string, reason?: string) {
    return fetchWithAuth(`/api/v1/orders/${orderId}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  },

  async requestRefund(orderId: string, reason: string, amount?: number) {
    return fetchWithAuth(`/api/v1/refunds/request`, {
      method: 'POST',
      body: JSON.stringify({ orderId, reason, amount }),
    });
  }
};