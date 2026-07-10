import axios from "axios";
import { createApi, createWebSocketFactories } from "@shared/services/api";

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000/api/v1";

interface RefreshResponse {
  data: {
    access_token: string;
  };
}

const api = createApi({
  getToken: () => sessionStorage.getItem("access_token"),
  withCredentials: false,
  skipRetryUrls: ["/telegram/auth", "/telegram/check", "/telegram/register"],
  refreshToken: async () => {
    const refreshToken = sessionStorage.getItem("refresh_token");
    if (!refreshToken) throw new Error("no refresh token");
    const resp = await axios.post<RefreshResponse>(
      `${BASE_URL}/refresh`,
      {},
      { headers: { "X-Refresh-Token": refreshToken } },
    );
    const { access_token } = resp.data.data;
    sessionStorage.setItem("access_token", access_token);
  },
  onUnauthorized: () => {
    sessionStorage.clear();
  },
});

export default api;

const wsFactories = createWebSocketFactories(() =>
  sessionStorage.getItem("access_token"),
);
export const createOrderWebSocket: typeof wsFactories.createOrderWebSocket = (...args) =>
  wsFactories.createOrderWebSocket(...args);
export const createNotificationWebSocket: typeof wsFactories.createNotificationWebSocket = (...args) =>
  wsFactories.createNotificationWebSocket(...args);
