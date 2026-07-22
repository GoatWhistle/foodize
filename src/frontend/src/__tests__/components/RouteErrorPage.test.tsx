import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { t } from '@shared/i18n/useTranslation';

const mockNavigate = vi.fn();
let mockError: { message?: string; status?: number; statusText?: string } | null = null;

vi.mock('react-router-dom', () => ({
  useRouteError: () => mockError,
  useNavigate: () => mockNavigate,
}));

const { RouteErrorPage } = await import('../../components/RouteErrorPage/RouteErrorPage');

const render$ = () => render(<RouteErrorPage />);

describe('RouteErrorPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockError = null;
  });

  it('shows "Что-то пошло не так" for generic error', () => {
    mockError = { message: 'Internal Server Error' };
    render$();
    expect(screen.getByText(t('common.errors.somethingWentWrong'))).toBeInTheDocument();
  });

  it('shows "Страница не найдена" for 404', () => {
    mockError = { status: 404, statusText: 'Not Found' };
    render$();
    expect(screen.getByText(t('common.errors.pageNotFound'))).toBeInTheDocument();
  });

  it('displays statusText as message', () => {
    mockError = { status: 500, statusText: 'Server Error' };
    render$();
    expect(screen.getByText('Server Error')).toBeInTheDocument();
  });

  it('displays error message when no statusText', () => {
    mockError = { message: 'Network timeout' };
    render$();
    expect(screen.getByText('Network timeout')).toBeInTheDocument();
  });

  it('displays "Неизвестная ошибка" when error has no message or statusText', () => {
    mockError = {};
    render$();
    expect(screen.getByText(t('common.errors.unknown'))).toBeInTheDocument();
  });

  it('displays "Неизвестная ошибка" when error is null', () => {
    mockError = null;
    render$();
    expect(screen.getByText(t('common.errors.unknown'))).toBeInTheDocument();
  });

  it('renders "На главную" button', () => {
    render$();
    expect(screen.getByRole('button', { name: t('common.actions.goHome') })).toBeInTheDocument();
  });

  it('navigates to "/" when button clicked', async () => {
    const user = userEvent.setup();
    render$();
    await user.click(screen.getByRole('button', { name: t('common.actions.goHome') }));
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });
});
