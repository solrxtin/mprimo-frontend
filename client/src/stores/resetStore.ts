import { useProductStore } from "./useProductStore";
import { useUserStore } from "./useUserStore";


export const resetAllStores = async () => {
  // reset each store
  useUserStore.getState().resetStore();
  useProductStore.getState().resetStore();
  // ...any other persisted stores
};