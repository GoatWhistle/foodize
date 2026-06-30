import axios from 'axios';
import { createApi, createWebSocketFactories } from '@shared/services/api.js';

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api/v1';

const api = createApi({
  withCredentials: true,
  skipRetryUrls: ['/login', '/refresh'],
  refreshToken: async () => {
    await axios.post(
      `${BASE_URL}/refresh`,
      {},
      { withCredentials: true },
    );
  },
  onUnauthorized: () => {
    const path = window.location.pathname;
    if (path !== '/login' && path !== '/register') {
      window.location.href = '/login';
    }
  },
});

export default api;

const wsFactories = createWebSocketFactories();
export const createOrderWebSocket = wsFactories.createOrderWebSocket;
export const createNotificationWebSocket = wsFactories.createNotificationWebSocket;
export const createRestaurantOrdersWebSocket = wsFactories.createRestaurantOrdersWebSocket;
export const createDisplayBoardWebSocket = wsFactories.createDisplayBoardWebSocket;
