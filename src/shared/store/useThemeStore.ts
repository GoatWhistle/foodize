import { create } from "zustand";
import { persist } from "zustand/middleware";

const STORAGE_KEY = "foodize-theme";

export type ThemePreference = "light" | "dark" | "system";

export interface ThemeStoreState {
  theme: ThemePreference;
  toggleTheme: () => void;
  setTheme: (theme: ThemePreference) => void;
}

export const useThemeStore = create<ThemeStoreState>()(
  persist(
    (set, get) => ({
      theme: "system",
      toggleTheme: () => {
        set({ theme: get().theme === "light" ? "dark" : "light" });
      },
      setTheme: (theme) => {
        set({ theme });
      },
    }),
    { name: STORAGE_KEY },
  ),
);
