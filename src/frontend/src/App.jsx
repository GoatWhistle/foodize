import { useEffect } from "react";
import {
  RouterProvider,
  createBrowserRouter,
  Navigate,
} from "react-router-dom";

import { IconContext, MapPin, ArrowLeft } from "@phosphor-icons/react";

import MainLayout from "./components/layout/MainLayout";

import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import HomePage from "./pages/home/HomePage";
import RestaurantPage from "./pages/restaurant/RestaurantPage";
import OrdersPage from "./pages/orders/OrdersPage";
import OrderStatusPage from "./pages/orders/OrderStatusPage";
import VendorDashboardPage from "./pages/vendor/VendorDashboardPage";
import ProfilePage from "./pages/profile/ProfilePage";
import AdminDashboardPage from "./pages/admin/AdminDashboardPage";

import { ROUTES } from "./constants/routes";
import { useAuthStore } from "./store/useAuthStore";
import { useThemeStore } from "./store/useThemeStore";

const ProtectedRoute = ({ children }) => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return isAuthenticated ? children : <Navigate to={ROUTES.LOGIN} replace />;
};

const router = createBrowserRouter([
  {
    path: ROUTES.HOME,
    element: <MainLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: ROUTES.LOGIN, element: <LoginPage /> },
      { path: ROUTES.REGISTER, element: <RegisterPage /> },
      {
        path: ROUTES.RESTAURANT,
        element: (
          <ProtectedRoute>
            <RestaurantPage />
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.ORDERS,
        element: (
          <ProtectedRoute>
            <OrdersPage />
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.ORDER_STATUS,
        element: (
          <ProtectedRoute>
            <OrderStatusPage />
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.VENDOR_DASHBOARD,
        element: (
          <ProtectedRoute>
            <VendorDashboardPage />
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.PROFILE,
        element: (
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.ADMIN,
        element: (
          <ProtectedRoute>
            <AdminDashboardPage />
          </ProtectedRoute>
        ),
      },
    ],
  },
  {
    path: "*",
    element: (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 16,
          fontFamily: "Manrope, sans-serif",
        }}
      >
        <MapPin size={64} weight="bold" color="#FF4F1F" />
        <h1
          style={{
            fontWeight: 800,
            fontSize: "1.5rem",
            letterSpacing: "-0.03em",
          }}
        >
          Страница не найдена
        </h1>
        <a
          href="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            color: "#FF4F1F",
            fontWeight: 700,
            textDecoration: "none",
          }}
        >
          <ArrowLeft weight="bold" /> На главную
        </a>
      </div>
    ),
  },
]);

function App() {
  const { initTheme, fetchMe } = {
    initTheme: useThemeStore((s) => s.initTheme),
    fetchMe: useAuthStore((s) => s.fetchMe),
  };

  useEffect(() => {
    initTheme();
    fetchMe();
  }, [initTheme, fetchMe]);

  return (
    <IconContext.Provider
      value={{
        color: "currentColor",
        size: 20,
        weight: "bold",
        mirrored: false,
      }}
    >
      <RouterProvider router={router} />
    </IconContext.Provider>
  );
}

export default App;
