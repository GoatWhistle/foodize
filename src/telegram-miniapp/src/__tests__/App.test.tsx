import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import type { BootAction } from "../telegram/bootFlow";

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

interface AuthState {
  fetchMe: Mock;
  user: { id: string } | null;
}
const authState = vi.hoisted(
  () =>
    ({ fetchMe: vi.fn(), user: null as { id: string } | null }),
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

const ready = (startParam?: string | null): BootAction =>
  ({ type: "ready", startParam }) as BootAction;

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  authState.user = null;
  authState.fetchMe.mockResolvedValue(undefined);
  cartState.cart = [];
  sdk.colorScheme = "dark";
  document.documentElement.removeAttribute("data-theme");
  window.history.replaceState(null, "", "/");
  runBootFlowMock.mockResolvedValue(ready(null));
});

describe("App", () => {
  it("shows the spinner while booting", async () => {
    let resolveBoot!: (a: BootAction) => void;
    runBootFlowMock.mockReturnValueOnce(
      new Promise<BootAction>((r) => {
        resolveBoot = r;
      }),
    );
    const { container } = render(<App />);
    expect(container.querySelector(".spinner")).toBeInTheDocument();
    resolveBoot(ready(null));
    await screen.findByTestId("router-provider");
  });

  it("renders the router once boot resolves to ready", async () => {
    render(<App />);
    expect(await screen.findByTestId("router-provider")).toBeInTheDocument();
    expect(screen.getByTestId("confirm-dialog")).toBeInTheDocument();
    expect(screen.getByTestId("error-boundary")).toBeInTheDocument();
  });

  it("shows the login page when boot returns a login action", async () => {
    runBootFlowMock.mockResolvedValueOnce({
      type: "login",
      initData: "init-abc",
    });
    render(<App />);
    expect(await screen.findByTestId("login-page")).toHaveTextContent(
      "login:init-abc",
    );
  });

  it("transitions from login to ready on success and clears the logout flag", async () => {
    localStorage.setItem("foodize_tg_logged_out", "1");
    runBootFlowMock.mockResolvedValueOnce({
      type: "login",
      initData: "i",
    });
    render(<App />);
    await userEvent.click(await screen.findByText("login-success"));
    expect(await screen.findByTestId("router-provider")).toBeInTheDocument();
    expect(localStorage.getItem("foodize_tg_logged_out")).toBeNull();
  });

  it("shows the register page with the prefilled phone", async () => {
    runBootFlowMock.mockResolvedValueOnce({
      type: "register",
      initData: "reg-init",
      phoneNumber: "+700",
      startParam: "restaurant_9",
    });
    render(<App />);
    expect(await screen.findByTestId("register-page")).toHaveTextContent(
      "register:reg-init:+700",
    );
  });

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

  it("falls back to the login page when boot throws", async () => {
    runBootFlowMock.mockRejectedValueOnce(new Error("boot failed"));
    render(<App />);
    expect(await screen.findByTestId("login-page")).toHaveTextContent(
      "login:",
    );
  });

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

  it("loads the authenticated user's data once ready and authenticated", async () => {
    authState.user = { id: "u1" };
    render(<App />);
    await screen.findByTestId("router-provider");
    await waitFor(() => {
      expect(cartState.fetchCart).toHaveBeenCalled();
    });
    expect(favState.loadFavorites).toHaveBeenCalled();
    expect(ordersState.fetchActiveOrder).toHaveBeenCalled();
    expect(notifState.fetchNotifications).toHaveBeenCalled();
    expect(notifState.connectWs).toHaveBeenCalledWith("u1");
  });

  it("passes working boot dependencies that read auth and forced-logout state", async () => {
    localStorage.setItem("foodize_tg_logged_out", "1");
    authState.user = { id: "u1" };
    type Captured = {
      fetchMe: () => Promise<void>;
      isAuthenticated: () => boolean;
      isForcedLogout: () => boolean;
    };
    let captured: Captured | null = null;
    runBootFlowMock.mockImplementationOnce(async (deps: Captured) => {
      captured = deps;
      await deps.fetchMe();
      return ready(null);
    });

    render(<App />);
    await screen.findByTestId("router-provider");

    expect(captured).not.toBeNull();
    expect(authState.fetchMe).toHaveBeenCalled();
    const capturedDeps = captured as Captured | null;
    if (capturedDeps === null) throw new Error("boot deps not captured");
    expect(capturedDeps.isAuthenticated()).toBe(true);
    expect(capturedDeps.isForcedLogout()).toBe(true);
  });

  it("falls back to the window viewport height when Telegram reports none", async () => {
    sdk.viewportHeight = 0;
    render(<App />);
    await screen.findByTestId("router-provider");
    expect(
      document.documentElement.style.getPropertyValue("--tg-viewport-h"),
    ).not.toBe("");
    sdk.viewportHeight = 640;
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
