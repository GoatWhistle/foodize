import { t } from "@shared/i18n/useTranslation";

export const plural = (
  key: string,
  count: number,
  params?: Record<string, string | number>,
): string => t(key, { ...params, count });
