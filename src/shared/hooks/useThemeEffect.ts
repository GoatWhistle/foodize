import { useEffect } from "react";
import { useThemeStore } from "@shared/store/useThemeStore";
import type { ThemePreference } from "@shared/store/useThemeStore";

type ResolvedTheme = "light" | "dark";

const SYSTEM_QUERY = "(prefers-color-scheme: dark)";

const getSystemTheme = (): ResolvedTheme =>
  typeof window !== "undefined" && window.matchMedia(SYSTEM_QUERY).matches
    ? "dark"
    : "light";

const applyResolved = (theme: ThemePreference): void => {
  if (typeof document === "undefined") return;
  const resolved = theme === "system" ? getSystemTheme() : theme;
  document.documentElement.setAttribute("data-theme", resolved);
};

export const useThemeEffect = (): void => {
  const theme = useThemeStore((s) => s.theme);

  useEffect(() => {
    applyResolved(theme);
    if (theme !== "system" || typeof window === "undefined") return;
    const mq = window.matchMedia(SYSTEM_QUERY);
    const handler = (): void => { applyResolved("system"); };
    mq.addEventListener("change", handler);
    return () => { mq.removeEventListener("change", handler); };
  }, [theme]);
};
