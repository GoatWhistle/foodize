import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAuthStore } from '../../store/useAuthStore';
import { authService } from '@shared/services/authService';
import type { UserRead } from '@shared/types/models';

vi.mock('@shared/services/authService', () => ({
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
    });
    vi.clearAllMocks();
  });

  it('initial state is correct', () => {
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.user).toBe(null);
  });

  it('login updates state on success', async () => {
    const mockUser = { id: '1', name: 'Test' };
    vi.mocked(authService.login).mockResolvedValueOnce({ data: { data: {} } } as never);
    vi.mocked(authService.getMe).mockResolvedValueOnce({ data: { data: mockUser } } as never);

    await useAuthStore.getState().login({ phone_number: '123', password: 'pw' });

    const state = useAuthStore.getState();
    expect(state.user).not.toBeNull();
    expect(state.user).toEqual(mockUser);
  });

  it('login propagates errors', async () => {
    const errorMsg = 'Wrong credentials';
    vi.mocked(authService.login).mockRejectedValueOnce(new Error(errorMsg));

    await expect(
      useAuthStore.getState().login({ phone_number: '123', password: 'pw' })
    ).rejects.toThrow(errorMsg);

    expect(useAuthStore.getState().user).toBeNull();
  });

  it('logout clears state', async () => {
    useAuthStore.setState({ user: { id: '1' } as unknown as UserRead });
    vi.mocked(authService.logout).mockResolvedValueOnce({});

    await useAuthStore.getState().logout();

    expect(useAuthStore.getState().user).toBeNull();
    expect(useAuthStore.getState().user).toBe(null);
  });

  it('loginWithTelegramCode updates user and returns requiresPassword', async () => {
    const mockUser = { id: 'tg-user', name: 'Telegram User' };
    vi.mocked(authService.verifyTelegramLoginCode).mockResolvedValueOnce({
      data: { data: { requires_password: true } },
    } as never);
    vi.mocked(authService.getMe).mockResolvedValueOnce({ data: { data: mockUser } } as never);

    const result = await useAuthStore
      .getState()
      .loginWithTelegramCode({ phone_number: '123', code: '123456' });

    expect(result).toEqual({ requiresPassword: false });
    expect(useAuthStore.getState().user).toEqual(mockUser);
    expect(useAuthStore.getState().user).not.toBeNull();
  });

  it('setTelegramSitePassword refreshes current user after saving password', async () => {
    const mockUser = { id: 'tg-user', name: 'Telegram User' };
    vi.mocked(authService.setTelegramSitePassword).mockResolvedValueOnce({} as never);
    vi.mocked(authService.getMe).mockResolvedValueOnce({ data: { data: mockUser } } as never);

    await useAuthStore.getState().setTelegramSitePassword('strongpassword');

    expect(authService.setTelegramSitePassword).toHaveBeenCalledWith({ password: 'strongpassword' });
    expect(useAuthStore.getState().user).toEqual(mockUser);
    expect(useAuthStore.getState().user).not.toBeNull();
  });

  it('fetchMe clears auth state when current user request fails', async () => {
    useAuthStore.setState({ user: { id: '1' } as unknown as UserRead });
    vi.mocked(authService.getMe).mockRejectedValueOnce(new Error('expired'));

    await useAuthStore.getState().fetchMe();

    expect(useAuthStore.getState().user).toBeNull();
    expect(useAuthStore.getState().user).toBe(null);
  });

  it('loginWithTelegramCode clears auth and rethrows on failure', async () => {
    vi.mocked(authService.verifyTelegramLoginCode).mockRejectedValueOnce(new Error('invalid code'));

    await expect(
      useAuthStore.getState().loginWithTelegramCode({ phone_number: '123', code: 'bad' }),
    ).rejects.toThrow('invalid code');

    expect(useAuthStore.getState().user).toBeNull();
    expect(useAuthStore.getState().user).toBe(null);
  });

  it('loginWithTelegramCodeByUsername returns requiresPassword from response', async () => {
    const mockUser = { id: 'u2', name: 'User2' };
    vi.mocked(authService.verifyTelegramLoginCodeByUsername).mockResolvedValueOnce({
      data: { data: { requires_password: true } },
    } as never);
    vi.mocked(authService.getMe).mockResolvedValueOnce({ data: { data: mockUser } } as never);

    const result = await useAuthStore
      .getState()
      .loginWithTelegramCodeByUsername({ telegram_username: 'foo', code: '123' });

    expect(result).toEqual({ requiresPassword: true });
    expect(useAuthStore.getState().user).toEqual(mockUser);
    expect(useAuthStore.getState().user).not.toBeNull();
  });

  it('loginWithTelegramCodeByUsername clears auth and rethrows on failure', async () => {
    vi.mocked(authService.verifyTelegramLoginCodeByUsername).mockRejectedValueOnce(new Error('bad username'));

    await expect(
      useAuthStore
        .getState()
        .loginWithTelegramCodeByUsername({ telegram_username: 'x', code: '000000' }),
    ).rejects.toThrow('bad username');

    expect(useAuthStore.getState().user).toBeNull();
  });

  it('setTelegramSitePassword clears auth and rethrows on failure', async () => {
    vi.mocked(authService.setTelegramSitePassword).mockRejectedValueOnce(new Error('weak password'));

    await expect(
      useAuthStore.getState().setTelegramSitePassword('123'),
    ).rejects.toThrow('weak password');

    expect(useAuthStore.getState().user).toBeNull();
    expect(useAuthStore.getState().user).toBe(null);
  });

  it('logout clears state even when authService.logout fails', async () => {
    useAuthStore.setState({ user: { id: '1' } as unknown as UserRead });
    vi.mocked(authService.logout).mockRejectedValueOnce(new Error('network'));

    await useAuthStore.getState().logout();

    expect(useAuthStore.getState().user).toBeNull();
    expect(useAuthStore.getState().user).toBe(null);
  });
});
