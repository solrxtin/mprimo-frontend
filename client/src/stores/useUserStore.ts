import { User } from "@/types/user.type";
import ICryptoWallet from "@/types/wallet.type";
import { create } from "zustand";
import {
  persist,
  createJSONStorage,
  type PersistOptions,
} from "zustand/middleware";

interface UserState {
  user: User | null;
  setUser: (user: User | null) => void;
  deviceId: string | null;
  setDeviceId: (deviceId: any) => void;
  wallet: ICryptoWallet | null;
  setWallet: (wallet: ICryptoWallet | null) => void;
}

type PersistedState = Pick<UserState, "user" | "deviceId" | "wallet" >;


// Define persist configuration
const persistConfig: PersistOptions<UserState, PersistedState> = {
  name: "user-storage",
  storage: createJSONStorage(() => localStorage),
  partialize: (state) => ({
    user: state.user,
    deviceId: state.deviceId,
    wallet: state.wallet,
  }),
  version: 1,
};

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      user: null,
      setUser: (user: User | null) => set({ user }),
      deviceId: null,
      setDeviceId: (deviceId: string | null) => set({ deviceId }),
      wallet: null,
      setWallet: (wallet: ICryptoWallet | null) => set({wallet}),
    }),
    persistConfig
  )
);
