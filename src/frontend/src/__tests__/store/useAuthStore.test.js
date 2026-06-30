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
});
