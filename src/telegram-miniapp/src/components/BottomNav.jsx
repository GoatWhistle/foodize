import { useNavigate, useLocation } from "react-router-dom";
import { Storefront, Package, User } from "@phosphor-icons/react";

const TABS = [
  { path: "/", icon: Storefront, label: "Рестораны" },
  { path: "/orders", icon: Package, label: "Заказы" },
  { path: "/profile", icon: User, label: "Профиль" },
];

const BottomNav = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const isActive = (path) =>
    path === "/" ? pathname === "/" : pathname.startsWith(path);

  return (
    <div className="bottom-tab-bar">
      {TABS.map(({ path, icon: Icon, label }) => {
        const active = isActive(path);
        return (
          <button
            key={path}
            className={`bottom-tab${active ? " active" : ""}`}
            onClick={() => navigate(path)}
          >
            <span className="bottom-tab-icon">
              <Icon size={22} weight={active ? "fill" : "regular"} />
            </span>
            <span className="bottom-tab-label">{label}</span>
          </button>
        );
      })}
    </div>
  );
};

export default BottomNav;
