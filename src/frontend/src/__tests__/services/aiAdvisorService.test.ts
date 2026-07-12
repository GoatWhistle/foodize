import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../services/api', () => ({
  default: {
    get: vi.fn().mockResolvedValue({ data: {} }),
    post: vi.fn().mockResolvedValue({ data: {} }),
  },
}));

vi.mock('@shared/services/streamRequest.js', () => ({
  streamSseRequest: vi.fn().mockResolvedValue(undefined),
}));

import { aiAdvisorService } from '../../services/aiAdvisorService';
import api from '../../services/api';
import { streamSseRequest } from '@shared/services/streamRequest.js';

describe('aiAdvisorService', () => {
  beforeEach(() => vi.clearAllMocks());

  it('getInsights calls GET /ai/advisor/insights without refresh by default', async () => {
    await aiAdvisorService.getInsights();
    expect(vi.mocked(api).get).toHaveBeenCalledWith('/ai/advisor/insights', { params: {} });
  });

  it('getInsights with refresh=true adds param', async () => {
    await aiAdvisorService.getInsights(true);
    expect(vi.mocked(api).get).toHaveBeenCalledWith('/ai/advisor/insights', { params: { refresh: true } });
  });

  it('streamChat calls streamSseRequest with messages and restaurantId', async () => {
    const onChunk = vi.fn();
    const signal = new AbortController().signal;
    const messages = [{ role: 'user', content: 'hi' }];

    await aiAdvisorService.streamChat(messages, { restaurantId: 'rest-1', onChunk, signal });

    expect(streamSseRequest).toHaveBeenCalledWith(
      expect.stringContaining('/ai/advisor/chat'),
      { messages, restaurant_id: 'rest-1' },
      { onChunk, signal }
    );
  });

  it('streamChat uses null restaurantId when not provided', async () => {
    await aiAdvisorService.streamChat([], {});
    expect(streamSseRequest).toHaveBeenCalledWith(
      expect.any(String),
      { messages: [], restaurant_id: null },
      expect.anything()
    );
  });
});
