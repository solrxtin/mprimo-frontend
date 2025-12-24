import { useQuery } from '@tanstack/react-query';
import { fetchWithAuth } from '@/utils/fetchWithAuth';
import { getApiUrl } from '@/config/api';
import { useUserStore } from '@/stores/useUserStore';

const fetchUserCurrency = async (): Promise<{ success: boolean; currency: string }> => {
  const response = await fetchWithAuth(getApiUrl('users/currency'));
  if (!response.ok) throw new Error('Failed to fetch user currency');
  return response.json();
};

export const useUserCurrency = () => {
  const { user } = useUserStore();
  
  return useQuery({
    queryKey: ['userCurrency'],
    queryFn: fetchUserCurrency,
    enabled: !!user,
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: 1,
  });
};
