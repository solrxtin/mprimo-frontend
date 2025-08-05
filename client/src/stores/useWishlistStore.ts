import { create } from "zustand";
import { persist } from "zustand/middleware";
import { ProductType } from "@/types/product.type";

interface WishlistItem {
  product: ProductType;
  addedAt: string;
}

interface WishlistState {
  items: WishlistItem[];

  // Actions
  addToWishlist: (product: ProductType) => void;
  removeFromWishlist: (productId: string) => void;
  clearWishlist: () => void;

  // Getters
  getWishlistLength: () => number;
  isInWishlist: (productId: string) => boolean;
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],

      addToWishlist: (product) => {
        const { items } = get();
        const existingItem = items.find((item) => item.product._id === product._id);

        if (!existingItem) {
          const newItem: WishlistItem = {
            product,
            addedAt: new Date().toISOString(),
          };
          set({ items: [...items, newItem] });
        }
      },

      removeFromWishlist: (productId) => {
        const { items } = get();
        const updatedItems = items.filter((item) => item.product._id !== productId);
        set({ items: updatedItems });
      },

      clearWishlist: () => {
        set({ items: [] });
      },

      getWishlistLength: () => {
        return get().items.length;
      },

      isInWishlist: (productId) => {
        const { items } = get();
        return items.some((item) => item.product._id === productId);
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