import { t } from "@shared/i18n/useTranslation";

interface LocalizableNotification {
  title: string;
  message: string;
  title_key?: string | null | undefined;
  message_key?: string | null | undefined;
  params?: Record<string, unknown> | null | undefined;
}

const toParams = (
  params: Record<string, unknown> | null | undefined,
): Record<string, string | number> => {
  const result: Record<string, string | number> = {};
  for (const [key, value] of Object.entries(params ?? {})) {
    if (typeof value === "string" || typeof value === "number") result[key] = value;
    else if (value != null) result[key] = String(value);
  }
  return result;
};

const render = (
  key: string | null | undefined,
  params: Record<string, unknown> | null | undefined,
  fallback: string,
): string => {
  if (!key) return fallback;
  const resolved = t(key, toParams(params));
  return resolved === key ? fallback : resolved;
};

export const notificationTitle = (notification: LocalizableNotification): string =>
  render(notification.title_key, notification.params, notification.title);

export const notificationMessage = (notification: LocalizableNotification): string =>
  render(notification.message_key, notification.params, notification.message);
