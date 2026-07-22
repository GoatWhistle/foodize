import { t } from "@shared/i18n/useTranslation";

export const translateEnum = (
  namespace: string,
  key: string | null | undefined,
  fallback = "",
): string => {
  if (!key) return fallback;
  const resolved = t(`enums.${namespace}.${key}`);
  return resolved === `enums.${namespace}.${key}` ? fallback : resolved;
};

export const orderStatusLabel = (key: string | null | undefined): string =>
  translateEnum("orderStatus", key, key ?? "");

export const customerOrderStatusLabel = (key: string | null | undefined): string =>
  translateEnum("orderStatusCustomer", key, key ?? "");

export const approvalStatusLabel = (key: string | null | undefined): string =>
  translateEnum("approvalStatus", key, key ?? "");

export const categoryLabel = (key: string | null | undefined): string =>
  translateEnum("category", key, key ?? "");

export const discountTypeLabel = (key: string | null | undefined): string =>
  translateEnum("discountType", key, key ?? "");

export const staffStatusLabel = (key: string | null | undefined): string =>
  translateEnum("staffStatus", key, key ?? "");

export const staffRoleLabel = (key: string | null | undefined): string =>
  translateEnum("staffRole", key, key ?? "");
