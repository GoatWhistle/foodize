import type { AxiosInstance } from "axios";
import { createApi, createWebSocketFactories } from "@shared/services/api";
import { API_BASE_URL } from "@shared/config";
import { tokenStorage } from "@/platform/tokenStorage";
import { tokenRefresh } from "@/services/tokenRefresh";
import { installCertificatePinning } from "@/platform/certificatePinning";

const BASE_URL = API_BASE_URL;

let onUnauthorizedHandler: (() => void) | null = null;

export function setOnUnauthorized(handler: () => void): void {
  onUnauthorizedHandler = handler;
}

export const api: AxiosInstance = createApi({
  withCredentials: false,
  skipRetryUrls: ["/login", "/refresh"],
  getToken: () => tokenStorage.getAccessToken(),
  refreshToken: () => tokenRefresh(BASE_URL),
  onUnauthorized: () => {
    onUnauthorizedHandler?.();
  },
});

installCertificatePinning(api, { baseUrl: BASE_URL });

const wsFactories = createWebSocketFactories();
export const createOrderWebSocket: typeof wsFactories.createOrderWebSocket = (...args) =>
  wsFactories.createOrderWebSocket(...args);
export const createNotificationWebSocket: typeof wsFactories.createNotificationWebSocket = (
  ...args
) => wsFactories.createNotificationWebSocket(...args);
export const createRestaurantOrdersWebSocket: typeof wsFactories.createRestaurantOrdersWebSocket = (
  ...args
) => wsFactories.createRestaurantOrdersWebSocket(...args);
export const createDisplayBoardWebSocket: typeof wsFactories.createDisplayBoardWebSocket = (
  ...args
) => wsFactories.createDisplayBoardWebSocket(...args);
