import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { App } from "./App";
import { applySafeAreaInsets, startTelegramApp } from "./telegram/sdk";

const tg = window.Telegram?.WebApp;
startTelegramApp();
applySafeAreaInsets();
const colorScheme =
  tg?.['colorScheme'] ??
  (window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light");
document.documentElement.setAttribute(
  "data-theme",
  colorScheme === "dark" ? "dark" : "light",
);

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element not found");
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
