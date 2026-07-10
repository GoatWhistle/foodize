import { useEffect } from "react";
import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import {
  Package,
  Heart,
  SignOut,
  Crown,
  CaretRight,
  GearSix,
  Bell,
} from "@phosphor-icons/react";
import { useProfilePage } from "@shared/hooks/useProfilePage";
import { hasPermission, PERMISSIONS } from "@shared/utils/permissions";
import s from "./ProfilePage.module.css";

interface BackButtonControl {
  show: () => void;
  hide: () => void;
  onClick: (handler: () => void) => void;
  offClick: (handler: () => void) => void;
}

interface ProfilePageRoutes {
  home?: string;
  orders?: string;
  favorites?: string;
  notifications?: string;
  admin?: string;
  settings?: string;
}

interface ExtraMenuItem {
  icon?: ReactNode;
  label: ReactNode;
  onClick?: () => void;
  right?: ReactNode;
}

interface ProfilePageProps {
  routes?: ProfilePageRoutes;
  onLogout?: () => void;
  BackButton?: BackButtonControl | null;
  avatarUrl?: string | null;
  ordersTotal?: number;
  favoritesCount?: number;
  unreadCount?: number;
  extraMenuItems?: ExtraMenuItem[];
  pageClassName?: string;
}

const ProfilePage = ({
  routes = {},
  onLogout,
  BackButton = null,
  avatarUrl = null,
  ordersTotal = 0,
  favoritesCount = 0,
  unreadCount = 0,
  extraMenuItems = [],
  pageClassName = "",
}: ProfilePageProps) => {
  const navigate = useNavigate();
  const { user, logout, displayName } = useProfilePage();

  const isAdmin = hasPermission(user, PERMISSIONS.ADMIN_ACCESS);
  const initial = displayName[0]?.toUpperCase() || "?";
  const email = typeof user?.email === "string" ? user.email : "";

  useEffect(() => {
    if (!BackButton) return;
    BackButton.show();
    const handler = () => { void navigate(routes.home ?? "/"); };
    BackButton.onClick(handler);
    return () => { BackButton.offClick(handler); BackButton.hide(); };
  }, [navigate, BackButton, routes.home]);

  const handleLogout = async () => {
    await logout();
    onLogout?.();
  };

  const navTo = (path?: string) => {
    if (path) void navigate(path);
  };

  const hasManagement = (isAdmin && (routes.admin || !routes.admin)) || extraMenuItems.length > 0;

  return (
    <div className={`${s.page}${pageClassName ? ` ${pageClassName}` : ""}`}>
      <div className={s.banner} />

      <div style={{ position: "relative" }}>
        <div className={s.avatarWrap}>
          <div className={s.avatar}>
            {avatarUrl ? (
              <img src={avatarUrl} alt={displayName} loading="lazy" />
            ) : (
              initial
            )}
          </div>
        </div>
      </div>

      <div className={s.body}>
        <div className={s.name}>{displayName}</div>
        <div className={s.phone}>{user?.phone_number || "—"}</div>
        {email && (
          <div style={{ fontSize: "0.8rem", color: "var(--text-3)", marginBottom: 10 }}>{email}</div>
        )}

        <div className={s.stats}>
          <div className={s.stat}>
            <Package size={13} color="var(--text-3)" />
            <strong>{ordersTotal}</strong>
            <span>заказов</span>
          </div>
          <span className={s.statSep}>·</span>
          <div className={s.stat}>
            <Heart size={13} color="var(--color-error)" />
            <strong>{favoritesCount}</strong>
            <span>избранных</span>
          </div>
        </div>

        <div className={s.group}>
          <div className={s.groupTitle}>Личное</div>
          <div className={s.menu}>
            <button className={s.menuItem} onClick={() => navTo(routes.orders)}>
              <span className={s.menuItemLeft}>
                <Package size={20} weight="bold" />
                Мои заказы
              </span>
              <CaretRight size={16} color="var(--text-3)" />
            </button>

            <button className={s.menuItem} onClick={() => navTo(routes.favorites)}>
              <span className={s.menuItemLeft}>
                <Heart size={20} weight="bold" color="var(--color-error)" />
                Избранное
              </span>
              <CaretRight size={16} color="var(--text-3)" />
            </button>

            {routes.notifications && (
              <button className={s.menuItem} onClick={() => navTo(routes.notifications)}>
                <span className={s.menuItemLeft}>
                  <Bell size={20} weight="bold" />
                  Уведомления
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  {unreadCount > 0 && (
                    <span className={s.badge}>{unreadCount > 9 ? "9+" : unreadCount}</span>
                  )}
                  <CaretRight size={16} color="var(--text-3)" />
                </span>
              </button>
            )}
          </div>
        </div>

        {hasManagement && (
          <div className={s.group}>
            <div className={s.groupTitle}>Управление</div>
            <div className={s.menu}>
              {isAdmin && routes.admin && (
                <button className={s.menuItem} onClick={() => navTo(routes.admin)}>
                  <span className={s.menuItemLeft}>
                    <Crown size={20} weight="bold" color="var(--gold)" />
                    Админ-панель
                  </span>
                  <CaretRight size={16} color="var(--text-3)" />
                </button>
              )}

              {isAdmin && !routes.admin && (
                <button className={s.menuItem} onClick={() => window.Telegram?.WebApp?.showAlert?.("Панель администратора доступна только в веб-версии Foodize")}>
                  <span className={s.menuItemLeft}>
                    <Crown size={20} weight="bold" color="var(--gold)" />
                    Панель администратора
                  </span>
                  <CaretRight size={16} color="var(--text-3)" />
                </button>
              )}

              {extraMenuItems.map((item, i) => (
                <button
                  key={i}
                  className={`${s.menuItem}${item.onClick ? "" : ` ${s.menuItemStatic}`}`}
                  onClick={item.onClick}
                  disabled={!item.onClick}
                >
                  <span className={s.menuItemLeft}>
                    {item.icon}
                    {item.label}
                  </span>
                  {item.right ?? (item.onClick && <CaretRight size={16} color="var(--text-3)" />)}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className={s.group}>
          <div className={s.groupTitle}>Система</div>
          <div className={s.menu}>
            <button className={s.menuItem} onClick={() => navTo(routes.settings ?? "/settings")}>
              <span className={s.menuItemLeft}>
                <GearSix size={20} weight="bold" />
                Настройки
              </span>
              <CaretRight size={16} color="var(--text-3)" />
            </button>

            <button className={`${s.menuItem} ${s.danger}`} onClick={() => { void handleLogout(); }}>
              <span className={s.menuItemLeft}>
                <SignOut size={20} weight="bold" />
                Выйти
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
