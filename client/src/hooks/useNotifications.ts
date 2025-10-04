import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { toastConfigError, toastConfigSuccess } from '@/app/config/toast.config';
import { fetchWithAuth } from '@/utils/fetchWithAuth';

interface NotificationPreferences {
  stockAlert: boolean;
  orderStatus: boolean;
  pendingReviews: boolean;
  paymentUpdates: boolean;
  newsletter: boolean;
}

interface Notification {
  _id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5800/api/v1';

const notificationApi = {
  getNotifications: async (): Promise<{ notifications: Notification[] }> => {
    const response = await fetchWithAuth(`${API_BASE}/users/notifications`);
    if (!response.ok) throw new Error('Failed to fetch notifications');
    return response.json();
  },

  updatePreferences: async (preferences: NotificationPreferences) => {
    const response = await fetchWithAuth(`${API_BASE}/users/notifications/preferences`, {
      method: 'PATCH',
      body: JSON.stringify(preferences),
    });
    if (!response.ok) throw new Error('Failed to update preferences');
    return response.json();
  },
};

export const useNotifications = () => {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: notificationApi.getNotifications,
    staleTime: 2 * 60 * 1000,
  });
};

export const useUpdateNotificationPreferences = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: notificationApi.updatePreferences,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
      toast.success('Notification preferences updated', toastConfigSuccess);
    },
    onError: () => {
      toast.error('Failed to update preferences', toastConfigError);
    },
  });
};