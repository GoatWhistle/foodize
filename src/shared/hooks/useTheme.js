import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "foodize-theme";

const getSystemTheme = () =>
  window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";

const applyTheme = (mode) => {
  const resolved = mode === "system" ? getSystemTheme() : mode;
  document.documentElement.setAttribute("data-theme", resolved);
};

export const useTheme = () => {
  const [mode, setMode] = useState(() => localStorage.getItem(STORAGE_KEY) ?? "system");

  useEffect(() => {
    applyTheme(mode);
    if (mode !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => applyTheme("system");
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [mode]);

  const setTheme = useCallback((next) => {
    localStorage.setItem(STORAGE_KEY, next);
    setMode(next);
  }, []);

  return { mode, setTheme };
};
