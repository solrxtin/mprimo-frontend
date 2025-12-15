import { create } from "zustand";
import { persist } from "zustand/middleware";
import { ProductType } from "@/types/product.type";
import { Wishlist, WishlistItem } from "@/types/wishlist.type";

interface WishlistState {
  items: Wishlist[];
  isLoading: boolean;

  // Actions
  setItems: (items: Wishlist[]) => void;
  addItem: (item: Wishlist) => void;
  removeItem: (productId: string) => void;
  clearWishlist: () => void;
  setLoading: (loading: boolean) => void;

  // Getters
  getWishlistLength: () => number;
  isInWishlist: (productId: string) => boolean;
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],
      isLoading: false,

      setItems: (items) => set({ items }),

      addItem: (item) => {
        const { items } = get();
        const existingItem = items.find(
          (existingItem) => {
            const existingId = typeof existingItem.productId === 'string' ? existingItem.productId : existingItem.productId._id;
            const newId = typeof item.productId === 'string' ? item.productId : item.productId._id;
            return existingId === newId;
          }
        );
        if (!existingItem) {
          set({ items: [...items, item] });
        }
      },

      removeItem: (productId) => {
        const { items } = get();
        const updatedItems = items.filter(
          (item) => {
            const itemId = typeof item.productId === 'string' ? item.productId : item.productId._id;
            return itemId !== productId;
          }
        );
        set({ items: updatedItems });
      },

      clearWishlist: () => {
        set({ items: [] });
      },

      setLoading: (loading) => set({ isLoading: loading }),

      getWishlistLength: () => {
        return get().items.length;
      },

      isInWishlist: (productId) => {
        const { items } = get();
        return items.some(
          (item) => String(item.productId) === String(productId)
        );
      },
    }),
    {
      name: "mprimo-wishlist",
      partialize: (state) => ({
        items: state.items,
      }),
    }
  )
);
