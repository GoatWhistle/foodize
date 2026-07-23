import { useNavigate, useLocation } from "react-router-dom";
import { StorefrontIcon, PackageIcon, UserIcon, type Icon } from "@phosphor-icons/react";
import { BottomNav as SharedBottomNav } from "@shared/components/BottomNav/BottomNav";
import type { BottomNavTab } from "@shared/components/BottomNav/BottomNav";
import { useNotificationStore } from "../../store/useNotificationStore";
import { getHapticFeedback } from "../../telegram/sdk";
import { logError } from "@shared/utils/logError";
import { useTranslation } from "@shared/i18n/useTranslation";

interface Tab {
  path: string;
  icon: Icon;
  labelKey: string;
}

const TABS: Tab[] = [
  { path: "/", icon: StorefrontIcon, labelKey: "profile.nav.restaurants" },
  { path: "/orders", icon: PackageIcon, labelKey: "profile.nav.orders" },
  { path: "/profile", icon: UserIcon, labelKey: "profile.nav.profile" },
];

const haptic = (): void => {
  try {
    getHapticFeedback()?.selectionChanged();
  } catch (err) {
    logError("BottomNav.haptic", err);
  }
};

export const BottomNav = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const connectionStatus = useNotificationStore((s) => s.connectionStatus);
  const wasEverConnected = useNotificationStore((s) => s.wasEverConnected);
  const hasConnectionIssue =
    wasEverConnected && (connectionStatus === "reconnecting" || connectionStatus === "closed");

  const isActive = (path: string): boolean =>
    path === "/" ? pathname === "/" : pathname.startsWith(path);

  const tabs: BottomNavTab[] = TABS.map(({ path, icon, labelKey }) => {
    const active = isActive(path);
    const isProfile = path === "/profile";
    return {
      key: path,
      icon,
      label: t(labelKey),
      active,
      ...(isProfile && unreadCount > 0
        ? { badge: unreadCount > 9 ? "9+" : String(unreadCount) }
        : {}),
      ...(isProfile && hasConnectionIssue
        ? { showDot: true, dotTitle: t("profile.notifications.connectionIssue") }
        : {}),
      onSelect: () => {
        if (!active) haptic();
        void navigate(path);
      },
    };
  });

  return <SharedBottomNav tabs={tabs} constrained />;
};
