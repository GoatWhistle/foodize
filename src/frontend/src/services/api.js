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

export function createOrderWebSocket(orderId, onMessage, onClose) {
  const ws = new WebSocket(`${WS_BASE_URL}/api/v1/ws/orders/${orderId}`);
  ws.onmessage = (event) => {
    try {
      onMessage(JSON.parse(event.data));
    } catch {}
  };
  ws.onclose = () => onClose?.();
  ws.onerror = () => ws.close();
  return ws;
}

export function createRestaurantOrdersWebSocket(
  restaurantId,
  onMessage,
  onClose
) {
  const ws = new WebSocket(
    `${WS_BASE_URL}/api/v1/ws/restaurants/${restaurantId}/orders`
  );
  ws.onmessage = (event) => {
    try {
      onMessage(JSON.parse(event.data));
    } catch {}
  };
  ws.onclose = () => onClose?.();
  ws.onerror = () => ws.close();
  return ws;
}

export function createDisplayBoardWebSocket(restaurantId, onMessage, onClose) {
  const token = localStorage.getItem('access_token') ?? '';
  const ws = new WebSocket(
    `${WS_BASE_URL}/api/v1/ws/restaurants/${restaurantId}/display-board?token=${encodeURIComponent(token)}`
  );
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
  const ws = new WebSocket(
    `${WS_BASE_URL}/api/v1/ws/users/${userId}/notifications`
  );
  ws.onmessage = (event) => {
    try {
      onMessage(JSON.parse(event.data));
    } catch {}
  };
  ws.onclose = () => onClose?.();
  ws.onerror = () => ws.close();
  return ws;
}
