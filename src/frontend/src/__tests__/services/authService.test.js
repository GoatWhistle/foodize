import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import MockAdapter from 'axios-mock-adapter';
import api from '../../services/api';
import { authService } from '../../services/authService';

describe('authService', () => {
  let mock;

  beforeEach(() => {
    mock = new MockAdapter(api);
  });

  afterEach(() => {
    mock.restore();
  });

  it('login sends POST to /login', async () => {
    const mockData = { access_token: 'test' };
    mock.onPost('/login').reply(200, mockData);

    const result = await authService.login({
      phone_number: '123',
      password: 'pw',
    });
    expect(result.data).toEqual(mockData);
  });

  it('register sends POST to /register', async () => {
    const mockData = { id: '1', name: 'Ivan' };
    mock.onPost('/register').reply(200, mockData);

    const result = await authService.register({ name: 'Ivan' });
    expect(result.data).toEqual(mockData);
  });

  it('getMe sends GET to /users/me', async () => {
    const mockData = { id: '1', name: 'Ivan' };
    mock.onGet('/users/me').reply(200, mockData);

    const result = await authService.getMe();
    expect(result.data).toEqual(mockData);
  });

  it('logout sends POST to /logout so backend can invalidate tokens', async () => {
    mock.onPost('/logout').reply(204);

    const result = await authService.logout();

    expect(result.status).toBe(204);
  });

  it('requestTelegramLoginCode sends POST to telegram site-login', async () => {
    mock.onPost('/telegram/site-login/request-code').reply(200, { ok: true });
    const result = await authService.requestTelegramLoginCode({ phone: '79001234567' });
    expect(result.data).toEqual({ ok: true });
  });

  it('requestTelegramLoginCodeByUsername sends POST', async () => {
    mock.onPost('/telegram/site-login/request-code-by-username').reply(200, { ok: true });
    const result = await authService.requestTelegramLoginCodeByUsername({ username: 'user' });
    expect(result.data).toEqual({ ok: true });
  });

  it('verifyTelegramLoginCode sends POST', async () => {
    mock.onPost('/telegram/site-login/verify').reply(200, { token: 'abc' });
    const result = await authService.verifyTelegramLoginCode({ code: '123456' });
    expect(result.data).toEqual({ token: 'abc' });
  });

  it('verifyTelegramLoginCodeByUsername sends POST', async () => {
    mock.onPost('/telegram/site-login/verify-by-username').reply(200, { token: 'abc' });
    const result = await authService.verifyTelegramLoginCodeByUsername({ username: 'u', code: '1' });
    expect(result.data).toEqual({ token: 'abc' });
  });

  it('setTelegramSitePassword sends POST', async () => {
    mock.onPost('/telegram/site-login/password').reply(200, { ok: true });
    const result = await authService.setTelegramSitePassword({ password: 'strongpw' });
    expect(result.data).toEqual({ ok: true });
  });

  it('telegramLogout sends POST to /telegram/logout', async () => {
    mock.onPost('/telegram/logout').reply(204);
    const result = await authService.telegramLogout();
    expect(result.status).toBe(204);
  });
});
