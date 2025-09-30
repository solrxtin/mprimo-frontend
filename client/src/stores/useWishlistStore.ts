import { create } from "zustand";
import { persist } from "zustand/middleware";
import { ProductType } from "@/types/product.type";
import { WishlistItem } from "@/types/wishlist.type";

interface WishlistState {
  items: WishlistItem[];
  isLoading: boolean;

  // Actions
  setItems: (items: WishlistItem[]) => void;
  addItem: (item: WishlistItem) => void;
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
        const existingItem = items.find((existingItem) => existingItem.productId._id === item.productId._id);
        if (!existingItem) {
          set({ items: [...items, item] });
        }
      },

      removeItem: (productId) => {
        const { items } = get();
        const updatedItems = items.filter((item) => item.productId._id !== productId);
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
        return items.some((item) => item.productId?._id === productId);
      },
    }),
    {
      name: "mprimo-wishlist",
      storage: {
        getItem: (name) => {
          const value = localStorage.getItem(name);
          return value ? JSON.parse(value) : null;
        },
        setItem: (name, value) => localStorage.setItem(name, JSON.stringify(value)),
        removeItem: (name) => localStorage.removeItem(name),
      },
    }
  )
);