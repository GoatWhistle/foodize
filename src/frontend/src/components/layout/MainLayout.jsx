import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Outlet } from 'react-router-dom';
import { translateApiError } from '../../utils/translateApiError';
import {
  House,
  Package,
  User,
  SignIn,
  ShoppingCart,
  CookingPot,
} from '@phosphor-icons/react';

import FoodizeLogo from '../ui/FoodizeLogo';
import ThemeToggle from '../ui/ThemeToggle';
import CartDrawer from '../ui/CartDrawer';
import NotificationBell from '../ui/NotificationBell';

import { useAuthStore } from '../../store/useAuthStore';
import { useOrderStore } from '../../store/useOrderStore';
import { useShallow } from 'zustand/react/shallow';
import { ROUTES } from '../../constants/routes';
import { hasPermission, PERMISSIONS } from '../../utils/permissions';

const NAV_LINKS = [
  {
    to: ROUTES.HOME,
    label: 'Рестораны',
    icon: <House size={18} weight="bold" />,
  },
  {
    to: ROUTES.ORDERS,
    label: 'Заказы',
    icon: <Package size={18} weight="bold" />,
  },
];

const BOTTOM_NAV_LINKS = [
  {
    to: ROUTES.HOME,
    label: 'Рестораны',
    icon: <House size={18} weight="bold" />,
  },
  {
    to: ROUTES.ORDERS,
    label: 'Заказы',
    icon: <Package size={18} weight="bold" />,
  },
  {
    to: ROUTES.PROFILE,
    label: 'Профиль',
    icon: <User size={18} weight="bold" />,
  },
];

const STAFF_LINK = {
  to: ROUTES.STAFF_DASHBOARD,
  label: 'Работа',
  icon: <CookingPot size={18} weight="bold" />,
};

const MainLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const { isAuthenticated, user } = useAuthStore(
    useShallow((s) => ({
      isAuthenticated: s.isAuthenticated,
      user: s.user,
    }))
  );
  const { cart, placeOrder } = useOrderStore(
    useShallow((s) => ({
      cart: s.cart,
      placeOrder: s.placeOrder,
    }))
  );
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [badgePop, setBadgePop] = useState(false);
  const previousCartItemsCount = useRef(0);

  const cartItemsCount = cart.reduce((t, i) => t + i.quantity, 0);
  const canOpenStaffDashboard = hasPermission(
    user,
    PERMISSIONS.STAFF_PROFILE_READ
  );

  useEffect(() => {
    if (cartItemsCount > previousCartItemsCount.current) {
      setBadgePop(false);
      const frame = window.requestAnimationFrame(() => setBadgePop(true));
      const timer = window.setTimeout(() => setBadgePop(false), 520);
      previousCartItemsCount.current = cartItemsCount;
      return () => {
        window.cancelAnimationFrame(frame);
        window.clearTimeout(timer);
      };
    }
    previousCartItemsCount.current = cartItemsCount;
  }, [cartItemsCount]);

  const handleCheckout = async (promoCode = null, comment = '') => {
    setIsLoading(true);
    setError('');
    try {
      const order = await placeOrder(promoCode, comment);
      setIsCartOpen(false);
      navigate(ROUTES.ORDER_STATUS.replace(':id', order.id));
    } catch (err) {
      setError(translateApiError(err, 'Не удалось разместить заказ'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="layout">
      <header className="header">
        <Link to={ROUTES.HOME} className="header-logo" aria-label="На главную">
          <FoodizeLogo size={26} />
        </Link>

        {isAuthenticated && (
          <nav className="header-nav" aria-label="Основная навигация">
            {[...NAV_LINKS, ...(canOpenStaffDashboard ? [STAFF_LINK] : [])].map(
              ({ to, label, icon }) => {
                const isActive =
                  to === ROUTES.HOME
                    ? location.pathname === '/'
                    : location.pathname.startsWith(to);
                return (
                  <Link
                    key={to}
                    to={to}
                    className={`nav-link${isActive ? ' active' : ''}`}
                    viewTransition
                  >
                    <span
                      aria-hidden="true"
                      style={{ display: 'flex', alignItems: 'center' }}
                    >
                      {icon}
                    </span>
                    {label}
                  </Link>
                );
              }
            )}
          </nav>
        )}

        {isAuthenticated && (
          <Link
            to={ROUTES.PROFILE}
            className={`nav-link${location.pathname.startsWith(ROUTES.PROFILE) ? ' active' : ''}`}
            style={{ marginLeft: '4px' }}
            aria-label="Профиль"
          >
            <User size={18} weight="bold" />
            Профиль
          </Link>
        )}

        <div className="header-actions">
          {isAuthenticated && <NotificationBell />}
          <ThemeToggle />
          {!isAuthenticated && (
            <Link
              to={ROUTES.LOGIN}
              className="btn btn-primary btn-sm"
              id="header-login-btn"
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <SignIn size={16} weight="bold" />
              Войти
            </Link>
          )}
        </div>
      </header>

      <main className="main-content">
        <Outlet />
      </main>

      {isAuthenticated && (
        <nav className="bottom-tab-bar" aria-label="Навигация">
          {[
            ...BOTTOM_NAV_LINKS,
            ...(canOpenStaffDashboard ? [STAFF_LINK] : []),
          ].map(({ to, label, icon }) => {
            const isActive =
              to === ROUTES.HOME
                ? location.pathname === '/'
                : location.pathname.startsWith(to);
            return (
              <Link
                key={to}
                to={to}
                className={`bottom-tab${isActive ? ' active' : ''}`}
                viewTransition
              >
                <span className="bottom-tab-icon">{icon}</span>
                <span className="bottom-tab-label">{label}</span>
              </Link>
            );
          })}
        </nav>
      )}

      {cartItemsCount > 0 && (
        <button
          className="cart-fab"
          onClick={() => setIsCartOpen(true)}
          aria-label="Открыть корзину"
        >
          <ShoppingCart size={20} weight="fill" />
          <span>Корзина</span>
          <span className={`cart-badge${badgePop ? ' cart-badge-pop' : ''}`}>
            {cartItemsCount}
          </span>
        </button>
      )}

      {isCartOpen && (
        <CartDrawer
          onClose={() => setIsCartOpen(false)}
          onCheckout={handleCheckout}
          isLoading={isLoading}
          error={error}
        />
      )}
    </div>
  );
};

export default MainLayout;
