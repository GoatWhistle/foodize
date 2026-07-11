import axios, {
  type AxiosInstance,
  type AxiosError,
  type InternalAxiosRequestConfig,
} from "axios";
import { API_BASE_URL as SHARED_API_BASE_URL } from "@shared/config";
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

const generateRequestId = (): string =>
  globalThis.crypto?.randomUUID?.() ??
  `${Date.now()}-${Math.random().toString(16).slice(2)}`;

interface ErrorDetailObject {
  error?: string;
}

const normalizeErrorDetail = (
  error: AxiosError<{ detail?: unknown }>,
): void => {
  const response = error.response;
  if (!response) return;
  const detail = response.data?.detail;
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
    failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve()));
    failedQueue = [];
  };

  api.interceptors.request.use((config) => {
    if (getToken) {
      const token = getToken();
      if (token) config.headers.Authorization = `Bearer ${token}`;
    }
    config.headers["X-Request-Id"] = generateRequestId();
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
          return api(originalRequest);
        } catch (refreshError) {
          processQueue(refreshError);
          onUnauthorized?.();
          return Promise.reject(
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
