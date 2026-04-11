import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/useAuthStore";
import { ROUTES } from "../../constants/routes";

const ProfilePage = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate(ROUTES.LOGIN);
  };

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  return (
    <div className="profile-page page-enter">
      {/* Header card */}
      <div className="profile-header">
        <div className="profile-avatar">{initials}</div>
        <div>
          <div className="profile-name">{user?.name || "Пользователь"}</div>
          <div className="profile-phone">{user?.phone_number || "—"}</div>
        </div>
      </div>

      {/* Menu */}
      <div className="profile-menu">
        <div
          id="profile-orders-link"
          className="profile-menu-item"
          onClick={() => navigate(ROUTES.ORDERS)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && navigate(ROUTES.ORDERS)}
        >
          <span>📦 Мои заказы</span>
          <span style={{ color: "var(--stone)" }}>›</span>
        </div>

        <div
          id="profile-vendor-link"
          className="profile-menu-item"
          onClick={() => navigate(ROUTES.VENDOR_DASHBOARD)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) =>
            e.key === "Enter" && navigate(ROUTES.VENDOR_DASHBOARD)
          }
        >
          <span>🏪 Кабинет вендора</span>
          <span style={{ color: "var(--stone)" }}>›</span>
        </div>

        <div className="divider" />

        <div
          id="profile-logout-btn"
          className="profile-menu-item danger"
          onClick={handleLogout}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && handleLogout()}
        >
          <span>↩ Выйти</span>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
