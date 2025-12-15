import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchWithAuth } from '@/utils/fetchWithAuth';

import { API_CONFIG } from '@/config/api.config';

const BASE_URL = `${API_CONFIG.BASE_URL}/notifications`;

// Queries
export const useNotifications = (enabled: boolean = true) => {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const response = await fetchWithAuth(BASE_URL);
      return response.json();
    },
    enabled,
    retry: false,
    staleTime: 30000,
    refetchOnWindowFocus: false
  });
};

export const useNotificationById = (id: string) => {
  return useQuery({
    queryKey: ['notification', id],
    queryFn: async () => {
      const response = await fetchWithAuth(`${BASE_URL}/${id}`);
      return response.json();
    },
    enabled: !!id
  });
};

// Mutations
export const useMarkNotificationAsRead = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetchWithAuth(`${BASE_URL}/${id}`, {
        method: 'PATCH'
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  });
};

export const useMarkAllNotificationsAsRead = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      const response = await fetchWithAuth(BASE_URL, {
        method: 'PATCH'
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  });
};

export const useDeleteNotification = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetchWithAuth(`${BASE_URL}/${id}`, {
        method: 'DELETE'
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  });
};

export const useDeleteAllNotifications = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      const response = await fetchWithAuth(BASE_URL, {
        method: 'DELETE'
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  });
};

export const useBulkMarkAsRead = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (ids: string[]) => {
      const response = await fetchWithAuth(`${BASE_URL}/bulk`, {
        method: 'PATCH',
        body: JSON.stringify({ ids })
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  });
};

export const useBulkDeleteNotifications = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (ids: string[]) => {
      const response = await fetchWithAuth(`${BASE_URL}/bulk`, {
        method: 'DELETE',
        body: JSON.stringify({ ids })
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  });
};

export const useUpdateNotificationPreferences = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (preferences: any) => {
      const response = await fetchWithAuth(`${BASE_URL}/preferences`, {
        method: 'PUT',
        body: JSON.stringify(preferences)
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  });
};