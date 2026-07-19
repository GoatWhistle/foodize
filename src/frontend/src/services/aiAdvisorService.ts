import { api } from './api';
import { streamSseRequest } from '@shared/services/streamRequest';
import { API_BASE_URL } from '@shared/config';
import type { SuccessResponse, AdvisorInsights } from '@shared/types/models';

const BASE_URL = API_BASE_URL;

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
    api.get<SuccessResponse<AdvisorInsights>>('/ai/advisor/insights', {
      params: refresh ? { refresh: true } : {},
    }),

  streamChat: (
    messages: AdvisorChatMessage[],
    { restaurantId, onChunk, signal }: StreamChatOptions = {},
  ): Promise<void> =>
    streamSseRequest(
      `${BASE_URL}/ai/advisor/chat`,
      { messages, restaurant_id: restaurantId ?? null },
      {
        ...(onChunk ? { onChunk } : {}),
        ...(signal ? { signal } : {}),
      },
    ),
};
