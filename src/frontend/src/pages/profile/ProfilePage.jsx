import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Storefront, CookingPot, Sparkle } from "@phosphor-icons/react";
import SharedProfilePage from "@shared/pages/ProfilePage/ProfilePage.jsx";
import { ROUTES } from "../../constants/routes";
import { vendorService } from "../../services/vendorService";
import { staffService } from "../../services/staffService";
import { translateApiError } from "../../utils/translateApiError";
import { hasPermission, PERMISSIONS } from "../../utils/permissions";
import { useAuthStore } from "../../store/useAuthStore";
import { useNotificationStore } from "../../store/useNotificationStore";

const ProfilePage = () => {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const unreadCount = useNotificationStore((s) => s.unreadCount);

  const [isVendor, setIsVendor] = useState(false);
  const [checkingVendor, setCheckingVendor] = useState(true);
  const [vendorProfile, setVendorProfile] = useState(null);
  const [isStaff, setIsStaff] = useState(false);
  const [checkingStaff, setCheckingStaff] = useState(true);
  const [vendorLoading, setVendorLoading] = useState(false);
  const [vendorError, setVendorError] = useState("");

  const isAdmin = hasPermission(user, PERMISSIONS.ADMIN_ACCESS);
  const canOpenVendorDashboard = isAdmin || vendorProfile?.approval_status === "APPROVED";

  useEffect(() => {
    vendorService.getMyProfile()
      .then((profile) => { setIsVendor(true); setVendorProfile(profile.data?.data ?? null); })
      .catch(() => { setIsVendor(false); setVendorProfile(null); })
      .finally(() => setCheckingVendor(false));

    staffService.getMyProfile()
      .then(() => setIsStaff(true))
      .catch(() => setIsStaff(false))
      .finally(() => setCheckingStaff(false));
  }, []);

  const handleBecomeVendor = async () => {
    setVendorLoading(true);
    setVendorError("");
    try {
      const profile = await vendorService.createProfile({ description: "" });
      setIsVendor(true);
      setVendorProfile(profile.data?.data ?? null);
    } catch (err) {
      setVendorError(translateApiError(err, "Не удалось стать вендором"));
    } finally {
      setVendorLoading(false);
    }
  };

  const extraMenuItems = [];

  if (!checkingStaff && isStaff) {
    extraMenuItems.push({
      icon: <CookingPot size={20} weight="bold" color="var(--fire)" />,
      label: "Кабинет сотрудника",
      onClick: () => navigate(ROUTES.STAFF_DASHBOARD),
    });
  }

  if (!checkingVendor) {
    if (isVendor || isAdmin) {
      if (canOpenVendorDashboard) {
        extraMenuItems.push({
          icon: <Storefront size={20} weight="bold" />,
          label: "Кабинет вендора",
          onClick: () => navigate(ROUTES.VENDOR_DASHBOARD),
        });
      } else {
        extraMenuItems.push({
          icon: <Storefront size={20} weight="bold" />,
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
        icon: <Sparkle size={20} weight="bold" color="var(--fire)" />,
        label: vendorLoading ? "Загрузка..." : "Стать вендором",
        onClick: vendorLoading ? undefined : handleBecomeVendor,
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
          terms: "/legal/terms",
          privacy: "/legal/privacy",
        }}
        onLogout={() => navigate(ROUTES.LOGIN)}
        showPasswordChange
        unreadCount={unreadCount}
        extraMenuItems={extraMenuItems}
      />
    </>
  );
};

export default ProfilePage;
