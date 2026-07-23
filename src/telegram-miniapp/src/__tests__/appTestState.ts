import { vi, type Mock } from "vitest";
import type { BootAction } from "../telegram/bootFlow";

export interface AuthState {
  fetchMe: Mock;
  user: { id: string } | null;
}

export interface CartState {
  fetchCart: Mock;
  cart: unknown[];
}

export interface SdkState {
  disableClosingConfirmation: Mock;
  enableClosingConfirmation: Mock;
  subscribeSafeAreaInsets: Mock;
  onEvent: Mock;
  offEvent: Mock;
  colorScheme: string;
  viewportHeight: number;
}

export const makeSdkState = (): SdkState => ({
  disableClosingConfirmation: vi.fn(),
  enableClosingConfirmation: vi.fn(),
  subscribeSafeAreaInsets: vi.fn(() => vi.fn()),
  onEvent: vi.fn(),
  offEvent: vi.fn(),
  colorScheme: "dark",
  viewportHeight: 640,
});

export const ready = (startParam?: string | null): BootAction =>
  ({ type: "ready", startParam }) as BootAction;

export const resetDom = (): void => {
  localStorage.clear();
  document.documentElement.removeAttribute("data-theme");
  window.history.replaceState(null, "", "/");
};
