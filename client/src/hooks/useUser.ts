import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { toastConfigError, toastConfigSuccess } from '@/app/config/toast.config';
import { fetchWithAuth } from '@/utils/fetchWithAuth';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5800/api/v1';

interface UserProfile {
  _id: string;
  email: string;
  profile: {
    firstName: string;
    lastName: string;
    phoneNumber: string;
    avatar?: string;
  };
  addresses: Array<{
    _id: string;
    type: 'shipping' | 'billing';
    street: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
    isDefault: boolean;
  }>;
}

interface Card {
  gateway: string;
  last4: string;
  brand: string;
  expMonth: number;
  expYear: number;
  cardHolderName: string;
  isDefault: boolean;
  addedAt: string;
}

interface RecentView {
  _id: string;
  name: string;
  images: string[];
  slug: string;
  variants: Array<{
    options: Array<{
      price: number;
    }>;
  }>;
}

const userApi = {
  getProfile: async (): Promise<{ user: UserProfile; fiatWallet: number; shippingDefaultAddress: any }> => {
    const response = await fetchWithAuth(`${API_BASE}/users/profile`);
    if (!response.ok) throw new Error('Failed to fetch profile');
    return response.json();
  },

  getRecentViews: async (limit = 10): Promise<{ recentViews: RecentView[] }> => {
    const response = await fetchWithAuth(`${API_BASE}/users/recent-views`, {
      method: 'POST',
      body: JSON.stringify({ limit }),
    });
    if (!response.ok) throw new Error('Failed to fetch recent views');
    return response.json();
  },

  addCard: async (cardData: {
    gateway: string;
    cardDetails: {
      last4: string;
      brand: string;
      expMonth: number;
      expYear: number;
      cardHolderName: string;
    };
    billingAddress: any;
    metadata: any;
  }) => {
    const response = await fetchWithAuth(`${API_BASE}/users/card`, {
      method: 'POST',
      body: JSON.stringify(cardData),
    });
    if (!response.ok) throw new Error('Failed to add card');
    return response.json();
  },

  removeCard: async (last4: string) => {
    const response = await fetchWithAuth(`${API_BASE}/users/card/${last4}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to remove card');
    return response.json();
  },

  setDefaultCard: async (last4: string) => {
    const response = await fetchWithAuth(`${API_BASE}/users/card`, {
      method: 'PATCH',
      body: JSON.stringify({ last4 }),
    });
    if (!response.ok) throw new Error('Failed to set default card');
    return response.json();
  },

  updateNotificationPreferences: async (preferences: any) => {
    const response = await fetchWithAuth(`${API_BASE}/users/notifications/preferences`, {
      method: 'PATCH',
      body: JSON.stringify(preferences),
    });
    if (!response.ok) throw new Error('Failed to update preferences');
    return response.json();
  },

  getCards: async (): Promise<{ cards: Card[]; defaultGateway: string }> => {
    const response = await fetchWithAuth(`${API_BASE}/users/cards`);
    if (!response.ok) throw new Error('Failed to fetch cards');
    return response.json();
  },
};

export const useUserProfile = () => {
  return useQuery({
    queryKey: ['userProfile'],
    queryFn: userApi.getProfile,
    staleTime: 5 * 60 * 1000,
  });
};

export const useRecentViews = (limit = 10) => {
  return useQuery({
    queryKey: ['recentViews', limit],
    queryFn: () => userApi.getRecentViews(limit),
    staleTime: 2 * 60 * 1000,
  });
};

export const useAddCard = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: userApi.addCard,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userCards'] });
      toast.success('Card added successfully', toastConfigSuccess);
    },
    onError: () => {
      toast.error('Failed to add card', toastConfigError);
    },
  });
};

export const useRemoveCard = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: userApi.removeCard,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userCards'] });
      toast.success('Card removed successfully', toastConfigSuccess);
    },
    onError: () => {
      toast.error('Failed to remove card', toastConfigError);
    },
  });
};

export const useSetDefaultCard = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: userApi.setDefaultCard,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userCards'] });
      toast.success('Default card updated', toastConfigSuccess);
    },
    onError: () => {
      toast.error('Failed to set default card', toastConfigError);
    },
  });
};

export const useUpdateNotificationPreferences = () => {
  return useMutation({
    mutationFn: userApi.updateNotificationPreferences,
    onSuccess: () => {
      toast.success('Notification preferences updated', toastConfigSuccess);
    },
    onError: () => {
      toast.error('Failed to update preferences', toastConfigError);
    },
  });
};

export const useUserCards = () => {
  return useQuery({
    queryKey: ['userCards'],
    queryFn: userApi.getCards,
    staleTime: 5 * 60 * 1000,
  });
};