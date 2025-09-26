import { useState, useEffect } from 'react';
import { fetchWithAuth } from '@/utils/fetchWithAuth';

interface NotificationPreferences {
  newStockAlert: boolean;
  lowStockAlert: boolean;
  orderStatusAlert: boolean;
  pendingReviews: boolean;
  paymentAlert: boolean;
}

interface Notification {
  _id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

const BASE_URL = 'http://localhost:5800/api/v1';

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    newStockAlert: true,
    lowStockAlert: true,
    orderStatusAlert: true,
    pendingReviews: true,
    paymentAlert: true,
  });
  const [loading, setLoading] = useState(false);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const response = await fetchWithAuth(`${BASE_URL}/users/notifications`);
      const data = await response.json();
      if (data.success) {
        setNotifications(data.data);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const updatePreferences = async (newPreferences: NotificationPreferences) => {
    try {
      const response = await fetchWithAuth(`${BASE_URL}/users/notifications/preferences`, {
        method: 'PATCH',
        body: JSON.stringify(newPreferences)
      });
      const data = await response.json();
      if (data.success) {
        setPreferences(newPreferences);
      }
    } catch (error) {
      console.error('Error updating preferences:', error);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  return {
    notifications,
    preferences,
    loading,
    updatePreferences,
    refetch: fetchNotifications
  };
};