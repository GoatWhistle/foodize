import { useEffect } from "react";
import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import {
  PackageIcon,
  HeartIcon,
  SignOutIcon,
  CrownIcon,
  CaretRightIcon,
  GearSixIcon,
  BellIcon,
} from "@phosphor-icons/react";
import { useProfilePage } from "@shared/hooks/useProfilePage";
import { useModalStore } from "@shared/store/useModalStore";
import { hasPermission, PERMISSIONS } from "@shared/utils/permissions";
import { useTranslation } from "@shared/i18n/useTranslation";
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
  id?: string;
  icon?: ReactNode;
  label: ReactNode;
  onClick?: (() => void) | undefined;
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
  pageClassName?: string | undefined;
}

export const ProfilePage = ({
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
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, logout, displayName } = useProfilePage();
  const requestConfirm = useModalStore((state) => state.requestConfirm);

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

  const handleLogout = () => {
    requestConfirm({
      title: t("profile.page.logoutTitle"),
      message: t("profile.page.logoutMessage"),
      confirmLabel: t("profile.page.logoutConfirm"),
      cancelLabel: t("profile.page.logoutCancel"),
      danger: true,
      icon: <SignOutIcon size={20} />,
      onConfirm: async () => {
        await logout();
        onLogout?.();
      },
    });
  };

  const navTo = (path?: string) => {
    if (path) void navigate(path);
  };

  const hasManagement = (isAdmin && (routes.admin || !routes.admin)) || extraMenuItems.length > 0;

  return (
    <div className={`${s['page']}${pageClassName ? ` ${pageClassName}` : ""}`}>
      <div className={s['banner']} />

      <div style={{ position: "relative" }}>
        <div className={s['avatarWrap']}>
          <div className={s['avatar']}>
            {avatarUrl ? (
              <img src={avatarUrl} alt={displayName} loading="lazy" />
            ) : (
              initial
            )}
          </div>
        </div>
      </div>

      <div className={s['body']}>
        <div className={s['name']}>{displayName}</div>
        <div className={s['phone']}>{user?.phone_number || t("common.states.dash")}</div>
        {email && (
          <div style={{ fontSize: "var(--text-base)", color: "var(--text-3)", marginBottom: 10 }}>{email}</div>
        )}

        <div className={s['stats']}>
          <div className={s['stat']}>
            <PackageIcon size={13} color="var(--text-3)" />
            <strong>{ordersTotal}</strong>
            <span>{t("profile.page.ordersStat")}</span>
          </div>
          <span className={s['statSep']}>·</span>
          <div className={s['stat']}>
            <HeartIcon size={13} color="var(--color-error)" />
            <strong>{favoritesCount}</strong>
            <span>{t("profile.page.favoritesStat")}</span>
          </div>
        </div>

        <div className={s['group']}>
          <div className={s['groupTitle']}>{t("profile.page.groupPersonal")}</div>
          <div className={s['menu']}>
            <button className={s['menuItem']} onClick={() => { navTo(routes.orders); }}>
              <span className={s['menuItemLeft']}>
                <PackageIcon size={20} weight="bold" />
                {t("profile.page.myOrders")}
              </span>
              <CaretRightIcon size={16} color="var(--text-3)" />
            </button>

            <button className={s['menuItem']} onClick={() => { navTo(routes.favorites); }}>
              <span className={s['menuItemLeft']}>
                <HeartIcon size={20} weight="bold" color="var(--color-error)" />
                {t("profile.page.favorites")}
              </span>
              <CaretRightIcon size={16} color="var(--text-3)" />
            </button>

            {routes.notifications && (
              <button className={s['menuItem']} onClick={() => { navTo(routes.notifications); }}>
                <span className={s['menuItemLeft']}>
                  <BellIcon size={20} weight="bold" />
                  {t("profile.page.notifications")}
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  {unreadCount > 0 && (
                    <span className={s['badge']}>{unreadCount > 9 ? "9+" : unreadCount}</span>
                  )}
                  <CaretRightIcon size={16} color="var(--text-3)" />
                </span>
              </button>
            )}
          </div>
        </div>

        {hasManagement && (
          <div className={s['group']}>
            <div className={s['groupTitle']}>{t("profile.page.groupManagement")}</div>
            <div className={s['menu']}>
              {isAdmin && routes.admin && (
                <button className={s['menuItem']} onClick={() => { navTo(routes.admin); }}>
                  <span className={s['menuItemLeft']}>
                    <CrownIcon size={20} weight="bold" color="var(--gold)" />
                    {t("profile.page.adminPanelShort")}
                  </span>
                  <CaretRightIcon size={16} color="var(--text-3)" />
                </button>
              )}

              {isAdmin && !routes.admin && (
                <button className={s['menuItem']} onClick={() => window.Telegram?.WebApp?.showAlert?.(t("profile.page.adminWebOnly"))}>
                  <span className={s['menuItemLeft']}>
                    <CrownIcon size={20} weight="bold" color="var(--gold)" />
                    {t("profile.page.adminPanel")}
                  </span>
                  <CaretRightIcon size={16} color="var(--text-3)" />
                </button>
              )}

              {extraMenuItems.map((item, i) => (
                <button
                  key={item.id ?? i}
                  className={`${s['menuItem']}${item.onClick ? "" : ` ${s['menuItemStatic']}`}`}
                  onClick={item.onClick}
                  disabled={!item.onClick}
                >
                  <span className={s['menuItemLeft']}>
                    {item.icon}
                    {item.label}
                  </span>
                  {item.right ?? (item.onClick && <CaretRightIcon size={16} color="var(--text-3)" />)}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className={s['group']}>
          <div className={s['groupTitle']}>{t("profile.page.groupSystem")}</div>
          <div className={s['menu']}>
            <button className={s['menuItem']} onClick={() => { navTo(routes.settings ?? "/settings"); }}>
              <span className={s['menuItemLeft']}>
                <GearSixIcon size={20} weight="bold" />
                {t("profile.page.settings")}
              </span>
              <CaretRightIcon size={16} color="var(--text-3)" />
            </button>

            <button className={`${s['menuItem']} ${s['danger']}`} onClick={handleLogout}>
              <span className={s['menuItemLeft']}>
                <SignOutIcon size={20} weight="bold" />
                {t("profile.page.logout")}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
