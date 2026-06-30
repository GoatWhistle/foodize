import axios from "axios";

const WS_BASE_URL = (
  import.meta.env.VITE_API_URL ?? "http://localhost:8000/api/v1"
)
  .replace(/^http/, "ws")
  .replace(/\/api\/v1$/, "");

export class ReliableWebSocket {
  constructor(urlOrFactory, onMessage, onClose, onStatusChange) {
    this.urlOrFactory = urlOrFactory;
    this.onMessage = onMessage;
    this.onClose = onClose;
    this.onStatusChange = onStatusChange;
    this.ws = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 20;
    this.isClosed = false;
    this.pingInterval = null;
    this.pongTimeout = null;
    this.status = "connecting";
    this.connect();
  }

  updateStatus(newStatus) {
    if (this.status === newStatus) return;
    this.status = newStatus;
    this.onStatusChange?.(newStatus);
  }

  connect() {
    if (this.isClosed) return;
    this.updateStatus(
      this.reconnectAttempts > 0 ? "reconnecting" : "connecting",
    );
    const url =
      typeof this.urlOrFactory === "function"
        ? this.urlOrFactory()
        : this.urlOrFactory;
    this.ws = new WebSocket(url);

    this.ws.onopen = () => {
      this.reconnectAttempts = 0;
      this.updateStatus("connected");
      this.startHeartbeat();
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "pong") { this.resetPongTimeout(); return; }
        if (data.type === "connected") { this.reconnectAttempts = 0; return; }
        if (data.error) return;
        this.onMessage(data);
      } catch {}
    };

    this.ws.onclose = () => {
      this.cleanup();
      if (!this.isClosed) {
        this.reconnect();
      } else {
        this.updateStatus("closed");
        this.onClose?.();
      }
    };

    this.ws.onerror = () => { this.ws.close(); };
  }

  startHeartbeat() {
    this.pingInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: "ping" }));
        this.resetPongTimeout();
      }
    }, 30000);
  }

  resetPongTimeout() {
    if (this.pongTimeout) clearTimeout(this.pongTimeout);
    this.pongTimeout = setTimeout(() => { this.ws?.close(); }, 10000);
  }

  reconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.updateStatus("closed");
      this.onClose?.();
      return;
    }
    this.updateStatus("reconnecting");
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    this.reconnectAttempts++;
    setTimeout(() => this.connect(), delay);
  }

  cleanup() {
    if (this.pingInterval) { clearInterval(this.pingInterval); this.pingInterval = null; }
    if (this.pongTimeout) { clearTimeout(this.pongTimeout); this.pongTimeout = null; }
  }

  close() {
    this.isClosed = true;
    this.cleanup();
    if (this.ws) {
      this.ws.onclose = null;
      this.ws.close();
      this.updateStatus("closed");
      this.onClose?.();
    }
  }
}

export function createApi({ getToken, onUnauthorized, refreshToken, withCredentials = false, skipRetryUrls = [] }) {
  const BASE_URL =
    import.meta.env.VITE_API_URL ?? "http://localhost:8000/api/v1";

  const api = axios.create({
    baseURL: BASE_URL,
    withCredentials,
    headers: { "Content-Type": "application/json" },
  });

  let isRefreshing = false;
  let failedQueue = [];

  const processQueue = (error) => {
    failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve()));
    failedQueue = [];
  };

  if (getToken) {
    api.interceptors.request.use((config) => {
      const token = getToken();
      if (token) config.headers.Authorization = `Bearer ${token}`;
      return config;
    });
  }

  api.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;

      const detail = error.response?.data?.detail;
      if (detail && typeof detail === "object" && detail.error) {
        error.response.data.detail = detail.error;
      }

      const isSkipUrl = skipRetryUrls.some((u) => originalRequest.url?.includes(u));

      if (
        error.response?.status === 401 &&
        !originalRequest._retry &&
        !isSkipUrl &&
        refreshToken
      ) {
        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          }).then(() => api(originalRequest)).catch((err) => Promise.reject(err));
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
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      }

      if (error.response?.status === 401 && !originalRequest._retry) {
        onUnauthorized?.();
      }

      return Promise.reject(error);
    },
  );

  return api;
}

export function createWebSocketFactories(getToken) {
  const buildUrl = (path) => () => {
    const base = `${WS_BASE_URL}/api/v1${path}`;
    if (!getToken) return base;
    const token = getToken();
    return token ? `${base}?token=${encodeURIComponent(token)}` : base;
  };

  return {
    createOrderWebSocket(orderId, onMessage, onClose, onStatusChange) {
      return new ReliableWebSocket(
        buildUrl(`/ws/orders/${orderId}`),
        onMessage,
        onClose,
        onStatusChange,
      );
    },

    createNotificationWebSocket(userId, onMessage, onClose, onStatusChange) {
      return new ReliableWebSocket(
        buildUrl(`/ws/notifications/${userId}`),
        onMessage,
        onClose,
        onStatusChange,
      );
    },

    createRestaurantOrdersWebSocket(restaurantId, onMessage, onClose, onStatusChange) {
      return new ReliableWebSocket(
        buildUrl(`/ws/restaurants/${restaurantId}/orders`),
        onMessage,
        onClose,
        onStatusChange,
      );
    },

    createDisplayBoardWebSocket(restaurantId, onMessage, onClose, onStatusChange) {
      return new ReliableWebSocket(
        buildUrl(`/ws/restaurants/${restaurantId}/display-board`),
        onMessage,
        onClose,
        onStatusChange,
      );
    },
  };
}
