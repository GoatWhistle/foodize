import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import RegisterPage from '../../pages/auth/RegisterPage';
import { useAuthStore } from '../../store/useAuthStore';

type AuthState = {
  register: (...args: unknown[]) => unknown;
  login: (...args: unknown[]) => unknown;
  isAuthenticated?: boolean;
};

vi.mock('../../store/useAuthStore', () => ({
  useAuthStore: vi.fn((sel?: (s: AuthState) => unknown) => {
    const state: AuthState = { register: vi.fn(), login: vi.fn() };
    return sel ? sel(state) : state;
  }),
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

describe('RegisterPage', () => {
  const registerMock = vi.fn<(...args: unknown[]) => Promise<void>>();
  const loginMock = vi.fn<(...args: unknown[]) => Promise<void>>();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuthStore).mockImplementation(((sel?: (s: AuthState) => unknown) => {
      const state: AuthState = { register: registerMock, login: loginMock, isAuthenticated: false };
      return sel ? sel(state) : state;
    }) as typeof useAuthStore);
  });

  const renderPage = () =>
    render(<BrowserRouter><RegisterPage /></BrowserRouter>);

  const fillAndSubmit = ({
    name,
    phone,
    password,
  }: {
    name: string;
    phone: string;
    password: string;
  }) => {
    fireEvent.change(screen.getByLabelText('Имя'), { target: { value: name } });
    fireEvent.change(screen.getByLabelText('Телефон'), { target: { value: phone } });
    fireEvent.change(screen.getByLabelText('Пароль'), { target: { value: password } });
    const checkbox = document.querySelector('input[type="checkbox"]');
    if (checkbox) fireEvent.click(checkbox);
    fireEvent.click(screen.getByRole('button', { name: 'Создать аккаунт' }));
  };

  it('renders registration form', () => {
    renderPage();
    expect(screen.getByLabelText('Имя')).toBeDefined();
    expect(screen.getByLabelText('Телефон')).toBeDefined();
    expect(screen.getByLabelText('Пароль')).toBeDefined();
    expect(screen.getByRole('button', { name: 'Создать аккаунт' })).toBeDefined();
  });

  it('submits without user_role field', async () => {
    registerMock.mockResolvedValueOnce();
    loginMock.mockResolvedValueOnce();
    renderPage();
    fillAndSubmit({ name: 'Test', phone: '79991234567', password: 'password123' });

    await waitFor(() => {
      expect(registerMock).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Test',
          phone_number: '+79991234567',
          password: 'password123',
          email: null,
        })
      );
      expect(registerMock.mock.calls[0][0]).not.toHaveProperty('user_role');
    });
  });

  it('registers, logs in and navigates on success', async () => {
    registerMock.mockResolvedValueOnce();
    loginMock.mockResolvedValueOnce();
    renderPage();
    fillAndSubmit({ name: 'Ivan', phone: '79991234567', password: 'pw123456' });

    await waitFor(() => {
      expect(registerMock).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Ivan',
          phone_number: expect.stringContaining('79991234567'),
          password: 'pw123456',
          email: null,
        })
      );
      expect(registerMock.mock.calls[0][0]).not.toHaveProperty('user_role');
      expect(loginMock).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  it('shows error when registration fails', async () => {
    registerMock.mockRejectedValueOnce({
      response: { data: { detail: 'User already exists' } },
    });
    renderPage();
    fillAndSubmit({ name: 'Ivan', phone: '79991234567', password: 'pw123456' });

    await waitFor(() => {
      expect(screen.getByText(/ошибка|регистрац|already/i)).toBeDefined();
    });
  });

  it('shows validation error when name is empty', async () => {
    renderPage();
    const checkbox = document.querySelector('input[type="checkbox"]');
    if (checkbox) fireEvent.click(checkbox);
    fireEvent.click(screen.getByRole('button', { name: 'Создать аккаунт' }));

    await waitFor(() => {
      expect(screen.getByText(/введите имя/i)).toBeDefined();
    });
    expect(registerMock).not.toHaveBeenCalled();
  });

  it('shows validation error when password is too short', async () => {
    renderPage();
    fireEvent.change(screen.getByLabelText('Имя'), { target: { value: 'Ivan' } });
    fireEvent.change(screen.getByLabelText('Телефон'), { target: { value: '79991234567' } });
    fireEvent.change(screen.getByLabelText('Пароль'), { target: { value: '123' } });
    const checkbox = document.querySelector('input[type="checkbox"]');
    if (checkbox) fireEvent.click(checkbox);
    fireEvent.click(screen.getByRole('button', { name: 'Создать аккаунт' }));

    await waitFor(() => {
      expect(screen.getByText(/пароль должен быть/i)).toBeDefined();
    });
    expect(registerMock).not.toHaveBeenCalled();
  });

  it('redirects when already authenticated', () => {
    vi.mocked(useAuthStore).mockImplementation(((sel?: (s: AuthState) => unknown) => {
      const state: AuthState = { register: registerMock, login: loginMock, isAuthenticated: true };
      return sel ? sel(state) : state;
    }) as typeof useAuthStore);
    renderPage();
    expect(screen.queryByRole('button', { name: 'Создать аккаунт' })).toBeNull();
  });
});
