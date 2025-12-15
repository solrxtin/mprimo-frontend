import { useProductStore } from "./useProductStore";
import { useUserStore } from "./useUserStore";
import { useVendorStore } from "./useVendorStore";
import { useCartStore } from "./cartStore";


export const resetAllStores = async () => {
  // Clear cart BEFORE resetting user (requires auth)
  await useCartStore.getState().clearCart(); // This actually isn't gonna work
  
  // Then reset all stores
  useUserStore.getState().resetStore();
  useProductStore.getState().resetStore();
  useVendorStore.getState().resetStore();
};