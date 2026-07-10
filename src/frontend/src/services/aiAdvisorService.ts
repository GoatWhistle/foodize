import api from './api';
import { streamSseRequest } from '@shared/services/streamRequest';

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api/v1';

export interface AdvisorChatMessage {
  role: string;
  content: string;
}

export interface StreamChatOptions {
  restaurantId?: string | null;
  onChunk?: (text: string) => void;
  signal?: AbortSignal;
}

export const aiAdvisorService = {
  getInsights: (refresh = false) =>
    api.get('/ai/advisor/insights', {
      params: refresh ? { refresh: true } : {},
    }),

  streamChat: (
    messages: AdvisorChatMessage[],
    { restaurantId, onChunk, signal }: StreamChatOptions = {},
  ): Promise<void> =>
    streamSseRequest(
      `${BASE_URL}/ai/advisor/chat`,
      { messages, restaurant_id: restaurantId ?? null },
      { onChunk, signal },
    ),
};
