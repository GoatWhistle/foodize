import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { MainLayout } from '../../components/layout/MainLayout';
import { useAuthStore } from '../../store/useAuthStore';
import { t } from '@shared/i18n/useTranslation';

type AuthState = { user: { id: string } | null };
type ThemeState = { theme: string };

vi.mock('../../store/useAuthStore', () => ({
  useAuthStore: vi.fn((sel?: (s: AuthState) => unknown) => {
    const state: AuthState = { user: { id: 'user-1' } };
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

    expect(screen.getByLabelText(t('profile.nav.home'))).toBeInTheDocument();
    expect(screen.getByLabelText(t('profile.nav.profile'))).toBeInTheDocument();
    expect(screen.getByLabelText(t('profile.notifications.title'))).toBeInTheDocument();
  });

  it('shows login button when not authenticated', () => {
    vi.mocked(useAuthStore).mockImplementation(((sel?: (s: AuthState) => unknown) => {
      const state: AuthState = { user: null };
      return sel ? sel(state) : state;
    }) as typeof useAuthStore);

    render(
      <BrowserRouter>
        <MainLayout />
      </BrowserRouter>
    );

    expect(screen.getByText(t('profile.nav.login'))).toBeInTheDocument();
    expect(screen.queryByLabelText(t('profile.nav.profile'))).toBeNull();
  });
});
