import { create } from "zustand";
import { persist } from "zustand/middleware";
import { CartItem, CartSummary, ProductType } from "@/types/product.type";

interface CartState {
  items: CartItem[];
  summary: CartSummary;

  // Actions
  addToCart: (
    product: ProductType,
    quantity?: number,
    selectedVariant?: {
      variantId: string;
      optionId: string;
      variantName: string;
      optionValue: string;
      price: number;
    }
  ) => void;

  removeFromCart: (productId: string, variantKey?: string) => void;
  updateQuantity: (
    productId: string,
    quantity: number,
    variantKey?: string
  ) => void;
  increaseQuantity: (productId: string, variantKey?: string) => void;
  decreaseQuantity: (productId: string, variantKey?: string) => void;
  clearCart: () => void;

  // Getters
  getCartLength: () => number;
  getCartQuantity: () => number;
  getItemQuantity: (productId: string, variantKey?: string) => number;
  isInCart: (productId: string, variantKey?: string) => boolean;
  getCartItem: (productId: string, variantKey?: string) => CartItem | undefined;

  // Private methods
  calculateSummary: () => void;
  generateCartItemKey: (productId: string, variantKey?: string) => string;
}

const calculateCartSummary = (items: CartItem[]): CartSummary => {
  const subtotal = items.reduce((total, item) => {
    const price = item.selectedVariant?.price || 0;
    return total + price * item.quantity;
  }, 0);

  return {
    subtotal,
    total: subtotal, // yoo we will add taxes, shipping, discounts here
    totalItems: items.length,
    totalQuantity: items.reduce((total, item) => total + item.quantity, 0),
  };
};

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      summary: {
        subtotal: 0,
        total: 0,
        totalItems: 0,
        totalQuantity: 0,
      },

      generateCartItemKey: (productId: string, variantKey?: string) => {
        return variantKey ? `${productId}-${variantKey}` : productId;
      },

      calculateSummary: () => {
        const { items } = get();
        const summary = calculateCartSummary(items);
        set({ summary });
      },

      addToCart: (product, quantity = 1, selectedVariant) => {
        const { items, calculateSummary, generateCartItemKey } = get();

        const variantKey = selectedVariant
          ? `${selectedVariant.variantId}-${selectedVariant.optionId}`
          : undefined;

        const itemKey = generateCartItemKey(product._id!, variantKey);

        const existingItemIndex = items.findIndex((item) => {
          const existingVariantKey = item.selectedVariant
            ? `${item.selectedVariant.variantId}-${item.selectedVariant.optionId}`
            : undefined;
          return (
            generateCartItemKey(item.product?._id ?? "", existingVariantKey) ===
            itemKey
          );
        });

        if (existingItemIndex > -1) {
          const updatedItems = [...items];
          updatedItems[existingItemIndex].quantity += quantity;
          set({ items: updatedItems });
        } else {
          // Add new item
          const newItem: CartItem = {
            product,
            quantity,
            selectedVariant,
            addedAt: new Date().toISOString(),
          };
          set({ items: [...items, newItem] });
        }

        calculateSummary();
      },

      removeFromCart: (productId, variantKey) => {
        const { items, calculateSummary, generateCartItemKey } = get();
        const itemKey = generateCartItemKey(productId, variantKey);

        const updatedItems = items.filter((item) => {
          const existingVariantKey = item.selectedVariant
            ? `${item.selectedVariant.variantId}-${item.selectedVariant.optionId}`
            : undefined;
          return (
            generateCartItemKey(item.product._id ?? "", existingVariantKey) !==
            itemKey
          );
        });

        set({ items: updatedItems });
        calculateSummary();
      },

      updateQuantity: (productId, quantity, variantKey) => {
        if (quantity <= 0) {
          get().removeFromCart(productId, variantKey);
          return;
        }

        const { items, calculateSummary, generateCartItemKey } = get();
        const itemKey = generateCartItemKey(productId, variantKey);

        const updatedItems = items.map((item) => {
          const existingVariantKey = item.selectedVariant
            ? `${item.selectedVariant.variantId}-${item.selectedVariant.optionId}`
            : undefined;

          if (
            generateCartItemKey(item.product._id ?? "", existingVariantKey) ===
            itemKey
          ) {
            return { ...item, quantity };
          }
          return item;
        });

        set({ items: updatedItems });
        calculateSummary();
      },

      increaseQuantity: (productId, variantKey) => {
        const { getItemQuantity, updateQuantity } = get();
        const currentQuantity = getItemQuantity(productId, variantKey);
        updateQuantity(productId, currentQuantity + 1, variantKey);
      },

      decreaseQuantity: (productId, variantKey) => {
        const { getItemQuantity, updateQuantity } = get();
        const currentQuantity = getItemQuantity(productId, variantKey);
        if (currentQuantity > 1) {
          updateQuantity(productId, currentQuantity - 1, variantKey);
        } else {
          get().removeFromCart(productId, variantKey);
        }
      },

      clearCart: () => {
        set({
          items: [],
          summary: { subtotal: 0, total: 0, totalItems: 0, totalQuantity: 0 },
        });
      },

      getCartLength: () => {
        return get().summary.totalItems;
      },

      getCartQuantity: () => {
        return get().summary.totalQuantity;
      },

      getItemQuantity: (productId, variantKey) => {
        const { items, generateCartItemKey } = get();
        const itemKey = generateCartItemKey(productId, variantKey);

        const item = items.find((item) => {
          const existingVariantKey = item.selectedVariant
            ? `${item.selectedVariant.variantId}-${item.selectedVariant.optionId}`
            : undefined;
          return (
            generateCartItemKey(item.product._id ?? "", existingVariantKey) ===
            itemKey
          );
        });

        return item?.quantity || 0;
      },

      isInCart: (productId, variantKey) => {
        return get().getItemQuantity(productId, variantKey) > 0;
      },

      getCartItem: (productId, variantKey) => {
        const { items, generateCartItemKey } = get();
        const itemKey = generateCartItemKey(productId, variantKey);

        return items.find((item) => {
          const existingVariantKey = item.selectedVariant
            ? `${item.selectedVariant.variantId}-${item.selectedVariant.optionId}`
            : undefined;
          return (
            generateCartItemKey(item.product._id ?? "", existingVariantKey) ===
            itemKey
          );
        });
      },
    }),
     {
      name: "mprimo-cart", // storage key
      storage: {
        getItem: (name) => {
          const value = sessionStorage.getItem(name);
          return value ? JSON.parse(value) : null;
        },
        setItem: (name, value) => sessionStorage.setItem(name, JSON.stringify(value)),
        removeItem: (name) => sessionStorage.removeItem(name),
      },
      // Removed partialize to fix type error
    }
  )
);
