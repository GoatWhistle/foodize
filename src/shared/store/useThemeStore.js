import { create } from "zustand";
import { persist } from "zustand/middleware";

const STORAGE_KEY = "foodize-theme";

const getSystemTheme = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";

const applyResolved = (theme) => {
  if (typeof document === "undefined") return;
  const resolved = theme === "system" ? getSystemTheme() : theme;
  document.documentElement.setAttribute("data-theme", resolved);
};

export const useThemeStore = create(
  persist(
    (set, get) => ({
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
        if (saved === "system") {
          const mq = window.matchMedia("(prefers-color-scheme: dark)");
          const handler = () => applyResolved("system");
          mq.addEventListener("change", handler);
        }
      },
    }),
    { name: STORAGE_KEY },
  ),
);
