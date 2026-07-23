import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export interface SecurityStoreState {
  biometricEnabled: boolean;
  unlocked: boolean;
  setBiometricEnabled: (enabled: boolean) => void;
  setUnlocked: (unlocked: boolean) => void;
}

export const useSecurityStore = create<SecurityStoreState>()(
  persist(
    (set) => ({
      biometricEnabled: false,
      unlocked: false,
      setBiometricEnabled: (enabled) => {
        set({ biometricEnabled: enabled });
      },
      setUnlocked: (unlocked) => {
        set({ unlocked });
      },
    }),
    {
      name: "security-storage",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ biometricEnabled: state.biometricEnabled }),
    },
  ),
);
