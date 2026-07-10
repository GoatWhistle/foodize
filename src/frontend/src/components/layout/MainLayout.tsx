import { useEffect, useRef, useState, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Outlet } from 'react-router-dom';
import { User, SignIn, ShoppingCart } from '@phosphor-icons/react';

import FoodizeLogo from '@shared/components/FoodizeLogo/FoodizeLogo';
import CartDrawer from '@shared/components/CartDrawer/CartDrawer';
import NotificationBell from '../NotificationBell/NotificationBell';
import OrderAssistant from '../OrderAssistant/OrderAssistant';

import { useAuthStore } from '../../store/useAuthStore';
import { useOrderStore } from '../../store/useOrderStore';
import { useShallow } from 'zustand/react/shallow';
import { ROUTES } from '../../constants/routes';

const DEEP_LINK_ID_RE = /^[a-zA-Z0-9-]{1,64}$/;

const MainLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { cart, cartTotal } = useOrderStore(
    useShallow((s) => ({
      cart: s.cart,
      cartTotal: s.cartTotal,
    }))
  );
  const total = useMemo(() => {
    void cart;
    return cartTotal();
  }, [cart, cartTotal]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [badgePop, setBadgePop] = useState(false);
  const previousCartItemsCount = useRef(0);

  const cartItemsCount = cart.reduce((t, i) => t + i.quantity, 0);

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

  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (tg?.initDataUnsafe?.start_param) {
      const startParam = tg.initDataUnsafe.start_param;
      if (startParam.startsWith('restaurant_')) {
        const displayId = startParam.replace('restaurant_', '');
        if (!DEEP_LINK_ID_RE.test(displayId)) return;
        void navigate(ROUTES.RESTAURANT.replace(':id', displayId));
      } else if (startParam.startsWith('order_')) {
        const displayId = startParam.replace('order_', '');
        if (!DEEP_LINK_ID_RE.test(displayId)) return;
        void navigate(ROUTES.ORDER_STATUS.replace(':id', displayId));
      }
    }
  }, [navigate]);

  return (
    <div className="layout">
      <header className="header">
        <Link to={ROUTES.HOME} className="header-logo" aria-label="На главную">
          <FoodizeLogo size={26} />
        </Link>

        <div className="header-actions">
          {isAuthenticated && (
            <Link
              to={ROUTES.PROFILE}
              className={`nav-link${location.pathname.startsWith(ROUTES.PROFILE) ? ' active' : ''}`}
              aria-label="Профиль"
            >
              <User size={18} weight="bold" />
              Профиль
            </Link>
          )}
          {isAuthenticated && <NotificationBell />}
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

      {cartItemsCount > 0 && (
        <button
          className="cart-fab"
          onClick={() => setIsCartOpen(true)}
          aria-label="Открыть корзину"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ShoppingCart size={20} weight="fill" />
            <span>Корзина</span>
            <span className={`cart-badge${badgePop ? ' cart-badge-pop' : ''}`}>
              {cartItemsCount}
            </span>
          </div>
          <span style={{ fontWeight: 800 }}>{total} ₽</span>
        </button>
      )}

      {isCartOpen && <CartDrawer onClose={() => setIsCartOpen(false)} />}

      {isAuthenticated && <OrderAssistant />}
    </div>
  );
};

export default MainLayout;
