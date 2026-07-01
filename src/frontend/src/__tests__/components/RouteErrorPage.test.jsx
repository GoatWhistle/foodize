import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

const mockNavigate = vi.fn();
let mockError = null;

vi.mock('react-router-dom', () => ({
  useRouteError: () => mockError,
  useNavigate: () => mockNavigate,
}));

const { default: RouteErrorPage } = await import('../../components/ui/RouteErrorPage');

const render$ = () => render(<RouteErrorPage />);

describe('RouteErrorPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockError = null;
  });

  it('shows "Что-то пошло не так" for generic error', () => {
    mockError = { message: 'Internal Server Error' };
    render$();
    expect(screen.getByText('Что-то пошло не так')).toBeInTheDocument();
  });

  it('shows "Страница не найдена" for 404', () => {
    mockError = { status: 404, statusText: 'Not Found' };
    render$();
    expect(screen.getByText('Страница не найдена')).toBeInTheDocument();
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
    expect(screen.getByText('Неизвестная ошибка')).toBeInTheDocument();
  });

  it('displays "Неизвестная ошибка" when error is null', () => {
    mockError = null;
    render$();
    expect(screen.getByText('Неизвестная ошибка')).toBeInTheDocument();
  });

  it('renders "На главную" button', () => {
    render$();
    expect(screen.getByRole('button', { name: 'На главную' })).toBeInTheDocument();
  });

  it('navigates to "/" when button clicked', () => {
    render$();
    fireEvent.click(screen.getByRole('button', { name: 'На главную' }));
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });
});
