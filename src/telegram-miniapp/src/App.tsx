import { useEffect, useState } from "react";
import { RouterProvider } from "react-router-dom";

import { useAuthStore } from "./store/useAuthStore";
import { useOrderStore } from "./store/useOrderStore";
import { useFavoriteStore } from "@shared/store/useFavoriteStore";
import { useNotificationStore } from "./store/useNotificationStore";
import { useThemeStore } from "@shared/store/useThemeStore";
import { runBootFlow } from "./telegram/bootFlow";
import { tg } from "./telegram/sdk";
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import ErrorBoundary from "@shared/components/ErrorBoundary/ErrorBoundary";
import ConfirmDialog from "@shared/components/ConfirmDialog/ConfirmDialog";
import { router } from "./routes";

const DEEP_LINK_ID_RE = /^[a-zA-Z0-9-]{1,64}$/;

const Spinner = () => (
  <div
    style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}
  >
    <div className="spinner" />
  </div>
);

function applyTelegramTheme(): void {
  if (!tg) return;
  const saved = localStorage.getItem("foodize-theme");
  if (saved && saved !== "system") return;
  const scheme = tg.colorScheme ?? "light";
  document.documentElement.setAttribute("data-theme", scheme);
}

function applyTelegramViewport(): void {
  if (typeof window === "undefined") return;

  const viewportHeight =
    Number(tg?.viewportHeight) ||
    Number(window.visualViewport?.height) ||
    window.innerHeight;

  if (viewportHeight) {
    document.documentElement.style.setProperty(
      "--tg-viewport-h",
      `${Math.floor(viewportHeight)}px`,
    );
  }
}

type AppState = "loading" | "login" | "register" | "ready";

export default function App() {
  const [appState, setAppState] = useState<AppState>("loading");
  const [initData, setInitData] = useState<string>("");
  const [prefillPhone, setPrefillPhone] = useState<string | null>(null);
  const [pendingStartParam, setPendingStartParam] = useState<string | null>(
    null,
  );

  const fetchMe = useAuthStore((s) => s.fetchMe);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const fetchCart = useOrderStore((s) => s.fetchCart);
  const fetchActiveOrder = useOrderStore((s) => s.fetchActiveOrder);
  const loadFavorites = useFavoriteStore((s) => s.loadFavorites);
  const fetchNotifications = useNotificationStore((s) => s.fetchNotifications);
  const connectWs = useNotificationStore((s) => s.connectWs);
  const disconnectWs = useNotificationStore((s) => s.disconnectWs);
  const initTheme = useThemeStore((s) => s.initTheme);

  useEffect(() => {
    initTheme();
    applyTelegramTheme();
    const webApp = tg;
    if (webApp) {
      webApp.onEvent("themeChanged", applyTelegramTheme);
      return () => webApp.offEvent("themeChanged", applyTelegramTheme);
    }
  }, [initTheme]);

  useEffect(() => {
    applyTelegramViewport();

    const handleViewportChange = () => applyTelegramViewport();

    tg?.onEvent?.("viewportChanged", handleViewportChange);
    window.visualViewport?.addEventListener("resize", handleViewportChange);
    window.addEventListener("resize", handleViewportChange);

    return () => {
      tg?.offEvent?.("viewportChanged", handleViewportChange);
      window.visualViewport?.removeEventListener(
        "resize",
        handleViewportChange,
      );
      window.removeEventListener("resize", handleViewportChange);
    };
  }, []);

  useEffect(() => {
    async function boot() {
      try {
        const action = await runBootFlow({
          fetchMe,
          isAuthenticated: () => useAuthStore.getState().isAuthenticated,
          isForcedLogout: () =>
            localStorage.getItem("foodize_tg_logged_out") === "1",
        });

        if (action.type === "login") {
          setInitData(action.initData);
          setPrefillPhone(null);
          setAppState("login");
        } else if (action.type === "register") {
          setInitData(action.initData);
          setPrefillPhone(action.phoneNumber);
          setPendingStartParam(action.startParam);
          setAppState("register");
        } else {
          if (action.startParam) {
            handleDeepLink(action.startParam);
          }
          setAppState("ready");
        }
      } catch {
        setInitData("");
        setPrefillPhone(null);
        setAppState("login");
      }
    }
    void boot();
  }, [fetchMe]);

  function handleDeepLink(param: string): void {
    if (param.startsWith("order_")) {
      const orderId = param.replace("order_", "");
      if (!DEEP_LINK_ID_RE.test(orderId)) return;
      window.history.replaceState(null, "", `/orders/${orderId}`);
    } else if (param.startsWith("restaurant_")) {
      const restaurantId = param.replace("restaurant_", "");
      if (!DEEP_LINK_ID_RE.test(restaurantId)) return;
      window.history.replaceState(null, "", `/restaurant/${restaurantId}`);
    }
  }

  useEffect(() => {
    if (isAuthenticated) {
      void fetchCart();
      void loadFavorites();
      void fetchActiveOrder();
    }
  }, [isAuthenticated, fetchCart, loadFavorites, fetchActiveOrder]);

  useEffect(() => {
    if (isAuthenticated && user?.id) {
      void fetchNotifications();
      connectWs(user.id);
      return () => disconnectWs();
    }
  }, [isAuthenticated, user?.id, fetchNotifications, connectWs, disconnectWs]);

  if (appState === "loading") return <Spinner />;

  if (appState === "login") {
    return (
      <LoginPage
        initData={initData}
        onSuccess={() => {
          localStorage.removeItem("foodize_tg_logged_out");
          setAppState("ready");
        }}
      />
    );
  }

  if (appState === "register") {
    return (
      <RegisterPage
        initData={initData}
        prefillPhone={prefillPhone ?? undefined}
        onSuccess={() => {
          localStorage.removeItem("foodize_tg_logged_out");
          if (pendingStartParam) {
            handleDeepLink(pendingStartParam);
            setPendingStartParam(null);
          }
          setAppState("ready");
        }}
      />
    );
  }

  return (
    <div className="app-ready">
      <ErrorBoundary>
        <RouterProvider router={router} />
      </ErrorBoundary>
      <ConfirmDialog />
    </div>
  );
}
