import { useEffect } from 'react';
import { useCartStore } from '@/stores/cartStore';
import { useUserStore } from '@/stores/useUserStore';

export const useCartSync = () => {
  const { user } = useUserStore();
  const isLoggedIn = !!user;
  const { syncCartOnLogin, loadCart } = useCartStore();

  useEffect(() => {
    if (isLoggedIn) {
      // When user logs in, sync local cart with backend
      syncCartOnLogin();
    } else {
      // When user logs out, load from local storage only
      loadCart();
    }
  }, [isLoggedIn, syncCartOnLogin, loadCart]);
};