import { Link, useLocation } from "react-router-dom";
import { Outlet } from "react-router-dom";
import FoodizeLogo from "../ui/FoodizeLogo";
import ThemeToggle from "../ui/ThemeToggle";
import { useAuthStore } from "../../store/useAuthStore";
import { ROUTES } from "../../constants/routes";

const NAV_LINKS = [
  { to: ROUTES.HOME, label: "Рестораны", icon: "🏠" },
  { to: ROUTES.ORDERS, label: "Заказы", icon: "📦" },
  { to: ROUTES.PROFILE, label: "Профиль", icon: "👤" },
];

const MainLayout = () => {
  const location = useLocation();
  const { isAuthenticated } = useAuthStore();

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
                  <span aria-hidden="true">{icon}</span>
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
            >
              Войти
            </Link>
          )}
        </div>
      </header>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
};

export default MainLayout;
