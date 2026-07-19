import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { UserEvent } from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { RegisterPage } from '../../pages/auth/RegisterPage';
import { useAuthStore } from '../../store/useAuthStore';

type AuthState = {
  register: (...args: unknown[]) => unknown;
  login: (...args: unknown[]) => unknown;
  user?: { id: string } | null;
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
      const state: AuthState = { register: registerMock, login: loginMock, user: null };
      return sel ? sel(state) : state;
    }) as typeof useAuthStore);
  });

  const renderPage = () =>
    render(<BrowserRouter><RegisterPage /></BrowserRouter>);

  const fillAndSubmit = async (
    user: UserEvent,
    {
      name,
      phone,
      password,
    }: {
      name: string;
      phone: string;
      password: string;
    }
  ) => {
    await user.clear(screen.getByLabelText('Имя'));
    await user.type(screen.getByLabelText('Имя'), name);
    await user.clear(screen.getByLabelText('Телефон'));
    await user.type(screen.getByLabelText('Телефон'), phone);
    await user.clear(screen.getByLabelText('Пароль'));
    await user.type(screen.getByLabelText('Пароль'), password);
    await user.click(screen.getByRole('checkbox'));
    await user.click(screen.getByRole('button', { name: 'Создать аккаунт' }));
  };

  it('renders registration form', () => {
    renderPage();
    expect(screen.getByLabelText('Имя')).toBeInTheDocument();
    expect(screen.getByLabelText('Телефон')).toBeInTheDocument();
    expect(screen.getByLabelText('Пароль')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Создать аккаунт' })).toBeInTheDocument();
  });

  it('submits without user_role field', async () => {
    const user = userEvent.setup();
    registerMock.mockResolvedValueOnce();
    loginMock.mockResolvedValueOnce();
    renderPage();
    await fillAndSubmit(user, { name: 'Test', phone: '79991234567', password: 'password123' });

    await waitFor(() => {
      expect(registerMock).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Test',
          phone_number: '+79991234567',
          password: 'password123',
        })
      );
      const firstCallArgs = registerMock.mock.calls[0];
      if (!firstCallArgs) throw new Error('register was not called');
      expect(firstCallArgs[0]).not.toHaveProperty('user_role');
      expect(firstCallArgs[0]).not.toHaveProperty('email');
    });
  });

  it('registers, logs in and navigates on success', async () => {
    const user = userEvent.setup();
    registerMock.mockResolvedValueOnce();
    loginMock.mockResolvedValueOnce();
    renderPage();
    await fillAndSubmit(user, { name: 'Ivan', phone: '79991234567', password: 'pw123456' });

    await waitFor(() => {
      const phoneMatcher: unknown = expect.stringContaining('79991234567');
      expect(registerMock).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Ivan',
          phone_number: phoneMatcher,
          password: 'pw123456',
        })
      );
      const firstCallArgs = registerMock.mock.calls[0];
      if (!firstCallArgs) throw new Error('register was not called');
      expect(firstCallArgs[0]).not.toHaveProperty('user_role');
      expect(firstCallArgs[0]).not.toHaveProperty('email');
      expect(loginMock).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  it('shows error when registration fails', async () => {
    const user = userEvent.setup();
    registerMock.mockRejectedValueOnce({
      response: { data: { detail: 'User already exists' } },
    });
    renderPage();
    await fillAndSubmit(user, { name: 'Ivan', phone: '79991234567', password: 'pw123456' });

    await waitFor(() => {
      expect(screen.getByText(/ошибка|регистрац|already/i)).toBeInTheDocument();
    });
  });

  it('shows validation error when name is empty', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByRole('checkbox'));
    await user.click(screen.getByRole('button', { name: 'Создать аккаунт' }));

    await waitFor(() => {
      expect(screen.getByText(/введите имя/i)).toBeInTheDocument();
    });
    expect(registerMock).not.toHaveBeenCalled();
  });

  it('shows validation error when password is too short', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.type(screen.getByLabelText('Имя'), 'Ivan');
    await user.type(screen.getByLabelText('Телефон'), '79991234567');
    await user.type(screen.getByLabelText('Пароль'), '123');
    await user.click(screen.getByRole('checkbox'));
    await user.click(screen.getByRole('button', { name: 'Создать аккаунт' }));

    await waitFor(() => {
      expect(screen.getByText(/пароль должен быть/i)).toBeInTheDocument();
    });
    expect(registerMock).not.toHaveBeenCalled();
  });

  it('shows validation error when phone is too short', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.type(screen.getByLabelText('Имя'), 'Ivan');
    await user.type(screen.getByLabelText('Телефон'), '123');
    await user.type(screen.getByLabelText('Пароль'), 'password123');
    await user.click(screen.getByRole('checkbox'));
    await user.click(screen.getByRole('button', { name: 'Создать аккаунт' }));

    await waitFor(() => {
      expect(screen.getByText(/корректный номер телефона/i)).toBeInTheDocument();
    });
    expect(registerMock).not.toHaveBeenCalled();
  });

  it('shows validation error for an invalid email', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.type(screen.getByLabelText('Имя'), 'Ivan');
    await user.type(screen.getByLabelText('Телефон'), '79991234567');
    await user.type(screen.getByLabelText(/Email/), 'not-an-email');
    await user.type(screen.getByLabelText('Пароль'), 'password123');
    await user.click(screen.getByRole('checkbox'));
    await user.click(screen.getByRole('button', { name: 'Создать аккаунт' }));

    await waitFor(() => {
      expect(screen.getByText(/корректный email/i)).toBeInTheDocument();
    });
    expect(registerMock).not.toHaveBeenCalled();
  });

  it('requires a latin letter in the password', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.type(screen.getByLabelText('Имя'), 'Ivan');
    await user.type(screen.getByLabelText('Телефон'), '79991234567');
    await user.type(screen.getByLabelText('Пароль'), '12345678');
    await user.click(screen.getByRole('checkbox'));
    await user.click(screen.getByRole('button', { name: 'Создать аккаунт' }));

    await waitFor(() => {
      expect(screen.getByText(/латинскую букву/i)).toBeInTheDocument();
    });
    expect(registerMock).not.toHaveBeenCalled();
  });

  it('requires a digit or symbol in the password', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.type(screen.getByLabelText('Имя'), 'Ivan');
    await user.type(screen.getByLabelText('Телефон'), '79991234567');
    await user.type(screen.getByLabelText('Пароль'), 'abcdefgh');
    await user.click(screen.getByRole('checkbox'));
    await user.click(screen.getByRole('button', { name: 'Создать аккаунт' }));

    await waitFor(() => {
      expect(screen.getByText(/цифру или спецсимвол/i)).toBeInTheDocument();
    });
    expect(registerMock).not.toHaveBeenCalled();
  });

  it('accepts a valid email and registers', async () => {
    const user = userEvent.setup();
    registerMock.mockResolvedValueOnce();
    loginMock.mockResolvedValueOnce();
    renderPage();
    await user.type(screen.getByLabelText('Имя'), 'Ivan');
    await user.type(screen.getByLabelText('Телефон'), '79991234567');
    await user.type(screen.getByLabelText(/Email/), 'ivan@mail.ru');
    await user.type(screen.getByLabelText('Пароль'), 'password123');
    await user.click(screen.getByRole('checkbox'));
    await user.click(screen.getByRole('button', { name: 'Создать аккаунт' }));

    await waitFor(() => {
      expect(registerMock).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  it('redirects when already authenticated', () => {
    vi.mocked(useAuthStore).mockImplementation(((sel?: (s: AuthState) => unknown) => {
      const state: AuthState = { register: registerMock, login: loginMock, user: { id: 'u1' } };
      return sel ? sel(state) : state;
    }) as typeof useAuthStore);
    renderPage();
    expect(screen.queryByRole('button', { name: 'Создать аккаунт' })).toBeNull();
  });
});
