import { streamSseRequest } from './streamRequest';

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api/v1';

export const aiOrderService = {
  streamChat: (messages, { onChunk, signal } = {}) =>
    streamSseRequest(
      `${BASE_URL}/ai/order/chat`,
      { messages },
      { onChunk, signal },
    ),
};
