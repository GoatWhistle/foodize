import { useEffect, lazy, Suspense } from 'react';
import {
  RouterProvider,
  createBrowserRouter,
  Navigate,
  Outlet,
  useLocation,
} from 'react-router-dom';

const LazyLegal = lazy(() =>
  import('@shared/components/LegalPage/LegalPage')
);
const VendorDashboardPage = lazy(() => import('./pages/vendor/VendorDashboardPage'));
const AdminDashboardPage = lazy(() => import('./pages/admin/AdminDashboardPage'));
const StaffDashboardPage = lazy(() => import('./pages/staff/StaffDashboardPage'));
const DisplayBoardPage = lazy(() => import('./pages/display-board/DisplayBoardPage'));

import { IconContext, MapPin, ArrowLeft } from '@phosphor-icons/react';

import MainLayout from './components/layout/MainLayout';
import ErrorBoundary from './components/ui/ErrorBoundary';
import ConfirmDialog from './components/ui/ConfirmDialog';
import RouteErrorPage from './components/ui/RouteErrorPage';

import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import HomePage from './pages/home/HomePage';
import RestaurantPage from './pages/restaurant/RestaurantPage';
import OrdersPage from './pages/orders/OrdersPage';
import OrderStatusPage from './pages/orders/OrderStatusPage';
import ProfilePage from './pages/profile/ProfilePage';
import FavoritesPage from './pages/profile/FavoritesPage';
import NotificationsPage from './pages/notifications/NotificationsPage';

import { ROUTES } from './constants/routes';
import { useAuthStore } from './store/useAuthStore';
import { useThemeStore } from './store/useThemeStore';
import { useOrderStore } from './store/useOrderStore';
import { useFavoriteStore } from './store/useFavoriteStore';

const ProtectedRoute = ({ children }) => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const location = useLocation();
  return isAuthenticated ? children : <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;
};

const RoleProtectedRoute = ({ children, permission }) => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const permissions = useAuthStore((s) => s.user?.permissions);
  const location = useLocation();
  if (!isAuthenticated) return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;
  if (permission && !permissions?.includes(permission)) return <Navigate to={ROUTES.HOME} replace />;
  return children;
};

const router = createBrowserRouter([
  {
    path: ROUTES.HOME,
    element: <MainLayout />,
    errorElement: <RouteErrorPage />,
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
          <RoleProtectedRoute permission="restaurants.create">
            <Suspense fallback={null}>
              <VendorDashboardPage />
            </Suspense>
          </RoleProtectedRoute>
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
        path: ROUTES.FAVORITES,
        element: (
          <ProtectedRoute>
            <FavoritesPage />
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.ADMIN,
        element: (
          <RoleProtectedRoute permission="admin.access">
            <Suspense fallback={null}>
              <AdminDashboardPage />
            </Suspense>
          </RoleProtectedRoute>
        ),
      },
      {
        path: ROUTES.STAFF_DASHBOARD,
        element: (
          <RoleProtectedRoute permission="orders.manage_status">
            <Suspense fallback={null}>
              <StaffDashboardPage />
            </Suspense>
          </RoleProtectedRoute>
        ),
      },
      {
        path: ROUTES.NOTIFICATIONS,
        element: (
          <ProtectedRoute>
            <NotificationsPage />
          </ProtectedRoute>
        ),
      },
    ],
  },
  {
    path: ROUTES.DISPLAY_BOARD,
    element: (
      <Suspense fallback={null}>
        <DisplayBoardPage />
      </Suspense>
    ),
  },
  {
    element: (
      <Suspense fallback={null}>
        <Outlet />
      </Suspense>
    ),
    children: [
      { path: '/legal/:doc', element: <LazyLegal /> },
    ],
  },
  {
    path: '*',
    element: (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 16,
          fontFamily: 'Manrope, sans-serif',
        }}
      >
        <MapPin
          className="not-found-pin"
          size={64}
          weight="bold"
          color="var(--fire)"
        />
        <h1
          style={{
            fontWeight: 800,
            fontSize: '1.5rem',
            letterSpacing: '-0.03em',
          }}
        >
          Страница не найдена
        </h1>
        <a
          href="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: 'var(--fire)',
            fontWeight: 700,
            textDecoration: 'none',
          }}
        >
          <ArrowLeft weight="bold" /> На главную
        </a>
      </div>
    ),
  },
]);

function App() {
  const initTheme = useThemeStore((s) => s.initTheme);
  const fetchMe = useAuthStore((s) => s.fetchMe);

  const fetchCart = useOrderStore((s) => s.fetchCart);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const loadFavorites = useFavoriteStore((s) => s.loadFavorites);

  useEffect(() => {
    initTheme();
    fetchMe();
  }, [initTheme, fetchMe]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchCart();
      loadFavorites();
    }
  }, [isAuthenticated, fetchCart, loadFavorites]);

  return (
    <ErrorBoundary>
      <IconContext.Provider
        value={{
          color: 'currentColor',
          size: 20,
          weight: 'bold',
          mirrored: false,
        }}
      >
        <RouterProvider router={router} />
        <ConfirmDialog />
      </IconContext.Provider>
    </ErrorBoundary>
  );
}

export default App;
