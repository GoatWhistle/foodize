import { useNavigate, useLocation } from "react-router-dom";
import { StorefrontIcon, PackageIcon, UserIcon, type Icon } from "@phosphor-icons/react";
import { useNotificationStore } from "../../store/useNotificationStore";
import { getHapticFeedback } from "../../telegram/sdk";
import { logError } from "@shared/utils/logError";
import s from "./BottomNav.module.css";

interface Tab {
  path: string;
  icon: Icon;
  label: string;
}

const TABS: Tab[] = [
  { path: "/", icon: StorefrontIcon, label: "Рестораны" },
  { path: "/orders", icon: PackageIcon, label: "Заказы" },
  { path: "/profile", icon: UserIcon, label: "Профиль" },
];

const haptic = (): void => {
  try {
    getHapticFeedback()?.selectionChanged();
  } catch (err) {
    logError("BottomNav.haptic", err);
  }
};

const BottomNav = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const connectionStatus = useNotificationStore((s) => s.connectionStatus);
  const wasEverConnected = useNotificationStore((s) => s.wasEverConnected);
  const hasConnectionIssue =
    wasEverConnected && (connectionStatus === "reconnecting" || connectionStatus === "closed");

  const isActive = (path: string): boolean =>
    path === "/" ? pathname === "/" : pathname.startsWith(path);

  return (
    <div className={s.bar}>
      {TABS.map(({ path, icon: Icon, label }) => {
        const active = isActive(path);
        const showBadge = path === "/profile" && unreadCount > 0;
        const showConnectionBadge = path === "/profile" && hasConnectionIssue;
        return (
          <button
            key={path}
            className={`${s.tab}${active ? ` ${s.active}` : ""}`}
            onClick={() => {
              if (!active) haptic();
              void navigate(path);
            }}
          >
            <span className={s.icon}>
              <Icon size={22} weight={active ? "fill" : "regular"} />
              {showBadge && (
                <span
                  style={{
                    position: "absolute",
                    top: -4,
                    right: -6,
                    background: "var(--ink-1)",
                    color: "var(--ink-inv)",
                    borderRadius: "50%",
                    fontSize: 10,
                    fontWeight: 700,
                    minWidth: 16,
                    height: 16,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "0 3px",
                    lineHeight: 1,
                  }}
                >
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
              {showConnectionBadge && !showBadge && (
                <span
                  title="Нет соединения с уведомлениями"
                  style={{
                    position: "absolute",
                    top: -2,
                    right: -4,
                    width: 9,
                    height: 9,
                    background: "var(--color-error)",
                    borderRadius: "50%",
                    border: "2px solid var(--bg)",
                  }}
                />
              )}
            </span>
            <span className={s.pill} aria-hidden="true" />
            <span className={s.label}>{label}</span>
          </button>
        );
      })}
    </div>
  );
};

export default BottomNav;
