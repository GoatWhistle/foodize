import api from './api';
import { streamSseRequest } from './streamRequest';

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api/v1';

export const aiAdvisorService = {
  getInsights: (refresh = false) =>
    api.get('/ai/advisor/insights', {
      params: refresh ? { refresh: true } : {},
    }),

  streamChat: (messages, { restaurantId, onChunk, signal } = {}) =>
    streamSseRequest(
      `${BASE_URL}/ai/advisor/chat`,
      { messages, restaurant_id: restaurantId ?? null },
      { onChunk, signal },
    ),
};
