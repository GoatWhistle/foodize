import { t } from "@shared/i18n/useTranslation";
import { dictionaries } from "@shared/i18n/dictionaries";
import { DEFAULT_LANGUAGE } from "@shared/i18n/types";

const errorDetailKeys = (): string[] => {
  const tree = dictionaries[DEFAULT_LANGUAGE] as unknown as {
    apiErrors: { byDetail: Record<string, string> };
  };
  return Object.keys(tree.apiErrors.byDetail);
};

const resolve = (key: string, params?: Record<string, string | number>): string | undefined => {
  const value = t(key, params ?? {});
  return value === key ? undefined : value;
};

const translateCode = (
  code: string | undefined,
  params: Record<string, string | number> | undefined,
): string | undefined => (code ? resolve(`apiErrors.byCode.${code}`, params) : undefined);

const translateDetail = (
  detail: string,
  params?: Record<string, string | number>,
): string | undefined => {
  const exact = resolve(`apiErrors.byDetail.${detail}`, params);
  if (exact) return exact;
  const prefix = errorDetailKeys().find((key) => detail.startsWith(key));
  return prefix != null ? resolve(`apiErrors.byDetail.${prefix}`, params) : undefined;
};

const translateStatus = (status: number | undefined): string | undefined =>
  status == null ? undefined : resolve(`apiErrors.byStatus.${status}`);

interface ErrorDescription {
  error?: string;
  code?: string;
  params?: Record<string, unknown>;
}

interface ApiErrorLike {
  response?: {
    status?: number;
    data?: { detail?: string | ErrorDescription | Array<{ msg?: string }> };
  };
}

const asApiError = (err: unknown): ApiErrorLike =>
  typeof err === "object" && err !== null ? (err) : {};

const toParams = (params: Record<string, unknown> | undefined): Record<string, string | number> => {
  const result: Record<string, string | number> = {};
  for (const [key, value] of Object.entries(params ?? {})) {
    if (typeof value === "string" || typeof value === "number") result[key] = value;
    else if (typeof value === "boolean" || typeof value === "bigint") result[key] = String(value);
    else if (value != null) result[key] = JSON.stringify(value);
  }
  return result;
};

const isDescription = (value: unknown): value is ErrorDescription =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export function translateApiError(err: unknown, fallback?: string): string {
  const normalized = asApiError(err);
  const detail = normalized.response?.data?.detail;
  const status = normalized.response?.status;

  if (isDescription(detail)) {
    const params = toParams(detail.params);
    const byCode = translateCode(detail.code, params);
    if (byCode) return byCode;
    const byDetail = detail.error ? translateDetail(detail.error, params) : undefined;
    if (byDetail) return byDetail;
    if (fallback) return fallback;
    return translateStatus(status) ?? detail.error ?? t("common.errors.unknown");
  }

  if (typeof detail === "string") {
    const translated = translateDetail(detail);
    if (translated) return translated;
    if (fallback) return fallback;
    return translateStatus(status) ?? detail;
  }

  if (Array.isArray(detail) && detail.length > 0) {
    const msg = detail[0]?.msg;
    if (msg) return fallback ?? msg;
  }

  const statusFallback = translateStatus(status);
  if (statusFallback) return fallback ?? statusFallback;

  return fallback ?? t("common.errors.unknown");
}
