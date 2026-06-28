import axios from 'axios';
import { createWebSocketFactories } from '@shared/services/api.js';

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api/v1';

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
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
          { withCredentials: true },
        );
        const tokenData = refreshResponse.data?.data ?? refreshResponse.data;
        const { access_token } = tokenData;
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
  },
);

export default api;

const wsFactories = createWebSocketFactories(() => localStorage.getItem('access_token'));
export const createOrderWebSocket = wsFactories.createOrderWebSocket;
export const createNotificationWebSocket = wsFactories.createNotificationWebSocket;
export const createRestaurantOrdersWebSocket = wsFactories.createRestaurantOrdersWebSocket;
export const createDisplayBoardWebSocket = wsFactories.createDisplayBoardWebSocket;
