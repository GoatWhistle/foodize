import { useEffect, useState, lazy, Suspense } from "react";
import {
  Navigate,
  RouterProvider,
  createBrowserRouter,
  Outlet,
  useNavigate,
  useNavigationType,
  useLocation,
} from "react-router-dom";

import { useAuthStore } from "./store/useAuthStore";
import { useOrderStore } from "./store/useOrderStore";
import { useFavoriteStore } from "./store/useFavoriteStore";
import { useNotificationStore } from "./store/useNotificationStore";
import { authExistingUser, initTelegramApp } from "./telegram/init";
import { tg } from "./telegram/sdk";
import RegisterPage from "./pages/auth/RegisterPage";
import BottomNav from "./components/BottomNav";
import ErrorBoundary from "./components/ui/ErrorBoundary";
import ActiveOrderBanner from "./components/ActiveOrderBanner";

const LazyHome = lazy(() => import("./pages/home/HomePage"));
const LazyRestaurant = lazy(() => import("./pages/restaurant/RestaurantPage"));
const LazyOrders = lazy(() => import("./pages/orders/OrdersPage"));
const LazyOrderStatus = lazy(() => import("./pages/orders/OrderStatusPage"));
const LazyProfile = lazy(() => import("./pages/profile/ProfilePage"));
const LazyFavorites = lazy(() => import("./pages/profile/FavoritesPage"));
const LazyNotifications = lazy(
  () => import("./pages/notifications/NotificationsPage"),
);
const LazyVendorProfile = lazy(
  () => import("./pages/profile/VendorProfilePage"),
);
const LazyStaffProfile = lazy(() => import("./pages/profile/StaffProfilePage"));

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

const GlobalCartFab = () => {
  const cartCount = useOrderStore((s) => s.cartCount);
  const count = cartCount ? cartCount() : 0;
  const navigate = useNavigate();

  const isRestaurant =
    typeof window !== "undefined" &&
    window.location.pathname.startsWith("/restaurant/");

  if (count === 0 || isRestaurant) return null;

  return (
    <button
      className="cart-fab"
      onClick={() =>
        navigate("/restaurant/" + useOrderStore.getState().cartRestaurantId)
      }
    >
      🛒 Корзина
      <span className="cart-badge">{count}</span>
    </button>
  );
};

const Layout = () => {
  const navigationType = useNavigationType();
  const location = useLocation();
  return (
    <>
      <ActiveOrderBanner />
      <Suspense fallback={null}>
        <div
          key={location.key}
          className={navigationType !== "POP" ? "page-enter" : ""}
        >
          <Outlet />
        </div>
      </Suspense>
      <GlobalCartFab />
      <BottomNav />
    </>
  );
};

const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { path: "/", element: <LazyHome /> },
      { path: "/restaurant/:id", element: <LazyRestaurant /> },
      { path: "/orders", element: <LazyOrders /> },
      { path: "/orders/:id", element: <LazyOrderStatus /> },
      { path: "/profile", element: <LazyProfile /> },
      { path: "/favorites", element: <LazyFavorites /> },
      { path: "/notifications", element: <LazyNotifications /> },
      { path: "/vendor-profile", element: <LazyVendorProfile /> },
      { path: "/staff-profile", element: <LazyStaffProfile /> },
      { path: "*", element: <Navigate to="/" replace /> },
    ],
  },
]);

function applyTelegramTheme() {
  if (!tg) return;
  const scheme = tg.colorScheme ?? "light";
  document.documentElement.setAttribute("data-theme", scheme);
}

export default function App() {
  const [appState, setAppState] = useState("loading");
  const [initData, setInitData] = useState("");
  const [prefillPhone, setPrefillPhone] = useState(null);

  const fetchMe = useAuthStore((s) => s.fetchMe);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const fetchCart = useOrderStore((s) => s.fetchCart);
  const fetchActiveOrder = useOrderStore((s) => s.fetchActiveOrder);
  const loadFavorites = useFavoriteStore((s) => s.loadFavorites);
  const fetchNotifications = useNotificationStore((s) => s.fetchNotifications);
  const connectWs = useNotificationStore((s) => s.connectWs);
  const disconnectWs = useNotificationStore((s) => s.disconnectWs);

  useEffect(() => {
    applyTelegramTheme();
    if (tg) {
      tg.onEvent("themeChanged", applyTelegramTheme);
      return () => tg.offEvent("themeChanged", applyTelegramTheme);
    }
  }, []);

  useEffect(() => {
    async function boot() {
      const result = await initTelegramApp();

      if (result.status === "registered") {
        await authExistingUser(result.initData);
        await fetchMe();
        setAppState("ready");
      } else if (result.status === "new_user") {
        setInitData(result.initData);
        setPrefillPhone(result.phone_number ?? null);
        setAppState("register");
      } else {
        setAppState("ready");
      }
    }
    boot();
  }, [fetchMe]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchCart();
      loadFavorites();
      fetchActiveOrder();
    }
  }, [isAuthenticated, fetchCart, loadFavorites, fetchActiveOrder]);

  useEffect(() => {
    if (isAuthenticated && user?.id) {
      fetchNotifications();
      connectWs(user.id);
      return () => disconnectWs();
    }
  }, [isAuthenticated, user?.id, fetchNotifications, connectWs, disconnectWs]);

  if (appState === "loading") return <Spinner />;

  if (appState === "register") {
    return (
      <RegisterPage
        initData={initData}
        prefillPhone={prefillPhone}
        onSuccess={() => setAppState("ready")}
      />
    );
  }

  return (
    <div className="app-ready">
      <ErrorBoundary>
        <RouterProvider router={router} />
      </ErrorBoundary>
    </div>
  );
}
