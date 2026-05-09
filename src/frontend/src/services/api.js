import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api/v1';

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    const detail = error.response?.data?.detail;
    if (detail && typeof detail === 'object' && detail.error) {
      error.response.data.detail = detail.error;
    }

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      originalRequest.url !== '/login' &&
      originalRequest.url !== '/refresh'
    ) {
      originalRequest._retry = true;
      try {
        const refreshResponse = await axios.post(
          `${BASE_URL}/refresh`,
          {},
          { withCredentials: true }
        );
        const { access_token } = refreshResponse.data;
        localStorage.setItem('access_token', access_token);
        originalRequest.headers.Authorization = `Bearer ${access_token}`;
        return api(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem('access_token');
        const path = window.location.pathname;
        if (path !== '/login' && path !== '/register') {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      }
    }

    if (error.response?.status === 401) {
      localStorage.removeItem('access_token');
      const path = window.location.pathname;
      if (path !== '/login' && path !== '/register') {
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export default api;

const WS_BASE_URL = (
  import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api/v1'
)
  .replace(/^http/, 'ws')
  .replace(/\/api\/v1$/, '');

class ReliableWebSocket {
  constructor(urlOrFactory, onMessage, onClose) {
    this.urlOrFactory = urlOrFactory;
    this.onMessage = onMessage;
    this.onClose = onClose;
    this.ws = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 12;
    this.isClosed = false;
    this.pingInterval = null;
    this.connect();
  }

  connect() {
    if (this.isClosed) return;
    const url =
      typeof this.urlOrFactory === 'function'
        ? this.urlOrFactory()
        : this.urlOrFactory;
    this.ws = new WebSocket(url);

    this.ws.onopen = () => {
      this.pingInterval = setInterval(() => {
        if (this.ws.readyState === WebSocket.OPEN) {
          this.ws.send(JSON.stringify({ type: 'ping' }));
        }
      }, 30000);
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'pong') return;
        if (data.type === 'connected') {
          this.reconnectAttempts = 0;
          return;
        }
        if (data.error) return;
        this.reconnectAttempts = 0;
        this.onMessage(data);
      } catch {}
    };

    this.ws.onclose = () => {
      this.cleanup();
      if (!this.isClosed) {
        this.reconnect();
      } else {
        this.onClose?.();
      }
    };

    this.ws.onerror = () => {
      this.ws.close();
    };
  }

  reconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.onClose?.();
      return;
    }
    const delay = Math.min(1000 * Math.pow(1.5, this.reconnectAttempts), 30000);
    this.reconnectAttempts++;
    setTimeout(() => this.connect(), delay);
  }

  cleanup() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  close() {
    this.isClosed = true;
    this.cleanup();
    if (this.ws) {
      this.ws.onclose = null;
      this.ws.close();
      this.onClose?.();
    }
  }
}

export function createOrderWebSocket(orderId, onMessage, onClose) {
  return new ReliableWebSocket(
    `${WS_BASE_URL}/api/v1/ws/orders/${orderId}`,
    onMessage,
    onClose
  );
}

export function createRestaurantOrdersWebSocket(
  restaurantId,
  onMessage,
  onClose
) {
  return new ReliableWebSocket(
    `${WS_BASE_URL}/api/v1/ws/restaurants/${restaurantId}/orders`,
    onMessage,
    onClose
  );
}

export function createDisplayBoardWebSocket(restaurantId, onMessage, onClose) {
  const token = localStorage.getItem('access_token') ?? '';
  return new ReliableWebSocket(
    `${WS_BASE_URL}/api/v1/ws/restaurants/${restaurantId}/display-board?token=${encodeURIComponent(token)}`,
    onMessage,
    onClose
  );
}

export function createNotificationWebSocket(userId, onMessage, onClose) {
  return new ReliableWebSocket(
    () => {
      const token = localStorage.getItem('access_token') || '';
      return `${WS_BASE_URL}/api/v1/ws/notifications/${userId}?token=${encodeURIComponent(token)}`;
    },
    onMessage,
    onClose
  );
}
