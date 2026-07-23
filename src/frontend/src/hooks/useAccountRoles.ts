import { useCallback, useEffect, useState } from "react";
import { vendorService } from "@shared/services/vendorService";
import { staffService } from "@shared/services/staffService";
import { translateApiError } from "@shared/utils/translateApiError";
import { hasPermission, PERMISSIONS } from "@shared/utils/permissions";
import { useAuthStore } from "../store/useAuthStore";
import { useTranslation } from "@shared/i18n/useTranslation";
import type { Schemas } from "@shared/types/models";

type VendorProfile = Schemas["VendorResponse"];

export interface AccountRoles {
  checkingVendor: boolean;
  checkingStaff: boolean;
  isVendor: boolean;
  vendorProfile: VendorProfile | null;
  isStaff: boolean;
  isAdmin: boolean;
  canOpenVendorDashboard: boolean;
  vendorLoading: boolean;
  vendorError: string;
  becomeVendor: () => Promise<void>;
}

export const useAccountRoles = (enabled: boolean): AccountRoles => {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const [requested, setRequested] = useState(false);
  const [isVendor, setIsVendor] = useState(false);
  const [checkingVendor, setCheckingVendor] = useState(true);
  const [vendorProfile, setVendorProfile] = useState<VendorProfile | null>(null);
  const [isStaff, setIsStaff] = useState(false);
  const [checkingStaff, setCheckingStaff] = useState(true);
  const [vendorLoading, setVendorLoading] = useState(false);
  const [vendorError, setVendorError] = useState("");

  useEffect(() => {
    if (!enabled || requested || !user) return;
    setRequested(true);
    const detectVendor = async (): Promise<void> => {
      try {
        const profileResponse = await vendorService.getMyProfile();
        setIsVendor(true);
        setVendorProfile(profileResponse.data.data);
      } catch {
        setIsVendor(false);
        setVendorProfile(null);
      } finally {
        setCheckingVendor(false);
      }
    };
    const detectStaff = async (): Promise<void> => {
      try {
        await staffService.getMyProfile();
        setIsStaff(true);
      } catch {
        setIsStaff(false);
      } finally {
        setCheckingStaff(false);
      }
    };
    void Promise.all([detectVendor(), detectStaff()]);
  }, [enabled, requested, user]);

  const becomeVendor = useCallback(async () => {
    setVendorLoading(true);
    setVendorError("");
    try {
      const profile = await vendorService.createProfile();
      setIsVendor(true);
      setVendorProfile(profile.data.data);
    } catch (err) {
      setVendorError(translateApiError(err, t("profile.roles.becomeVendorFailed")));
    } finally {
      setVendorLoading(false);
    }
  }, [t]);

  const isAdmin = hasPermission(user, PERMISSIONS.ADMIN_ACCESS);
  const canOpenVendorDashboard = isAdmin || vendorProfile?.approval_status === "APPROVED";

  return {
    checkingVendor,
    checkingStaff,
    isVendor,
    vendorProfile,
    isStaff,
    isAdmin,
    canOpenVendorDashboard,
    vendorLoading,
    vendorError,
    becomeVendor,
  };
};
