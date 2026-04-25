import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Outlet } from "react-router-dom";
import {
  House,
  Package,
  User,
  SignIn,
  ShoppingCart,
  CookingPot,
} from "@phosphor-icons/react";

import FoodizeLogo from "../ui/FoodizeLogo";
import ThemeToggle from "../ui/ThemeToggle";
import CartDrawer from "../ui/CartDrawer";

import { useAuthStore } from "../../store/useAuthStore";
import { useOrderStore } from "../../store/useOrderStore";
import { ROUTES } from "../../constants/routes";

const NAV_LINKS = [
  {
    to: ROUTES.HOME,
    label: "Рестораны",
    icon: <House size={18} weight="bold" />,
  },
  {
    to: ROUTES.ORDERS,
    label: "Заказы",
    icon: <Package size={18} weight="bold" />,
  },
  {
    to: ROUTES.PROFILE,
    label: "Профиль",
    icon: <User size={18} weight="bold" />,
  },
];

const MainLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();
  const { cart, placeOrder } = useOrderStore();
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const cartItemsCount = cart.reduce((t, i) => t + i.quantity, 0);

  const handleCheckout = async (promoCode = null) => {
    setIsLoading(true);
    setError("");
    try {
      const order = await placeOrder(promoCode);
      setIsCartOpen(false);
      navigate(ROUTES.ORDER_STATUS.replace(":id", order.id));
    } catch (err) {
      setError(err.response?.data?.detail || "Не удалось разместить заказ");
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
            {[
              ...NAV_LINKS,
              ...(user?.user_role === "STAFF"
                ? [
                    {
                      to: ROUTES.STAFF_DASHBOARD,
                      label: "Работа",
                      icon: <CookingPot size={18} weight="bold" />,
                    },
                  ]
                : []),
            ].map(({ to, label, icon }) => {
              const isActive =
                to === ROUTES.HOME
                  ? location.pathname === "/"
                  : location.pathname.startsWith(to);
              return (
                <Link
                  key={to}
                  to={to}
                  className={`nav-link${isActive ? " active" : ""}`}
                  viewTransition
                >
                  <span
                    aria-hidden="true"
                    style={{ display: "flex", alignItems: "center" }}
                  >
                    {icon}
                  </span>
                  {label}
                </Link>
              );
            })}
          </nav>
        )}

        <div className="header-actions">
          <ThemeToggle />
          {!isAuthenticated && (
            <Link
              to={ROUTES.LOGIN}
              className="btn btn-primary btn-sm"
              id="header-login-btn"
              style={{ display: "flex", alignItems: "center", gap: "6px" }}
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
            ...NAV_LINKS,
            ...(user?.user_role === "STAFF"
              ? [
                  {
                    to: ROUTES.STAFF_DASHBOARD,
                    label: "Работа",
                    icon: <CookingPot size={18} weight="bold" />,
                  },
                ]
              : []),
          ].map(({ to, label, icon }) => {
            const isActive =
              to === ROUTES.HOME
                ? location.pathname === "/"
                : location.pathname.startsWith(to);
            return (
              <Link
                key={to}
                to={to}
                className={`bottom-tab${isActive ? " active" : ""}`}
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
          <span className="cart-badge">{cartItemsCount}</span>
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
