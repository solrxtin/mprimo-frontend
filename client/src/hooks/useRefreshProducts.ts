import { useQueryClient } from '@tanstack/react-query';
import { useVendorStore } from '@/stores/useVendorStore';

export const useRefreshProducts = () => {
  const queryClient = useQueryClient();
  const { vendor } = useVendorStore();

  const refreshProducts = () => {
    // Invalidate and refetch vendor products
    if (vendor?._id) {
      queryClient.invalidateQueries({
        queryKey: ['vendorProducts', vendor._id]
      });
    }
    
    // Also invalidate general products queries
    queryClient.invalidateQueries({
      queryKey: ['products']
    });
  };

  return { refreshProducts };
};