import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom"; // Добавили useNavigate
import { Outlet } from "react-router-dom";
import {
  House,
  Package,
  User,
  SignIn,
  ShoppingCart,
} from "@phosphor-icons/react";

import FoodizeLogo from "../ui/FoodizeLogo";
import ThemeToggle from "../ui/ThemeToggle";
import CartDrawer from "../ui/CartDrawer";

import { useAuthStore } from "../../store/useAuthStore";
import { useOrderStore } from "../../store/useOrderStore";
import { ROUTES } from "../../constants/routes";

const NAV_LINKS = [
  { to: ROUTES.HOME, label: "Рестораны", icon: <House size={20} /> },
  { to: ROUTES.ORDERS, label: "Заказы", icon: <Package size={20} /> },
  { to: ROUTES.PROFILE, label: "Профиль", icon: <User size={20} /> },
];

const MainLayout = () => {
  const location = useLocation();
  const navigate = useNavigate(); // Для редиректа после заказа
  const { isAuthenticated } = useAuthStore();

  const { cart, placeOrder } = useOrderStore();
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Состояния для процесса оформления
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const cartItemsCount = cart.reduce((total, item) => total + item.quantity, 0);

  // ТА САМАЯ ЛОГИКА ОФОРМЛЕНИЯ
  const handleCheckout = async () => {
    setIsLoading(true);
    setError("");
    try {
      const order = await placeOrder(); // Вызываем создание заказа из стора
      setIsCartOpen(false); // Закрываем корзину
      // Переходим на страницу статуса заказа
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
          <FoodizeLogo size={28} />
        </Link>

        {isAuthenticated && (
          <nav className="header-nav" aria-label="Основная навигация">
            {NAV_LINKS.map(({ to, label, icon }) => {
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
              <SignIn size={18} weight="bold" />
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
          <ShoppingCart size={22} weight="fill" />
          <span>Корзина</span>
          <span className="cart-badge">{cartItemsCount}</span>
        </button>
      )}

      {isCartOpen && (
        <CartDrawer
          onClose={() => setIsCartOpen(false)}
          onCheckout={handleCheckout} // Передаем рабочую функцию
          isLoading={isLoading} // Передаем состояние загрузки
          error={error} // Передаем ошибку, если она будет
        />
      )}
    </div>
  );
};

export default MainLayout;
