import { lazy, Suspense } from 'react';
import {
  createBrowserRouter,
  Outlet,
} from 'react-router-dom';
import { MapPinIcon, ArrowLeftIcon } from '@phosphor-icons/react';
import { MainLayout } from './components/layout/MainLayout';
import { RouteErrorPage } from './components/RouteErrorPage/RouteErrorPage';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { HomePage } from './pages/home/HomePage';
import { RestaurantPage } from './pages/restaurant/RestaurantPage';
import { OrdersPage } from './pages/orders/OrdersPage';
import { OrderStatusPage } from './pages/orders/OrderStatusPage';
import { ProfilePage } from './pages/profile/ProfilePage';
import { SettingsPage } from './pages/profile/SettingsPage';
import { FavoritesPage } from './pages/profile/FavoritesPage';
import { NotificationsPage } from './pages/notifications/NotificationsPage';
import { ROUTES } from './constants/routes';
import { useTranslation } from '@shared/i18n/useTranslation';
import { ProtectedRoute, RoleProtectedRoute } from './AppGuards';

const LazyLegal = lazy(() =>
  import('@shared/components/LegalPage/LegalPage').then((m) => ({ default: m.LegalPage }))
);
const VendorDashboardPage = lazy(() =>
  import('./pages/vendor/VendorDashboardPage').then((m) => ({ default: m.VendorDashboardPage }))
);
const AdminDashboardPage = lazy(() =>
  import('./pages/admin/AdminDashboardPage').then((m) => ({ default: m.AdminDashboardPage }))
);
const StaffDashboardPage = lazy(() =>
  import('./pages/staff/StaffDashboardPage').then((m) => ({ default: m.StaffDashboardPage }))
);
const DisplayBoardPage = lazy(() =>
  import('./pages/display-board/DisplayBoardPage').then((m) => ({ default: m.DisplayBoardPage }))
);

const NotFoundPage = () => {
  const { t } = useTranslation();
  return (
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
      <MapPinIcon
        className="not-found-pin"
        size={64}
        weight="bold"
        color="var(--fire)"
      />
      <h1
        style={{
          fontWeight: 800,
          fontSize: "var(--text-xl)",
          letterSpacing: '-0.03em',
        }}
      >
        {t('common.errors.pageNotFound')}
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
        <ArrowLeftIcon weight="bold" /> {t('common.actions.goHome')}
      </a>
    </div>
  );
};

export const router = createBrowserRouter([
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
        path: ROUTES.SETTINGS,
        element: (
          <ProtectedRoute>
            <SettingsPage />
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
    element: <NotFoundPage />,
  },
]);
