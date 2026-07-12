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

    const headersMatcher: unknown = expect.objectContaining({ 'Content-Type': 'application/json' });
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:8000/api/v1/ai/chat',
      expect.objectContaining({
        method: 'POST',
        headers: headersMatcher,
        credentials: 'include',
        body: JSON.stringify({ q: 1 }),
      })
    );
    const chatCall = mockFetch.mock.calls[0];
    if (!chatCall) throw new Error('fetch was not called');
    const chatInit = chatCall[1] as RequestInit;
    expect((chatInit.headers as Record<string, string>)['X-Request-Id']).toBeTruthy();
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
    await sseReq('http://localhost:8000/api/v1/ai/chat', {}, { onChunk });
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

    const authHeadersMatcher: unknown = expect.objectContaining({
      'Content-Type': 'application/json',
      Authorization: 'Bearer tok-123',
    });
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:8000/api/v1/ai/order/chat',
      expect.objectContaining({
        headers: authHeadersMatcher,
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

    const initCall = mockFetch.mock.calls[0];
    if (!initCall) throw new Error('fetch was not called');
    const init = initCall[1] as RequestInit;
    expect(init.credentials).toBeUndefined();
  });

  it('does not attach Authorization when getToken returns null', async () => {
    mockFetch.mockResolvedValue(makeResponse(200, ['ok']));

    await streamSseRequest(
      'http://localhost:8000/api/v1/ai/order/chat',
      {},
      { getToken: () => null }
    );

    const initCall = mockFetch.mock.calls[0];
    if (!initCall) throw new Error('fetch was not called');
    const init = initCall[1] as RequestInit;
    expect(init.headers).toEqual(
      expect.objectContaining({ 'Content-Type': 'application/json' })
    );
    expect((init.headers as Record<string, string>).Authorization).toBeUndefined();
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
    const firstCall = mockFetch.mock.calls[0];
    const secondCall = mockFetch.mock.calls[1];
    if (!firstCall || !secondCall) throw new Error('fetch was not called twice');
    const firstInit = firstCall[1] as RequestInit;
    const secondInit = secondCall[1] as RequestInit;
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
