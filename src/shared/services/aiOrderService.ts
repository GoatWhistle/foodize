import { streamSseRequest, type StreamOptions } from '@shared/services/streamRequest';
import { API_BASE_URL } from '@shared/config';

const BASE_URL = API_BASE_URL;

export interface ChatMessage {
  role: string;
  content: string;
}

export const aiOrderService = {
  streamChat: (messages: ChatMessage[], options: StreamOptions = {}) =>
    streamSseRequest(`${BASE_URL}/ai/order/chat`, { messages }, options),
};
