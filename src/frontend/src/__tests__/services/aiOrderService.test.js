import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@shared/services/streamRequest.js', () => ({
  streamSseRequest: vi.fn().mockResolvedValue(undefined),
}));

import { aiOrderService } from '../../services/aiOrderService';
import { streamSseRequest } from '@shared/services/streamRequest.js';

describe('aiOrderService', () => {
  beforeEach(() => vi.clearAllMocks());

  it('streamChat calls streamSseRequest with messages', async () => {
    const onChunk = vi.fn();
    const signal = new AbortController().signal;
    const messages = [{ role: 'user', content: 'что заказать?' }];

    await aiOrderService.streamChat(messages, { onChunk, signal });

    expect(streamSseRequest).toHaveBeenCalledWith(
      expect.stringContaining('/ai/order/chat'),
      { messages },
      { onChunk, signal }
    );
  });

  it('streamChat works without options', async () => {
    await aiOrderService.streamChat([]);
    expect(streamSseRequest).toHaveBeenCalledWith(
      expect.any(String),
      { messages: [] },
      { onChunk: undefined, signal: undefined }
    );
  });
});
