import { createApi, createWebSocketFactories } from "@shared/services/api";
import { cookieRefresh } from "@shared/services/cookieRefresh";
import { API_BASE_URL } from "@shared/config";

const BASE_URL = API_BASE_URL;

export const refreshAccessToken = (): Promise<void> =>
  cookieRefresh(BASE_URL, "/telegram/refresh");

const api = createApi({
  withCredentials: true,
  skipRetryUrls: [
    "/telegram/auth",
    "/telegram/check",
    "/telegram/register",
    "/telegram/refresh",
  ],
  refreshToken: refreshAccessToken,
});

export default api;

const wsFactories = createWebSocketFactories();
export const createOrderWebSocket: typeof wsFactories.createOrderWebSocket = (...args) =>
  wsFactories.createOrderWebSocket(...args);
export const createNotificationWebSocket: typeof wsFactories.createNotificationWebSocket = (...args) =>
  wsFactories.createNotificationWebSocket(...args);
