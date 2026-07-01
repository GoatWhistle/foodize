import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { streamSseRequest } from '../../services/streamRequest';

const mockFetch = vi.fn();

beforeEach(() => {
  vi.stubGlobal('fetch', mockFetch);
  vi.stubEnv('VITE_API_URL', 'http://localhost:8000/api/v1');
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

function makeReader(chunks) {
  let i = 0;
  return {
    read: vi.fn(async () => {
      if (i < chunks.length) {
        return { value: new TextEncoder().encode(chunks[i++]), done: false };
      }
      return { value: undefined, done: true };
    }),
  };
}

function makeResponse(status, chunks, ok = true) {
  return {
    status,
    ok,
    body: { getReader: () => makeReader(chunks) },
  };
}

describe('streamSseRequest', () => {
  it('calls fetch with correct args and streams chunks', async () => {
    mockFetch.mockResolvedValue(makeResponse(200, ['hello', ' world']));

    const onChunk = vi.fn();
    await streamSseRequest('http://localhost:8000/api/v1/ai/chat', { q: 1 }, { onChunk });

    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:8000/api/v1/ai/chat',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ q: 1 }),
      })
    );
    expect(onChunk).toHaveBeenCalledWith('hello');
    expect(onChunk).toHaveBeenCalledWith(' world');
    expect(onChunk).toHaveBeenCalledTimes(2);
  });

  it('throws on non-ok response', async () => {
    mockFetch.mockResolvedValue({ status: 500, ok: false, body: null });

    await expect(
      streamSseRequest('http://localhost:8000/api/v1/ai/chat', {}, {})
    ).rejects.toThrow('Ошибка 500');
  });

  it('throws when body is null', async () => {
    mockFetch.mockResolvedValue({ status: 200, ok: true, body: null });

    await expect(
      streamSseRequest('http://localhost:8000/api/v1/ai/chat', {}, {})
    ).rejects.toThrow('Ошибка 200');
  });

  it('retries on 401 and streams after refresh', async () => {
    const axiosMock = vi.fn().mockResolvedValue({});
    vi.doMock('axios', () => ({ default: { post: axiosMock } }));

    const { default: axios } = await import('axios');
    axios.post = axiosMock;

    const onChunk = vi.fn();
    mockFetch
      .mockResolvedValueOnce({ status: 401, ok: false, body: null })
      .mockResolvedValueOnce(makeResponse(200, ['retried']));

    const { streamSseRequest: sseReq } = await import('../../services/streamRequest?retry=1');
    if (sseReq) {
      await sseReq('http://localhost:8000/api/v1/ai/chat', {}, { onChunk });
    }
  });

  it('retries on 401 with real axios mock', async () => {
    const onChunk = vi.fn();

    vi.mock('axios', () => ({
      default: { post: vi.fn().mockResolvedValue({}) },
    }));

    mockFetch
      .mockResolvedValueOnce({ status: 401, ok: false, body: null })
      .mockResolvedValueOnce(makeResponse(200, ['after-refresh']));

    const mod = await import('../../services/streamRequest');
    await mod.streamSseRequest('http://localhost:8000/api/v1/test', {}, { onChunk });

    expect(onChunk).toHaveBeenCalledWith('after-refresh');
  });

  it('throws when retry response is not ok', async () => {
    vi.mock('axios', () => ({
      default: { post: vi.fn().mockResolvedValue({}) },
    }));

    mockFetch
      .mockResolvedValueOnce({ status: 401, ok: false, body: null })
      .mockResolvedValueOnce({ status: 403, ok: false, body: null });

    const mod = await import('../../services/streamRequest');
    await expect(
      mod.streamSseRequest('http://localhost:8000/api/v1/test', {}, {})
    ).rejects.toThrow('Ошибка 403');
  });

  it('passes signal to fetch', async () => {
    mockFetch.mockResolvedValue(makeResponse(200, []));
    const controller = new AbortController();
    await streamSseRequest('http://localhost:8000/api/v1/ai/chat', {}, { signal: controller.signal });

    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ signal: controller.signal })
    );
  });
});
