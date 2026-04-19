import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Package,
  Crown,
  Storefront,
  Sparkle,
  SignOut,
  CaretRight,
  UserCircle,
} from "@phosphor-icons/react";
import { useAuthStore } from "../../store/useAuthStore";
import { ROUTES } from "../../constants/routes";
import { vendorService } from "../../services/vendorService";

const ProfilePage = () => {
  const { user, logout, fetchMe } = useAuthStore();
  const navigate = useNavigate();

  const [isVendor, setIsVendor] = useState(false);
  const [checkingVendor, setCheckingVendor] = useState(true);
  const [vendorLoading, setVendorLoading] = useState(false);
  const [vendorError, setVendorError] = useState("");

  useEffect(() => {
    vendorService
      .getMyProfile()
      .then(() => setIsVendor(true))
      .catch(() => setIsVendor(false))
      .finally(() => setCheckingVendor(false));
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate(ROUTES.LOGIN);
  };

  const handleBecomeVendor = async () => {
    setVendorLoading(true);
    setVendorError("");
    try {
      await vendorService.createProfile({ description: "" });
      await fetchMe();
      setIsVendor(true);
      navigate(ROUTES.VENDOR_DASHBOARD);
    } catch {
      setVendorError("Не удалось стать вендором");
      setVendorLoading(false);
    }
  };

  const initials = user?.name ? (
    user.name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  ) : (
    <UserCircle size={32} />
  );

  return (
    <div className="profile-page page-enter">
      <div className="profile-header">
        <div className="profile-avatar">{initials}</div>
        <div>
          <div className="profile-name">{user?.name || "Пользователь"}</div>
          <div className="profile-phone">{user?.phone_number || "—"}</div>
        </div>
      </div>

      {vendorError && (
        <div className="form-error" style={{ margin: "12px 0" }}>
          {vendorError}
        </div>
      )}
      <div className="profile-menu">
        <div
          id="profile-orders-link"
          className="profile-menu-item"
          onClick={() => navigate(ROUTES.ORDERS)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && navigate(ROUTES.ORDERS)}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <Package size={22} weight="bold" />
            <span>Мои заказы</span>
          </div>
          <CaretRight size={18} color="var(--stone)" />
        </div>

        {user?.user_role === "ADMIN" && (
          <div
            id="profile-admin-dashboard-link"
            className="profile-menu-item"
            onClick={() => navigate(ROUTES.ADMIN)}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <Crown size={22} weight="bold" color="#ffb800" />
              <span>Админ-панель</span>
            </div>
            <CaretRight size={18} color="var(--stone)" />
          </div>
        )}

        {!checkingVendor &&
          (isVendor ? (
            <div
              id="profile-vendor-dashboard-link"
              className="profile-menu-item"
              onClick={() => navigate(ROUTES.VENDOR_DASHBOARD)}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "12px" }}
              >
                <Storefront size={22} weight="bold" />
                <span>Кабинет вендора</span>
              </div>
              <CaretRight size={18} color="var(--stone)" />
            </div>
          ) : (
            <div
              id="profile-become-vendor-link"
              className="profile-menu-item"
              onClick={handleBecomeVendor}
              style={{ pointerEvents: vendorLoading ? "none" : "auto" }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "12px" }}
              >
                <Sparkle size={22} weight="bold" color="var(--primary)" />
                <span>{vendorLoading ? "Загрузка..." : "Стать вендором"}</span>
              </div>
              <CaretRight size={18} color="var(--stone)" />
            </div>
          ))}

        <div className="divider" />

        <div
          id="profile-logout-btn"
          className="profile-menu-item danger"
          onClick={handleLogout}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && handleLogout()}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              color: "red",
            }}
          >
            <SignOut size={22} weight="bold" />
            <span>Выйти</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
