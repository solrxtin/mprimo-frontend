import { User } from "@/types/user.type";
import { create } from "zustand";
import {
    persist,
    createJSONStorage,
    type PersistOptions,
  } from "zustand/middleware";

interface UserState {
  user: User | null;
  setUser: (user: User | null) => void;
}

type PersistedState = Pick<UserState, "user">;


// Define persist configuration
const persistConfig: PersistOptions<UserState, PersistedState> = {
    name: "user-storage",
    storage: createJSONStorage(() => localStorage),
    partialize: (state) => ({ user: state.user }),
    version: 1,
  };
  

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      user: null,
      setUser: (user: User | null) => set({ user }),
    }),
    persistConfig
  )
);
