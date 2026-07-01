import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import LoginPage from '../../pages/auth/LoginPage';
import { useAuthStore } from '../../store/useAuthStore';

vi.mock('../../store/useAuthStore', () => ({
  useAuthStore: vi.fn((selector) => {
    const state = {
      login: vi.fn(),
      loginWithTelegramCode: vi.fn(),
      setTelegramSitePassword: vi.fn(),
      fetchMe: vi.fn(),
      isAuthenticated: false,
      error: null,
    };
    return selector ? selector(state) : state;
  }),
}));

vi.mock('../../services/authService', () => ({
  authService: {
    requestTelegramLoginCode: vi.fn(),
  },
}));

vi.mock('../../services/userService', () => ({
  userService: {
    updateMe: vi.fn(),
  },
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
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

    expect(screen.getByLabelText('Телефон')).toBeDefined();
    expect(screen.getByLabelText('Пароль')).toBeDefined();
    expect(screen.getByRole('button', { name: 'Войти' })).toBeDefined();
  });

  it('calls login and navigates on successful submit', async () => {
    const mockLogin = vi.fn().mockResolvedValueOnce();
    vi.mocked(useAuthStore).mockImplementation((sel) => {
      const state = { login: mockLogin, isAuthenticated: false };
      return sel ? sel(state) : state;
    });

    render(
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>
    );

    fireEvent.change(screen.getByLabelText('Телефон'), {
      target: { value: '+7123' },
    });
    fireEvent.change(screen.getByLabelText('Пароль'), {
      target: { value: 'password123' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Войти' }));

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
    vi.mocked(useAuthStore).mockImplementation((sel) => {
      const state = {
        login: mockLogin,
        loginWithTelegramCode: vi.fn(),
        setTelegramSitePassword: vi.fn(),
        fetchMe: vi.fn(),
        isAuthenticated: false,
      };
      return sel ? sel(state) : state;
    });

    render(
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>
    );

    fireEvent.change(screen.getByLabelText('Телефон'), { target: { value: '+79001234567' } });
    fireEvent.change(screen.getByLabelText('Пароль'), { target: { value: 'wrongpassword' } });
    fireEvent.click(screen.getByRole('button', { name: 'Войти' }));

    await waitFor(() => {
      expect(screen.getByText('Неверный телефон или пароль')).toBeDefined();
    });
  });

  it('shows validation error when submitting empty form', async () => {
    render(
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Войти' }));

    await waitFor(() => {
      expect(screen.getByText('Введите телефон и пароль')).toBeDefined();
    });
  });

  it('submit button is disabled while loading', async () => {
    let resolveLogin;
    const mockLogin = vi.fn().mockReturnValueOnce(new Promise((res) => { resolveLogin = res; }));
    vi.mocked(useAuthStore).mockImplementation((sel) => {
      const state = {
        login: mockLogin,
        loginWithTelegramCode: vi.fn(),
        setTelegramSitePassword: vi.fn(),
        fetchMe: vi.fn(),
        isAuthenticated: false,
      };
      return sel ? sel(state) : state;
    });

    render(
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>
    );

    fireEvent.change(screen.getByLabelText('Телефон'), { target: { value: '+7999' } });
    fireEvent.change(screen.getByLabelText('Пароль'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Войти' }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Вход/ })).toBeDisabled();
    });

    await act(async () => { resolveLogin(); });
  });

});
