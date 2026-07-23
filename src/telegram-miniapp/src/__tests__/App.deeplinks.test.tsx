import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import type { BootAction } from "../telegram/bootFlow";
import { ready, resetDom, type AuthState } from "./appTestState";

const runBootFlowMock = vi.hoisted(() => vi.fn());
vi.mock("../telegram/bootFlow", () => ({
  runBootFlow: (...a: unknown[]) => runBootFlowMock(...a) as Promise<BootAction>,
}));

const sdk = vi.hoisted(() => ({
  disableClosingConfirmation: vi.fn(),
  enableClosingConfirmation: vi.fn(),
  subscribeSafeAreaInsets: vi.fn(() => vi.fn()),
  onEvent: vi.fn(),
  offEvent: vi.fn(),
  colorScheme: "dark",
  viewportHeight: 640,
}));
vi.mock("../telegram/sdk", () => ({
  disableClosingConfirmation: sdk.disableClosingConfirmation,
  enableClosingConfirmation: sdk.enableClosingConfirmation,
  subscribeSafeAreaInsets: sdk.subscribeSafeAreaInsets,
  tg: {
    onEvent: sdk.onEvent,
    offEvent: sdk.offEvent,
    get colorScheme() {
      return sdk.colorScheme;
    },
    get viewportHeight() {
      return sdk.viewportHeight;
    },
  },
}));

vi.mock("@shared/hooks/useThemeEffect", () => ({
  useThemeEffect: vi.fn(),
}));

vi.mock("../pages/auth/LoginPage", () => ({
  LoginPage: (props: { initData: string; onSuccess: () => void }) => (
    <div data-testid="login-page">
      login:{props.initData}
      <button onClick={props.onSuccess}>login-success</button>
    </div>
  ),
}));

vi.mock("../pages/auth/RegisterPage", () => ({
  RegisterPage: (props: {
    initData: string;
    prefillPhone?: string;
    onSuccess: () => void;
  }) => (
    <div data-testid="register-page">
      register:{props.initData}:{props.prefillPhone ?? "none"}
      <button onClick={props.onSuccess}>register-success</button>
    </div>
  ),
}));

vi.mock("@shared/components/ErrorBoundary/ErrorBoundary", () => ({
  ErrorBoundary: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="error-boundary">{children}</div>
  ),
}));

vi.mock("@shared/components/ConfirmDialog/ConfirmDialog", () => ({
  ConfirmDialog: () => <div data-testid="confirm-dialog" />,
}));

vi.mock("../routes", () => ({
  router: { __router: true },
}));

vi.mock("react-router-dom", () => ({
  RouterProvider: () => <div data-testid="router-provider" />,
}));

const authState = vi.hoisted(
  () => ({ fetchMe: vi.fn(), user: null as { id: string } | null }),
);
vi.mock("../store/useAuthStore", () => {
  const useAuthStore = ((sel: (s: AuthState) => unknown) =>
    sel(authState)) as unknown as Mock & { getState: () => AuthState };
  useAuthStore.getState = () => authState;
  return { useAuthStore };
});

const cartState = vi.hoisted(
  () => ({ fetchCart: vi.fn(), cart: [] as unknown[] }),
);
vi.mock("../store/useCartStore", () => {
  const useCartStore = (
    sel: (s: { fetchCart: Mock; cart: unknown[] }) => unknown,
  ) => sel(cartState);
  return { useCartStore };
});

const ordersState = vi.hoisted(() => ({ fetchActiveOrder: vi.fn() }));
vi.mock("../store/useOrdersStore", () => ({
  useOrdersStore: (sel: (s: { fetchActiveOrder: Mock }) => unknown) =>
    sel(ordersState),
}));

const favState = vi.hoisted(() => ({ loadFavorites: vi.fn() }));
vi.mock("@shared/store/useFavoriteStore", () => ({
  useFavoriteStore: (sel: (s: { loadFavorites: Mock }) => unknown) =>
    sel(favState),
}));

const notifState = vi.hoisted(() => ({
  fetchNotifications: vi.fn(),
  connectWs: vi.fn(),
  disconnectWs: vi.fn(),
}));
vi.mock("../store/useNotificationStore", () => ({
  useNotificationStore: (
    sel: (s: {
      fetchNotifications: Mock;
      connectWs: Mock;
      disconnectWs: Mock;
    }) => unknown,
  ) => sel(notifState),
}));

import { App } from "../App";

beforeEach(() => {
  vi.clearAllMocks();
  resetDom();
  authState.user = null;
  authState.fetchMe.mockResolvedValue(undefined);
  cartState.cart = [];
  sdk.colorScheme = "dark";
  sdk.viewportHeight = 640;
  runBootFlowMock.mockResolvedValue(ready(null));
});

describe("App deep links", () => {
  it("applies a deep link to an order start param on ready", async () => {
    runBootFlowMock.mockResolvedValueOnce(ready("order_a1b2"));
    render(<App />);
    await screen.findByTestId("router-provider");
    await waitFor(() => {
      expect(window.location.pathname).toBe("/orders/a1b2");
    });
  });

  it("applies a deep link to a restaurant start param on ready", async () => {
    runBootFlowMock.mockResolvedValueOnce(ready("restaurant_77"));
    render(<App />);
    await screen.findByTestId("router-provider");
    await waitFor(() => {
      expect(window.location.pathname).toBe("/restaurant/77");
    });
  });

  it("ignores a deep link with an invalid id", async () => {
    runBootFlowMock.mockResolvedValueOnce(ready("order_bad id!"));
    render(<App />);
    await screen.findByTestId("router-provider");
    expect(window.location.pathname).toBe("/");
  });

  it("navigates via the deep link captured during registration on success", async () => {
    runBootFlowMock.mockResolvedValueOnce({
      type: "register",
      initData: "i",
      phoneNumber: null,
      startParam: "restaurant_55",
    });
    render(<App />);
    await userEvent.click(await screen.findByText("register-success"));
    await waitFor(() => {
      expect(window.location.pathname).toBe("/restaurant/55");
    });
  });
});

describe("App telegram shell integration", () => {
  it("enables closing confirmation when the cart is not empty", async () => {
    cartState.cart = [{ id: "x" }];
    render(<App />);
    await screen.findByTestId("router-provider");
    expect(sdk.enableClosingConfirmation).toHaveBeenCalled();
  });

  it("disables closing confirmation when the cart is empty", async () => {
    render(<App />);
    await screen.findByTestId("router-provider");
    expect(sdk.disableClosingConfirmation).toHaveBeenCalled();
  });

  it("subscribes to safe-area insets and telegram theme changes", async () => {
    render(<App />);
    await screen.findByTestId("router-provider");
    expect(sdk.subscribeSafeAreaInsets).toHaveBeenCalled();
    expect(sdk.onEvent).toHaveBeenCalledWith(
      "themeChanged",
      expect.any(Function),
    );
    expect(sdk.onEvent).toHaveBeenCalledWith(
      "viewportChanged",
      expect.any(Function),
    );
  });

  it("applies the telegram color scheme as the theme when none is saved", async () => {
    sdk.colorScheme = "light";
    render(<App />);
    await screen.findByTestId("router-provider");
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");
  });

  it("keeps the saved theme over the telegram color scheme", async () => {
    localStorage.setItem("foodize-theme", "dark");
    sdk.colorScheme = "light";
    render(<App />);
    await screen.findByTestId("router-provider");
    expect(document.documentElement.getAttribute("data-theme")).not.toBe(
      "light",
    );
  });

  it("falls back to the window viewport height when Telegram reports none", async () => {
    sdk.viewportHeight = 0;
    render(<App />);
    await screen.findByTestId("router-provider");
    expect(
      document.documentElement.style.getPropertyValue("--tg-viewport-h"),
    ).not.toBe("");
  });

  it("disconnects the notification socket on unmount", async () => {
    authState.user = { id: "u1" };
    const { unmount } = render(<App />);
    await screen.findByTestId("router-provider");
    await waitFor(() => {
      expect(notifState.connectWs).toHaveBeenCalled();
    });
    unmount();
    expect(notifState.disconnectWs).toHaveBeenCalled();
  });
});
