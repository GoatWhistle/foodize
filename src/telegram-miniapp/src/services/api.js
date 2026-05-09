import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000/api/v1";

const api = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      originalRequest.url !== "/telegram/auth" &&
      originalRequest.url !== "/telegram/check" &&
      originalRequest.url !== "/telegram/register"
    ) {
      originalRequest._retry = true;
      const refreshToken = sessionStorage.getItem("refresh_token");
      if (refreshToken) {
        try {
          const resp = await axios.post(
            `${BASE_URL}/refresh`,
            {},
            {
              headers: { Authorization: `Bearer ${refreshToken}` },
            },
          );
          const { access_token } = resp.data.data;
          sessionStorage.setItem("access_token", access_token);
          originalRequest.headers.Authorization = `Bearer ${access_token}`;
          return api(originalRequest);
        } catch {
          sessionStorage.clear();
        }
      }
    }

    return Promise.reject(error);
  },
);

export default api;

const WS_BASE = BASE_URL.replace(/^http/, "ws").replace(/\/api\/v1$/, "");

export function createOrderWebSocket(orderId, onMessage, onClose) {
  const ws = new WebSocket(`${WS_BASE}/api/v1/ws/orders/${orderId}`);
  ws.onmessage = (event) => {
    try {
      onMessage(JSON.parse(event.data));
    } catch {}
  };
  ws.onclose = () => onClose?.();
  ws.onerror = () => ws.close();
  return ws;
}

export function createNotificationWebSocket(userId, onMessage, onClose) {
  const token = sessionStorage.getItem("access_token");
  const url = `${WS_BASE}/api/v1/ws/notifications/${userId}${token ? `?token=${encodeURIComponent(token)}` : ""}`;
  const ws = new WebSocket(url);
  ws.onmessage = (event) => {
    try {
      onMessage(JSON.parse(event.data));
    } catch {}
  };
  ws.onclose = () => onClose?.();
  ws.onerror = () => ws.close();
  return ws;
}
