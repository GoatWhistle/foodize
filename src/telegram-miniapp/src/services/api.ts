import axios from "axios";
import { createApi, createWebSocketFactories } from "@shared/services/api";
import { API_BASE_URL } from "@shared/config";

const BASE_URL = API_BASE_URL;

export const refreshAccessToken = async (): Promise<void> => {
  await axios.post(
    `${BASE_URL}/telegram/refresh`,
    {},
    { withCredentials: true },
  );
};

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
