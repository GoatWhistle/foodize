import { lazy, Suspense } from "react";
import {
  Navigate,
  createBrowserRouter,
  Outlet,
  useNavigate,
  useNavigationType,
  useLocation,
  NavigationType,
} from "react-router-dom";
import { ShoppingCart } from "@phosphor-icons/react";

import { useOrderStore } from "./store/useOrderStore";
import BottomNav from "./components/BottomNav/BottomNav";
import ActiveOrderBanner from "./components/ActiveOrderBanner/ActiveOrderBanner";

const LazyHome = lazy(() => import("./pages/home/HomePage"));
const LazyRestaurant = lazy(() => import("./pages/restaurant/RestaurantPage"));
const LazyOrders = lazy(() => import("./pages/orders/OrdersPage"));
const LazyOrderStatus = lazy(() => import("./pages/orders/OrderStatusPage"));
const LazyProfile = lazy(() => import("./pages/profile/ProfilePage"));
const LazySettings = lazy(() => import("./pages/profile/SettingsPage"));
const LazyFavorites = lazy(() => import("./pages/profile/FavoritesPage"));
const LazyNotifications = lazy(
  () => import("./pages/notifications/NotificationsPage"),
);
const LazyLegal = lazy(() => import("@shared/components/LegalPage/LegalPage"));

const GlobalCartFab = () => {
  const count = useOrderStore((s) => s.cartCount());
  const navigate = useNavigate();
  const location = useLocation();

  const isRestaurant = location.pathname.startsWith("/restaurant/");

  if (count === 0 || isRestaurant) return null;

  return (
    <button
      className="cart-fab"
      onClick={() => {
        void navigate(
          "/restaurant/" + useOrderStore.getState().cartRestaurantId,
        );
      }}
    >
      <ShoppingCart size={22} weight="bold" />
      <span className="cart-fab-label">Корзина</span>
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
          className={navigationType !== NavigationType.Pop ? "page-enter" : ""}
        >
          <Outlet />
        </div>
      </Suspense>
      <GlobalCartFab />
      <BottomNav />
    </>
  );
};

export const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { path: "/", element: <LazyHome /> },
      { path: "/restaurant/:id", element: <LazyRestaurant /> },
      { path: "/orders", element: <LazyOrders /> },
      { path: "/orders/:id", element: <LazyOrderStatus /> },
      { path: "/profile", element: <LazyProfile /> },
      { path: "/settings", element: <LazySettings /> },
      { path: "/favorites", element: <LazyFavorites /> },
      { path: "/notifications", element: <LazyNotifications /> },
    ],
  },
  {
    element: (
      <Suspense fallback={null}>
        <Outlet />
      </Suspense>
    ),
    children: [{ path: "/legal/:doc", element: <LazyLegal /> }],
  },
  { path: "*", element: <Navigate to="/" replace /> },
]);
