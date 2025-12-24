import { useQuery } from '@tanstack/react-query';
import { useUserStore } from '@/stores/useUserStore';
import { cartService } from '@/utils/cartService';

export const useCartQuery = () => {
  const user = useUserStore((state) => state.user);
  
  return useQuery({
    queryKey: ['cart'],
    queryFn: cartService.getCart,
    enabled: !!user,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: false,
    refetchOnWindowFocus: false,
  });
};

export const useCartSummaryQuery = () => {
  const user = useUserStore((state) => state.user);
  
  return useQuery({
    queryKey: ['cartSummary'],
    queryFn: cartService.getCartSummary,
    enabled: !!user,
    staleTime: 1 * 60 * 1000, // 1 minute
    gcTime: 3 * 60 * 1000, // 3 minutes
    retry: false,
    refetchOnWindowFocus: false,
  });
};