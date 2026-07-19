import axios, {
  type AxiosInstance,
  type AxiosError,
  type InternalAxiosRequestConfig,
} from "axios";
import { API_BASE_URL as SHARED_API_BASE_URL } from "@shared/config";
import { makeId } from "@shared/utils/id";
import type { TokenGetter } from "@shared/services/reliableWebSocket";

export interface CreateApiOptions {
  getToken?: TokenGetter;
  onUnauthorized?: () => void;
  refreshToken?: () => Promise<void>;
  withCredentials?: boolean;
  skipRetryUrls?: string[];
}

type RetriableConfig = InternalAxiosRequestConfig & { _retry?: boolean };

interface QueueItem {
  resolve: () => void;
  reject: (error: unknown) => void;
}

interface ErrorDetailObject {
  error?: string;
}

const CSRF_COOKIE_NAME = "csrf_token";
const CSRF_HEADER_NAME = "X-CSRF-Token";
const MUTATING_METHODS = new Set(["post", "put", "patch", "delete"]);

const readCsrfToken = (): string | null => {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${CSRF_COOKIE_NAME}=`));
  const value = match?.split("=")[1];
  return value ? decodeURIComponent(value) : null;
};

const normalizeErrorDetail = (
  error: AxiosError<{ detail?: unknown }>,
): void => {
  const response = error.response;
  if (!response) return;
  const detail = response.data.detail;
  if (
    detail &&
    typeof detail === "object" &&
    "error" in detail &&
    typeof (detail as ErrorDetailObject).error === "string"
  ) {
    response.data.detail = (detail as ErrorDetailObject).error;
  }
};

export function createApi({
  getToken,
  onUnauthorized,
  refreshToken,
  withCredentials = false,
  skipRetryUrls = [],
}: CreateApiOptions = {}): AxiosInstance {
  const BASE_URL = SHARED_API_BASE_URL;

  const api = axios.create({
    baseURL: BASE_URL,
    withCredentials,
    headers: { "Content-Type": "application/json" },
  });

  let isRefreshing = false;
  let failedQueue: QueueItem[] = [];

  const processQueue = (error: unknown): void => {
    failedQueue.forEach((p) => {
      if (error) p.reject(error);
      else p.resolve();
    });
    failedQueue = [];
  };

  api.interceptors.request.use((config) => {
    if (getToken) {
      const token = getToken();
      if (token) config.headers.Authorization = `Bearer ${token}`;
    }
    config.headers["X-Request-Id"] = makeId();
    if (withCredentials && MUTATING_METHODS.has((config.method ?? "").toLowerCase())) {
      const csrfToken = readCsrfToken();
      if (csrfToken) config.headers[CSRF_HEADER_NAME] = csrfToken;
    }
    return config;
  });

  api.interceptors.response.use(
    (response) => response,
    async (error: AxiosError<{ detail?: unknown }>) => {
      const originalRequest = error.config as RetriableConfig | undefined;

      normalizeErrorDetail(error);

      const isSkipUrl = skipRetryUrls.some((u) =>
        originalRequest?.url?.includes(u),
      );

      if (
        error.response?.status === 401 &&
        originalRequest &&
        !originalRequest._retry &&
        !isSkipUrl &&
        refreshToken
      ) {
        if (isRefreshing) {
          return new Promise<void>((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          }).then(() => api(originalRequest));
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
          await refreshToken();
          processQueue(null);
          return await api(originalRequest);
        } catch (refreshError) {
          processQueue(refreshError);
          onUnauthorized?.();
          return await Promise.reject(
            refreshError instanceof Error
              ? refreshError
              : new Error(String(refreshError)),
          );
        } finally {
          isRefreshing = false;
        }
      }

      if (
        error.response?.status === 401 &&
        originalRequest &&
        !originalRequest._retry
      ) {
        onUnauthorized?.();
      }

      return Promise.reject(error);
    },
  );

  return api;
}
