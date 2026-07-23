import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { StorefrontIcon, CookingPotIcon, SparkleIcon } from "@phosphor-icons/react";
import { ProfilePage as SharedProfilePage } from "@shared/pages/ProfilePage/ProfilePage";
import { ROUTES } from "../../constants/routes";
import { useAccountRoles } from "../../hooks/useAccountRoles";
import { useNotificationStore } from "../../store/useNotificationStore";
import { useTranslation } from "@shared/i18n/useTranslation";

interface ExtraMenuItem {
  icon?: ReactNode;
  label: ReactNode;
  onClick?: (() => void) | undefined;
  right?: ReactNode;
}

export const ProfilePage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const {
    checkingVendor,
    checkingStaff,
    isVendor,
    isStaff,
    isAdmin,
    canOpenVendorDashboard,
    vendorLoading,
    vendorError,
    becomeVendor,
  } = useAccountRoles(true);

  const extraMenuItems: ExtraMenuItem[] = [];

  if (!checkingStaff && isStaff) {
    extraMenuItems.push({
      icon: <CookingPotIcon size={20} weight="bold" color="var(--fire)" />,
      label: t("profile.roles.staffDashboard"),
      onClick: () => {
        void navigate(ROUTES.STAFF_DASHBOARD);
      },
    });
  }

  if (!checkingVendor) {
    if (isVendor || isAdmin) {
      if (canOpenVendorDashboard) {
        extraMenuItems.push({
          icon: <StorefrontIcon size={20} weight="bold" />,
          label: t("profile.roles.vendorDashboard"),
          onClick: () => {
            void navigate(ROUTES.VENDOR_DASHBOARD);
          },
        });
      } else {
        extraMenuItems.push({
          icon: <StorefrontIcon size={20} weight="bold" />,
          label: (
            <span>
              {t("profile.roles.vendorDashboard")}
              <span style={{ display: "block", fontSize: "var(--text-sm)", color: "var(--text-3)", marginTop: 2, fontWeight: 400 }}>
                {t("profile.roles.vendorPending")}
              </span>
            </span>
          ),
          onClick: undefined,
          right: null,
        });
      }
    } else {
      extraMenuItems.push({
        icon: <SparkleIcon size={20} weight="bold" color="var(--fire)" />,
        label: vendorLoading ? t("common.states.loading") : t("profile.roles.becomeVendor"),
        onClick: vendorLoading
          ? undefined
          : () => {
              void becomeVendor();
            },
      });
    }
  }

  return (
    <>
      {vendorError && (
        <div className="form-error" style={{ margin: "12px var(--gutter, 16px)" }}>{vendorError}</div>
      )}
      <SharedProfilePage
        routes={{
          orders: ROUTES.ORDERS,
          favorites: ROUTES.FAVORITES,
          notifications: ROUTES.NOTIFICATIONS,
          admin: ROUTES.ADMIN,
          settings: ROUTES.SETTINGS,
        }}
        onLogout={() => {
          void navigate(ROUTES.LOGIN);
        }}
        unreadCount={unreadCount}
        extraMenuItems={extraMenuItems}
      />
    </>
  );
};
