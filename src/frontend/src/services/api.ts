import axios from 'axios';
import type { AxiosInstance } from 'axios';
import { createApi, createWebSocketFactories } from '@shared/services/api';
import { API_BASE_URL } from '@shared/config';

const BASE_URL = API_BASE_URL;

const api: AxiosInstance = createApi({
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
export const createOrderWebSocket: typeof wsFactories.createOrderWebSocket = (...args) =>
  wsFactories.createOrderWebSocket(...args);
export const createNotificationWebSocket: typeof wsFactories.createNotificationWebSocket = (...args) =>
  wsFactories.createNotificationWebSocket(...args);
export const createRestaurantOrdersWebSocket: typeof wsFactories.createRestaurantOrdersWebSocket = (...args) =>
  wsFactories.createRestaurantOrdersWebSocket(...args);
export const createDisplayBoardWebSocket: typeof wsFactories.createDisplayBoardWebSocket = (...args) =>
  wsFactories.createDisplayBoardWebSocket(...args);
