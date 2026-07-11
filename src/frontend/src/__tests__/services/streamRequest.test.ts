import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { streamSseRequest } from '@shared/services/streamRequest.js';

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

function makeReader(chunks: string[]) {
  let i = 0;
  return {
    read: vi.fn(() => {
      if (i < chunks.length) {
        return Promise.resolve({ value: new TextEncoder().encode(chunks[i++]), done: false });
      }
      return Promise.resolve({ value: undefined, done: true });
    }),
  };
}

function makeResponse(status: number, chunks: string[], ok = true) {
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

    vi.resetModules();
    const { streamSseRequest: sseReq } = await import(
      '@shared/services/streamRequest'
    );
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

    const mod = await import('@shared/services/streamRequest.js');
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

    const mod = await import('@shared/services/streamRequest.js');
    await expect(
      mod.streamSseRequest('http://localhost:8000/api/v1/test', {}, {})
    ).rejects.toThrow('Ошибка 403');
  });

  it('attaches Authorization header when getToken returns a token', async () => {
    mockFetch.mockResolvedValue(makeResponse(200, ['ok']));

    await streamSseRequest(
      'http://localhost:8000/api/v1/ai/order/chat',
      { q: 1 },
      { getToken: () => 'tok-123' }
    );

    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:8000/api/v1/ai/order/chat',
      expect.objectContaining({
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer tok-123',
        },
      })
    );
  });

  it('omits credentials when withCredentials is false', async () => {
    mockFetch.mockResolvedValue(makeResponse(200, ['ok']));

    await streamSseRequest(
      'http://localhost:8000/api/v1/ai/order/chat',
      {},
      { getToken: () => 'tok', withCredentials: false }
    );

    const init = mockFetch.mock.calls[0][1] as RequestInit;
    expect(init.credentials).toBeUndefined();
  });

  it('does not attach Authorization when getToken returns null', async () => {
    mockFetch.mockResolvedValue(makeResponse(200, ['ok']));

    await streamSseRequest(
      'http://localhost:8000/api/v1/ai/order/chat',
      {},
      { getToken: () => null }
    );

    const init = mockFetch.mock.calls[0][1] as RequestInit;
    expect(init.headers).toEqual({ 'Content-Type': 'application/json' });
    expect(init.credentials).toBe('include');
  });

  it('on 401 calls provided refreshToken then retries with refreshed token', async () => {
    let token = 'stale';
    const refreshToken = vi.fn(() => {
      token = 'fresh';
      return Promise.resolve();
    });
    const onChunk = vi.fn();

    mockFetch
      .mockResolvedValueOnce({ status: 401, ok: false, body: null })
      .mockResolvedValueOnce(makeResponse(200, ['retried']));

    await streamSseRequest(
      'http://localhost:8000/api/v1/ai/order/chat',
      {},
      {
        getToken: () => token,
        refreshToken,
        withCredentials: false,
        onChunk,
      }
    );

    expect(refreshToken).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledTimes(2);
    const firstInit = mockFetch.mock.calls[0][1] as RequestInit;
    const secondInit = mockFetch.mock.calls[1][1] as RequestInit;
    expect((firstInit.headers as Record<string, string>).Authorization).toBe(
      'Bearer stale'
    );
    expect((secondInit.headers as Record<string, string>).Authorization).toBe(
      'Bearer fresh'
    );
    expect(onChunk).toHaveBeenCalledWith('retried');
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
