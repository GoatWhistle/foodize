import { streamSseRequest, type StreamOptions } from '@shared/services/streamRequest';

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api/v1';

export interface ChatMessage {
  role: string;
  content: string;
}

export const aiOrderService = {
  streamChat: (messages: ChatMessage[], { onChunk, signal }: StreamOptions = {}) =>
    streamSseRequest(
      `${BASE_URL}/ai/order/chat`,
      { messages },
      { onChunk, signal },
    ),
};
