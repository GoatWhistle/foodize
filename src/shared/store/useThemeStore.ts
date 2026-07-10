import { create } from "zustand";
import { persist } from "zustand/middleware";

const STORAGE_KEY = "foodize-theme";

export type ThemePreference = "light" | "dark" | "system";
type ResolvedTheme = "light" | "dark";

const getSystemTheme = (): ResolvedTheme =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";

const applyResolved = (theme: ThemePreference): void => {
  if (typeof document === "undefined") return;
  const resolved = theme === "system" ? getSystemTheme() : theme;
  document.documentElement.setAttribute("data-theme", resolved);
};

export interface ThemeStoreState {
  theme: ThemePreference;
  toggleTheme: () => void;
  setTheme: (theme: ThemePreference) => void;
  initTheme: () => void;
}

export const useThemeStore = create<ThemeStoreState>()(
  persist(
    (set, get) => {
      let systemThemeHandler: (() => void) | null = null;

      return {
        theme: "system",

        toggleTheme: () => {
          const next = get().theme === "light" ? "dark" : "light";
          set({ theme: next });
          applyResolved(next);
        },

        setTheme: (theme) => {
          set({ theme });
          applyResolved(theme);
        },

        initTheme: () => {
          const saved = get().theme;
          applyResolved(saved);
          if (typeof window === "undefined") return;
          const mq = window.matchMedia("(prefers-color-scheme: dark)");
          if (systemThemeHandler) {
            mq.removeEventListener("change", systemThemeHandler);
            systemThemeHandler = null;
          }
          if (saved === "system") {
            systemThemeHandler = () => applyResolved("system");
            mq.addEventListener("change", systemThemeHandler);
          }
        },
      };
    },
    { name: STORAGE_KEY },
  ),
);
