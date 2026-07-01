import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAuthStore } from '../../store/useAuthStore';
import { authService } from '../../services/authService';

vi.mock('../../services/authService', () => ({
  authService: {
    login: vi.fn(),
    register: vi.fn(),
    getMe: vi.fn(),
    logout: vi.fn(),
    verifyTelegramLoginCode: vi.fn(),
    verifyTelegramLoginCodeByUsername: vi.fn(),
    setTelegramSitePassword: vi.fn(),
  },
}));

describe('useAuthStore', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: null,
      isAuthenticated: false,
    });
    vi.clearAllMocks();
  });

  it('initial state is correct', () => {
    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBe(null);
  });

  it('login updates state on success', async () => {
    const mockUser = { id: '1', name: 'Test' };
    authService.login.mockResolvedValueOnce({ data: { data: {} } });
    authService.getMe.mockResolvedValueOnce({ data: { data: mockUser } });

    await useAuthStore.getState().login({ phone_number: '123', password: 'pw' });

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.user).toEqual(mockUser);
  });

  it('login propagates errors', async () => {
    const errorMsg = 'Wrong credentials';
    authService.login.mockRejectedValueOnce(new Error(errorMsg));

    await expect(
      useAuthStore.getState().login({ phone_number: '123', password: 'pw' })
    ).rejects.toThrow(errorMsg);

    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });

  it('logout clears state', async () => {
    useAuthStore.setState({ isAuthenticated: true, user: { id: '1' } });
    authService.logout.mockResolvedValueOnce({});

    await useAuthStore.getState().logout();

    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(useAuthStore.getState().user).toBe(null);
  });

  it('loginWithTelegramCode updates user and returns requiresPassword', async () => {
    const mockUser = { id: 'tg-user', name: 'Telegram User' };
    authService.verifyTelegramLoginCode.mockResolvedValueOnce({
      data: { data: { requires_password: true } },
    });
    authService.getMe.mockResolvedValueOnce({ data: { data: mockUser } });

    const result = await useAuthStore.getState().loginWithTelegramCode({ code: '123456' });

    expect(result).toEqual({ requiresPassword: false });
    expect(useAuthStore.getState().user).toEqual(mockUser);
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
  });

  it('setTelegramSitePassword refreshes current user after saving password', async () => {
    const mockUser = { id: 'tg-user', name: 'Telegram User' };
    authService.setTelegramSitePassword.mockResolvedValueOnce({});
    authService.getMe.mockResolvedValueOnce({ data: { data: mockUser } });

    await useAuthStore.getState().setTelegramSitePassword('strongpassword');

    expect(authService.setTelegramSitePassword).toHaveBeenCalledWith({ password: 'strongpassword' });
    expect(useAuthStore.getState().user).toEqual(mockUser);
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
  });

  it('fetchMe clears auth state when current user request fails', async () => {
    useAuthStore.setState({ isAuthenticated: true, user: { id: '1' } });
    authService.getMe.mockRejectedValueOnce(new Error('expired'));

    await useAuthStore.getState().fetchMe();

    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(useAuthStore.getState().user).toBe(null);
  });

  it('loginWithTelegramCode clears auth and rethrows on failure', async () => {
    authService.verifyTelegramLoginCode.mockRejectedValueOnce(new Error('invalid code'));

    await expect(
      useAuthStore.getState().loginWithTelegramCode({ code: 'bad' })
    ).rejects.toThrow('invalid code');

    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(useAuthStore.getState().user).toBe(null);
  });

  it('loginWithTelegramCodeByUsername returns requiresPassword from response', async () => {
    const mockUser = { id: 'u2', name: 'User2' };
    authService.verifyTelegramLoginCodeByUsername.mockResolvedValueOnce({
      data: { data: { requires_password: true } },
    });
    authService.getMe.mockResolvedValueOnce({ data: { data: mockUser } });

    const result = await useAuthStore.getState().loginWithTelegramCodeByUsername({ username: 'foo', code: '123' });

    expect(result).toEqual({ requiresPassword: true });
    expect(useAuthStore.getState().user).toEqual(mockUser);
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
  });

  it('loginWithTelegramCodeByUsername clears auth and rethrows on failure', async () => {
    authService.verifyTelegramLoginCodeByUsername.mockRejectedValueOnce(new Error('bad username'));

    await expect(
      useAuthStore.getState().loginWithTelegramCodeByUsername({ username: 'x' })
    ).rejects.toThrow('bad username');

    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });

  it('setTelegramSitePassword clears auth and rethrows on failure', async () => {
    authService.setTelegramSitePassword.mockRejectedValueOnce(new Error('weak password'));

    await expect(
      useAuthStore.getState().setTelegramSitePassword('123')
    ).rejects.toThrow('weak password');

    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(useAuthStore.getState().user).toBe(null);
  });

  it('logout clears state even when authService.logout fails', async () => {
    useAuthStore.setState({ isAuthenticated: true, user: { id: '1' } });
    authService.logout.mockRejectedValueOnce(new Error('network'));

    await useAuthStore.getState().logout();

    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(useAuthStore.getState().user).toBe(null);
  });
});
