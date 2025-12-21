import { fetchWithAuth } from './fetchWithAuth';
import { getApiUrl } from '@/config/api';

export interface Notification {
  _id: string;
  userId: string;
  title: string;
  message: string;
  type: 'order' | 'payment' | 'product' | 'system' | 'promotion';
  case: string;
  read: boolean;
  data?: {
    redirectUrl?: string;
    entityId?: string;
    entityType?: string;
  };
  createdAt: string;
}

export const notificationService = {
  async getUserNotifications(page = 1, limit = 20, unreadOnly = false) {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(unreadOnly && { unreadOnly: 'true' })
    });
    
    return fetchWithAuth(getApiUrl(`notifications?${params}`));
  },

  async markAsRead(notificationId: string) {
    return fetchWithAuth(getApiUrl(`notifications/${notificationId}/read`), {
      method: 'PATCH',
    });
  },

  async markAllAsRead() {
    return fetchWithAuth(getApiUrl('notifications/mark-all-read'), {
      method: 'PATCH',
    });
  },

  async deleteNotification(notificationId: string) {
    return fetchWithAuth(getApiUrl(`notifications/${notificationId}`), {
      method: 'DELETE',
    });
  },

  async getUnreadCount() {
    return fetchWithAuth(getApiUrl('notifications/unread-count'));
  }
};