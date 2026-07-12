import { useState, useEffect } from "react";
import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { StorefrontIcon, CookingPotIcon, SparkleIcon } from "@phosphor-icons/react";
import SharedProfilePage from "@shared/pages/ProfilePage/ProfilePage";
import { ROUTES } from "../../constants/routes";
import { vendorService } from "@shared/services/vendorService";
import { staffService } from "@shared/services/staffService";
import { translateApiError } from "@shared/utils/translateApiError";
import { hasPermission, PERMISSIONS } from "@shared/utils/permissions";
import { useAuthStore } from "../../store/useAuthStore";
import { useNotificationStore } from "../../store/useNotificationStore";
import type { Schemas } from "@shared/types/models";

type VendorProfile = Schemas["VendorResponse"];

interface ExtraMenuItem {
  icon?: ReactNode;
  label: ReactNode;
  onClick?: (() => void) | undefined;
  right?: ReactNode;
}

const ProfilePage = () => {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const unreadCount = useNotificationStore((s) => s.unreadCount);

  const [isVendor, setIsVendor] = useState(false);
  const [checkingVendor, setCheckingVendor] = useState(true);
  const [vendorProfile, setVendorProfile] = useState<VendorProfile | null>(null);
  const [isStaff, setIsStaff] = useState(false);
  const [checkingStaff, setCheckingStaff] = useState(true);
  const [vendorLoading, setVendorLoading] = useState(false);
  const [vendorError, setVendorError] = useState("");

  const isAdmin = hasPermission(user, PERMISSIONS.ADMIN_ACCESS);
  const canOpenVendorDashboard = isAdmin || vendorProfile?.approval_status === "APPROVED";

  useEffect(() => {
    vendorService.getMyProfile()
      .then((profile) => { setIsVendor(true); setVendorProfile(profile.data.data); })
      .catch(() => { setIsVendor(false); setVendorProfile(null); })
      .finally(() => { setCheckingVendor(false); });

    staffService.getMyProfile()
      .then(() => { setIsStaff(true); })
      .catch(() => { setIsStaff(false); })
      .finally(() => { setCheckingStaff(false); });
  }, []);

  const handleBecomeVendor = async () => {
    setVendorLoading(true);
    setVendorError("");
    try {
      const profile = await vendorService.createProfile({});
      setIsVendor(true);
      setVendorProfile(profile.data.data);
    } catch (err) {
      setVendorError(translateApiError(err, "Не удалось стать вендором"));
    } finally {
      setVendorLoading(false);
    }
  };

  const extraMenuItems: ExtraMenuItem[] = [];

  if (!checkingStaff && isStaff) {
    extraMenuItems.push({
      icon: <CookingPotIcon size={20} weight="bold" color="var(--fire)" />,
      label: "Кабинет сотрудника",
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
          label: "Кабинет вендора",
          onClick: () => {
            void navigate(ROUTES.VENDOR_DASHBOARD);
          },
        });
      } else {
        extraMenuItems.push({
          icon: <StorefrontIcon size={20} weight="bold" />,
          label: (
            <span>
              Кабинет вендора
              <span style={{ display: "block", fontSize: "0.75rem", color: "var(--text-3)", marginTop: 2, fontWeight: 400 }}>
                Ожидание одобрения администратором
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
        label: vendorLoading ? "Загрузка..." : "Стать вендором",
        onClick: vendorLoading
          ? undefined
          : () => {
              void handleBecomeVendor();
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

export default ProfilePage;
