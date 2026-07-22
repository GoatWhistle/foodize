import { t } from "@shared/i18n/useTranslation";

export const PERMISSIONS = {
  ADMIN_ACCESS: "admin.access",
  VENDORS_READ_OWN: "vendors.read_own",
  VENDORS_ANALYTICS_READ: "vendors.analytics_read",
  STAFF_PROFILE_READ: "staff.profile_read",
  MENU_MANAGE: "menu.manage",
  ORDERS_READ_RESTAURANT: "orders.read_restaurant",
  ORDERS_MANAGE_STATUS: "orders.manage_status",
};

export const ALL_PERMISSIONS = [
  "admin.access",
  "users.read",
  "users.manage",
  "users.assign_permissions",
  "restaurants.read",
  "restaurants.create",
  "restaurants.update",
  "restaurants.moderate",
  "menu.read",
  "menu.manage",
  "cart.manage",
  "favorites.manage",
  "orders.create",
  "orders.read_own",
  "orders.read_restaurant",
  "orders.manage_status",
  "orders.moderate",
  "reviews.create",
  "reviews.read",
  "reviews.moderate",
  "promos.validate",
  "promos.manage",
  "vendors.create",
  "vendors.read_own",
  "vendors.analytics_read",
  "vendors.moderate",
  "staff.requests_create",
  "staff.requests_manage",
  "staff.members_manage",
  "staff.profile_read",
  "telegram.auth",
];


export const CUSTOMER_PERMISSIONS = [
  "cart.manage",
  "favorites.manage",
  "menu.read",
  "orders.create",
  "orders.read_own",
  "promos.validate",
  "restaurants.read",
  "reviews.create",
  "reviews.read",
  "staff.requests_create",
  "telegram.auth",
];

export const VENDOR_PERMISSIONS = [
  ...CUSTOMER_PERMISSIONS,
  "menu.manage",
  "orders.manage_status",
  "orders.read_restaurant",
  "promos.manage",
  "restaurants.create",
  "restaurants.update",
  "staff.members_manage",
  "staff.profile_read",
  "staff.requests_manage",
  "vendors.analytics_read",
  "vendors.create",
  "vendors.read_own",
];

export const STAFF_PERMISSIONS = [
  ...CUSTOMER_PERMISSIONS,
  "orders.manage_status",
  "orders.read_restaurant",
  "staff.profile_read",
];

export const ADMIN_PERMISSIONS = ALL_PERMISSIONS;

export const PERMISSION_PRESETS = {
  CUSTOMER: CUSTOMER_PERMISSIONS,
  VENDOR: VENDOR_PERMISSIONS,
  STAFF: STAFF_PERMISSIONS,
  ADMIN: ADMIN_PERMISSIONS,
};

export const permissionPresetName = (preset: keyof typeof PERMISSION_PRESETS): string =>
  t(`enums.permissionPreset.${preset}`);

export const normalizePermissions = (
  permissions: readonly string[] | null | undefined = [],
): readonly string[] => permissions ?? [];

export const hasPermission = (
  user: { permissions?: readonly string[] | null } | null | undefined,
  permission: string,
): boolean => {
  const permissions = normalizePermissions(user?.permissions);
  return (
    permissions.includes(permission) ||
    permissions.includes(PERMISSIONS.ADMIN_ACCESS)
  );
};

export const inferPermissionPreset = (permissions: readonly string[] | null | undefined = []): keyof typeof PERMISSION_PRESETS => {
  const set = new Set(normalizePermissions(permissions));
  if (set.has(PERMISSIONS.ADMIN_ACCESS)) return "ADMIN";
  if (set.has(PERMISSIONS.VENDORS_READ_OWN)) return "VENDOR";
  if (set.has(PERMISSIONS.STAFF_PROFILE_READ)) return "STAFF";
  return "CUSTOMER";
};

export const permissionPresetLabel = (permissions: readonly string[] | null | undefined = []): string =>
  permissionPresetName(inferPermissionPreset(permissions));

export const permissionLabel = (permission: string): string => {
  const resolved = t(`enums.permission.${permission}`);
  return resolved === `enums.permission.${permission}` ? permission : resolved;
};

export const formatPermissions = (permissions: readonly string[] | null | undefined = []): string =>
  normalizePermissions(permissions)
    .map(permissionLabel)
    .join(", ");
