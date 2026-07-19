import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { LoginPage } from '../../../pages/auth/LoginPage';
import { useAuthStore } from '../../../store/useAuthStore';
import { authService } from '@shared/services/authService';
import { userService } from '@shared/services/userService';

type AuthState = {
  login: ReturnType<typeof vi.fn>;
  loginWithTelegramCodeByUsername: ReturnType<typeof vi.fn>;
  setTelegramSitePassword: ReturnType<typeof vi.fn>;
  fetchMe: ReturnType<typeof vi.fn>;
};

const storeState: AuthState = {
  login: vi.fn(),
  loginWithTelegramCodeByUsername: vi.fn(),
  setTelegramSitePassword: vi.fn(),
  fetchMe: vi.fn(),
};

vi.mock('../../../store/useAuthStore', () => ({
  useAuthStore: vi.fn((sel?: (s: AuthState) => unknown) => (sel ? sel(storeState) : storeState)),
}));

vi.mock('@shared/services/authService', () => ({
  authService: { requestTelegramLoginCodeByUsername: vi.fn() },
}));

vi.mock('@shared/services/userService', () => ({
  userService: { updateMe: vi.fn() },
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

const renderPage = () =>
  render(
    <MemoryRouter>
      <LoginPage />
    </MemoryRouter>,
  );

const goToTelegramUsername = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getByRole('button', { name: /Войти через Telegram/ }));
  return screen.getByLabelText('Telegram @username');
};

describe('LoginPage telegram + set-password flows', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    storeState.login = vi.fn().mockResolvedValue(undefined);
    storeState.loginWithTelegramCodeByUsername = vi.fn();
    storeState.setTelegramSitePassword = vi.fn().mockResolvedValue(undefined);
    storeState.fetchMe = vi.fn().mockResolvedValue(undefined);
    vi.mocked(useAuthStore).mockImplementation(((sel?: (s: AuthState) => unknown) =>
      sel ? sel(storeState) : storeState) as typeof useAuthStore);
  });

  it('switches to telegram username step and requests a code', async () => {
    vi.mocked(authService.requestTelegramLoginCodeByUsername).mockResolvedValueOnce(
      undefined as unknown as Awaited<
        ReturnType<typeof authService.requestTelegramLoginCodeByUsername>
      >,
    );
    const user = userEvent.setup();
    renderPage();
    const input = await goToTelegramUsername(user);
    await user.type(input, 'validuser');
    await user.click(screen.getByRole('button', { name: 'Получить код в Telegram' }));
    await waitFor(() => {
      expect(authService.requestTelegramLoginCodeByUsername).toHaveBeenCalledWith({
        telegram_username: 'validuser',
      });
    });
    expect(await screen.findByLabelText('Код из Telegram')).toBeInTheDocument();
  });

  it('shows bot link when username lookup returns 404', async () => {
    vi.mocked(authService.requestTelegramLoginCodeByUsername).mockRejectedValueOnce({
      response: { status: 404 },
    });
    const user = userEvent.setup();
    renderPage();
    const input = await goToTelegramUsername(user);
    await user.type(input, 'validuser');
    await user.click(screen.getByRole('button', { name: 'Получить код в Telegram' }));
    expect(await screen.findByText(/Аккаунт не найден/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Открыть/ })).toBeInTheDocument();
  });

  it('shows generic error when username lookup fails non-404', async () => {
    vi.mocked(authService.requestTelegramLoginCodeByUsername).mockRejectedValueOnce({
      response: { status: 500 },
    });
    const user = userEvent.setup();
    renderPage();
    const input = await goToTelegramUsername(user);
    await user.type(input, 'validuser');
    await user.click(screen.getByRole('button', { name: 'Получить код в Telegram' }));
    expect(await screen.findByText('Не удалось отправить код')).toBeInTheDocument();
  });

  it('goes back to password step from username form', async () => {
    const user = userEvent.setup();
    renderPage();
    await goToTelegramUsername(user);
    await user.click(screen.getByRole('button', { name: 'Назад' }));
    expect(await screen.findByLabelText('Телефон')).toBeInTheDocument();
  });

  const reachCodeStep = async (user: ReturnType<typeof userEvent.setup>) => {
    vi.mocked(authService.requestTelegramLoginCodeByUsername).mockResolvedValueOnce(
      undefined as unknown as Awaited<
        ReturnType<typeof authService.requestTelegramLoginCodeByUsername>
      >,
    );
    const input = await goToTelegramUsername(user);
    await user.type(input, 'validuser');
    await user.click(screen.getByRole('button', { name: 'Получить код в Telegram' }));
    await screen.findByLabelText('Код из Telegram');
  };

  it('logs in with code and navigates when password not required', async () => {
    storeState.loginWithTelegramCodeByUsername = vi.fn().mockResolvedValue({ requiresPassword: false });
    const user = userEvent.setup();
    renderPage();
    await reachCodeStep(user);
    await user.type(screen.getByLabelText('Код из Telegram'), '123456');
    await user.click(screen.getByRole('button', { name: 'Подтвердить код' }));
    await waitFor(() => {
      expect(storeState.loginWithTelegramCodeByUsername).toHaveBeenCalledWith({
        telegram_username: 'validuser',
        code: '123456',
      });
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  it('moves to set-password step when password is required', async () => {
    storeState.loginWithTelegramCodeByUsername = vi.fn().mockResolvedValue({ requiresPassword: true });
    const user = userEvent.setup();
    renderPage();
    await reachCodeStep(user);
    await user.type(screen.getByLabelText('Код из Telegram'), '123456');
    await user.click(screen.getByRole('button', { name: 'Подтвердить код' }));
    expect(await screen.findByLabelText('Новый пароль')).toBeInTheDocument();
  });

  it('shows error when code verification fails', async () => {
    storeState.loginWithTelegramCodeByUsername = vi.fn().mockRejectedValue({
      response: { status: 400 },
    });
    const user = userEvent.setup();
    renderPage();
    await reachCodeStep(user);
    await user.type(screen.getByLabelText('Код из Telegram'), '123456');
    await user.click(screen.getByRole('button', { name: 'Подтвердить код' }));
    expect(await screen.findByText('Неверный код из Telegram')).toBeInTheDocument();
  });

  const reachSetPassword = async (user: ReturnType<typeof userEvent.setup>) => {
    storeState.loginWithTelegramCodeByUsername = vi.fn().mockResolvedValue({ requiresPassword: true });
    await reachCodeStep(user);
    await user.type(screen.getByLabelText('Код из Telegram'), '123456');
    await user.click(screen.getByRole('button', { name: 'Подтвердить код' }));
    await screen.findByLabelText('Новый пароль');
  };

  it('shows error when passwords do not match', async () => {
    const user = userEvent.setup();
    renderPage();
    await reachSetPassword(user);
    await user.type(screen.getByLabelText('Новый пароль'), 'Abcdefg1');
    await user.type(screen.getByLabelText('Повторите пароль'), 'Abcdefg2');
    const form = screen.getByLabelText('Новый пароль').closest('form') as HTMLFormElement;
    form.requestSubmit();
    expect(await screen.findByText('Пароли не совпадают')).toBeInTheDocument();
  });

  it('shows error when password too weak', async () => {
    const user = userEvent.setup();
    renderPage();
    await reachSetPassword(user);
    await user.type(screen.getByLabelText('Новый пароль'), 'aaaaaaaa');
    await user.type(screen.getByLabelText('Повторите пароль'), 'aaaaaaaa');
    const form = screen.getByLabelText('Новый пароль').closest('form') as HTMLFormElement;
    form.requestSubmit();
    expect(await screen.findByText('Пароль слишком слабый')).toBeInTheDocument();
  });

  it('saves password with profile update and navigates', async () => {
    vi.mocked(userService.updateMe).mockResolvedValue(
      {} as unknown as Awaited<ReturnType<typeof userService.updateMe>>,
    );
    const user = userEvent.setup();
    renderPage();
    await reachSetPassword(user);
    await user.type(screen.getByLabelText('Имя'), 'Ivan');
    await user.type(screen.getByLabelText('Новый пароль'), 'Abcdefg1');
    await user.type(screen.getByLabelText('Повторите пароль'), 'Abcdefg1');
    await user.click(screen.getByRole('button', { name: 'Сохранить пароль' }));
    await waitFor(() => {
      expect(storeState.setTelegramSitePassword).toHaveBeenCalledWith('Abcdefg1');
      expect(userService.updateMe).toHaveBeenCalledWith({ first_name: 'Ivan', last_name: '' });
      expect(storeState.fetchMe).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  it('shows error when saving password fails', async () => {
    storeState.setTelegramSitePassword = vi.fn().mockRejectedValue({ response: { status: 500 } });
    const user = userEvent.setup();
    renderPage();
    await reachSetPassword(user);
    await user.type(screen.getByLabelText('Новый пароль'), 'Abcdefg1');
    await user.type(screen.getByLabelText('Повторите пароль'), 'Abcdefg1');
    await user.click(screen.getByRole('button', { name: 'Сохранить пароль' }));
    expect(await screen.findByText('Не удалось сохранить пароль')).toBeInTheDocument();
  });

});
