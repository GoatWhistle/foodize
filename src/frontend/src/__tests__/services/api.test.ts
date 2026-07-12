import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';

const importApiModule = async () => {
  vi.resetModules();
  return import('../../services/api');
};

describe('api infrastructure', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('builds order websocket URL without token in query string', async () => {
    const sockets: MockWebSocket[] = [];
    class MockWebSocket {
      static OPEN = 1;
      url: string;
      readyState: number;
      constructor(urlOrFactory: string | (() => string)) {
        this.url = typeof urlOrFactory === 'function' ? urlOrFactory() : urlOrFactory;
        this.readyState = MockWebSocket.OPEN;
        sockets.push(this);
      }
      send = vi.fn();
      close = vi.fn();
    }
    vi.stubGlobal('WebSocket', MockWebSocket);

    const { createOrderWebSocket } = await importApiModule();
    createOrderWebSocket('order-1', vi.fn(), vi.fn());

    expect(sockets[0]?.url).toBe('ws://localhost:8000/api/v1/ws/orders/order-1');
  });

  it('restaurant orders websocket connects without token in URL', async () => {
    const sockets: MockWebSocket[] = [];
    class MockWebSocket {
      static OPEN = 1;
      url: string;
      readyState: number;
      constructor(urlOrFactory: string | (() => string)) {
        this.url = typeof urlOrFactory === 'function' ? urlOrFactory() : urlOrFactory;
        this.readyState = MockWebSocket.OPEN;
        sockets.push(this);
      }
      send = vi.fn();
      close = vi.fn();
    }
    vi.stubGlobal('WebSocket', MockWebSocket);

    const { createRestaurantOrdersWebSocket } = await importApiModule();
    const ws = createRestaurantOrdersWebSocket('rest-1', vi.fn(), vi.fn());

    expect(sockets[0]?.url).toBe('ws://localhost:8000/api/v1/ws/restaurants/rest-1/orders');
    ws.close();
  });

  it('display board websocket connects without token in URL', async () => {
    const sockets: MockWebSocket[] = [];
    class MockWebSocket {
      url: string;
      constructor(urlOrFactory: string | (() => string)) {
        this.url = typeof urlOrFactory === 'function' ? urlOrFactory() : urlOrFactory;
        sockets.push(this);
      }
      send = vi.fn();
      close = vi.fn();
    }
    vi.stubGlobal('WebSocket', MockWebSocket);

    const { createDisplayBoardWebSocket } = await importApiModule();
    createDisplayBoardWebSocket('rest-2', vi.fn(), vi.fn());

    expect(sockets[0]?.url).toBe(
      'ws://localhost:8000/api/v1/ws/restaurants/rest-2/display-board'
    );
  });

  it('refreshes token via cookie and retries a 401 request once', async () => {
    const { default: api } = await importApiModule();
    const mock = new MockAdapter(api);
    const refresh = vi
      .spyOn(axios, 'post')
      .mockResolvedValueOnce({ data: {} });

    mock
      .onGet('/protected')
      .replyOnce(401, { detail: 'expired' })
      .onGet('/protected')
      .replyOnce(200, { ok: true });

    const result = await api.get('/protected');

    const headersMatcher: unknown = expect.objectContaining({
      'X-Request-Id': expect.any(String) as unknown,
    });
    expect(refresh).toHaveBeenCalledWith(
      'http://localhost:8000/api/v1/refresh',
      {},
      expect.objectContaining({
        withCredentials: true,
        headers: headersMatcher,
      })
    );
    expect(result.data).toEqual({ ok: true });
    mock.restore();
    refresh.mockRestore();
  });

  it('redirects to /login on second 401 (double 401 = onUnauthorized)', async () => {
    const originalLocation = window.location;
    delete (window as { location?: Location }).location;
    window.location = { pathname: '/profile', href: '' } as unknown as Location;

    const { default: api } = await importApiModule();
    const mock = new MockAdapter(api);
    vi.spyOn(axios, 'post').mockRejectedValueOnce(new Error('refresh failed'));

    mock.onGet('/double-401').reply(401, {});

    await expect(api.get('/double-401')).rejects.toThrow();

    expect(window.location.href).toBe('/login');
    mock.restore();
    window.location = originalLocation;
  });

  it('does not redirect to /login when already on /login', async () => {
    const originalLocation = window.location;
    delete (window as { location?: Location }).location;
    window.location = { pathname: '/login', href: '' } as unknown as Location;

    const { default: api } = await importApiModule();
    const mock = new MockAdapter(api);
    vi.spyOn(axios, 'post').mockRejectedValueOnce(new Error('refresh failed'));

    mock.onGet('/double-401-login').reply(401, {});

    await expect(api.get('/double-401-login')).rejects.toThrow();

    expect(window.location.href).toBe('');
    mock.restore();
    window.location = originalLocation;
  });

  it('normalizes nested API error detail before rejecting', async () => {
    const { default: api } = await importApiModule();
    const mock = new MockAdapter(api);
    mock.onGet('/bad-request').reply(400, {
      detail: { error: 'Readable error' },
    });

    await expect(api.get('/bad-request')).rejects.toMatchObject({
      response: { data: { detail: 'Readable error' } },
    });

    mock.restore();
  });
});
