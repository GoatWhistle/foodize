import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { LoginPage } from '../../pages/auth/LoginPage';
import { useAuthStore } from '../../store/useAuthStore';

type AuthSelector = (s: Record<string, unknown>) => unknown;

vi.mock('../../store/useAuthStore', () => ({
  useAuthStore: vi.fn((selector?: AuthSelector) => {
    const state = {
      login: vi.fn(),
      loginWithTelegramCode: vi.fn(),
      setTelegramSitePassword: vi.fn(),
      fetchMe: vi.fn(),
      error: null,
    };
    return selector ? selector(state) : state;
  }),
}));

vi.mock('@shared/services/authService.js', () => ({
  authService: {
    requestTelegramLoginCode: vi.fn(),
  },
}));

vi.mock('@shared/services/userService.js', () => ({
  userService: {
    updateMe: vi.fn(),
  },
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders login form correctly', () => {
    render(
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>
    );

    expect(screen.getByLabelText('Телефон')).toBeInTheDocument();
    expect(screen.getByLabelText('Пароль')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Войти' })).toBeInTheDocument();
  });

  it('calls login and navigates on successful submit', async () => {
    const mockLogin = vi.fn().mockResolvedValueOnce(undefined);
    vi.mocked(useAuthStore).mockImplementation(((sel?: AuthSelector) => {
      const state = { login: mockLogin };
      return sel ? sel(state) : state;
    }) as typeof useAuthStore);

    const user = userEvent.setup();
    render(
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>
    );

    await user.type(screen.getByLabelText('Телефон'), '+7123');
    await user.type(screen.getByLabelText('Пароль'), 'password123');
    await user.click(screen.getByRole('button', { name: 'Войти' }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        phone_number: '+7123',
        password: 'password123',
      });
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  it('shows translated error message if login fails', async () => {
    const mockLogin = vi.fn().mockRejectedValueOnce({
      response: { data: { detail: 'Invalid credentials' } },
    });
    vi.mocked(useAuthStore).mockImplementation(((sel?: AuthSelector) => {
      const state = {
        login: mockLogin,
        loginWithTelegramCode: vi.fn(),
        setTelegramSitePassword: vi.fn(),
        fetchMe: vi.fn(),
      };
      return sel ? sel(state) : state;
    }) as typeof useAuthStore);

    const user = userEvent.setup();
    render(
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>
    );

    await user.type(screen.getByLabelText('Телефон'), '+79001234567');
    await user.type(screen.getByLabelText('Пароль'), 'wrongpassword');
    await user.click(screen.getByRole('button', { name: 'Войти' }));

    await waitFor(() => {
      expect(screen.getByText('Неверный телефон или пароль')).toBeInTheDocument();
    });
  });

  it('shows validation error when submitting empty form', async () => {
    const user = userEvent.setup();
    render(
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>
    );

    await user.click(screen.getByRole('button', { name: 'Войти' }));

    await waitFor(() => {
      expect(screen.getByText('Введите телефон и пароль')).toBeInTheDocument();
    });
  });

  it('submit button is disabled while loading', async () => {
    let resolveLogin: (v?: unknown) => void = () => {};
    const mockLogin = vi.fn().mockReturnValueOnce(new Promise((res) => { resolveLogin = res; }));
    vi.mocked(useAuthStore).mockImplementation(((sel?: AuthSelector) => {
      const state = {
        login: mockLogin,
        loginWithTelegramCode: vi.fn(),
        setTelegramSitePassword: vi.fn(),
        fetchMe: vi.fn(),
      };
      return sel ? sel(state) : state;
    }) as typeof useAuthStore);

    const user = userEvent.setup();
    render(
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>
    );

    await user.type(screen.getByLabelText('Телефон'), '+7999');
    await user.type(screen.getByLabelText('Пароль'), 'password123');
    await user.click(screen.getByRole('button', { name: 'Войти' }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Вход/ })).toBeDisabled();
    });

    await act(async () => { resolveLogin(undefined); await Promise.resolve(); });
  });

});
