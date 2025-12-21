import { create } from 'zustand';

interface OrderStore {
  selectedOrder: any | null;
  setSelectedOrder: (order: any) => void;
  clearSelectedOrder: () => void;
}

export const useOrderStore = create<OrderStore>((set) => ({
  selectedOrder: null,
  setSelectedOrder: (order) => set({ selectedOrder: order }),
  clearSelectedOrder: () => set({ selectedOrder: null }),
}));