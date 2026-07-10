import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import MainLayout from '../../components/layout/MainLayout';
import { useAuthStore } from '../../store/useAuthStore';

type AuthState = { isAuthenticated: boolean };
type ThemeState = { theme: string };

vi.mock('../../store/useAuthStore', () => ({
  useAuthStore: vi.fn((sel?: (s: AuthState) => unknown) => {
    const state: AuthState = { isAuthenticated: true };
    return sel ? sel(state) : state;
  }),
}));

vi.mock('@shared/store/useThemeStore.js', () => ({
  useThemeStore: vi.fn((sel?: (s: ThemeState) => unknown) => {
    const state: ThemeState = { theme: 'light' };
    return sel ? sel(state) : state;
  }),
}));

describe('MainLayout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders authenticated header actions', () => {
    render(
      <BrowserRouter>
        <MainLayout />
      </BrowserRouter>
    );

    expect(screen.getByLabelText('На главную')).toBeDefined();
    expect(screen.getByLabelText('Профиль')).toBeDefined();
    expect(screen.getByLabelText('Уведомления')).toBeDefined();
  });

  it('shows login button when not authenticated', () => {
    vi.mocked(useAuthStore).mockImplementation(((sel?: (s: AuthState) => unknown) => {
      const state: AuthState = { isAuthenticated: false };
      return sel ? sel(state) : state;
    }) as typeof useAuthStore);

    render(
      <BrowserRouter>
        <MainLayout />
      </BrowserRouter>
    );

    expect(screen.getByText('Войти')).toBeDefined();
    expect(screen.queryByLabelText('Профиль')).toBeNull();
  });
});
