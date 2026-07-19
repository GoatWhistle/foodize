import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { AuthCard } from '../../../pages/auth/AuthCard';
import type { AuthMode } from '../../../pages/auth/types';

const renderCard = (props: {
  authMode: AuthMode;
  telegramUsername?: string;
  error?: string;
  showBotLink?: boolean;
}) =>
  render(
    <MemoryRouter>
      <AuthCard
        authMode={props.authMode}
        telegramUsername={props.telegramUsername ?? ''}
        error={props.error ?? ''}
        showBotLink={props.showBotLink ?? false}
      >
        <div>child-content</div>
      </AuthCard>
    </MemoryRouter>,
  );

describe('AuthCard', () => {
  it('renders password heading and subheading', () => {
    renderCard({ authMode: 'password' });
    expect(screen.getByRole('heading', { name: 'С возвращением' })).toBeInTheDocument();
    expect(screen.getByText('Войдите, чтобы сделать заказ')).toBeInTheDocument();
    expect(screen.getByText('child-content')).toBeInTheDocument();
  });

  it('renders telegram-username heading with subheading', () => {
    renderCard({ authMode: 'telegram-username' });
    expect(screen.getByRole('heading', { name: /Вход через Telegram/ })).toBeInTheDocument();
    expect(screen.getByText('Введите @username — бот пришлёт одноразовый код')).toBeInTheDocument();
  });

  it('renders code subheading with the telegram username', () => {
    renderCard({ authMode: 'telegram-code', telegramUsername: 'ivan' });
    expect(screen.getByRole('heading', { name: /Введите код/ })).toBeInTheDocument();
    expect(screen.getByText('@ivan')).toBeInTheDocument();
  });

  it('renders set-password heading and its subheading', () => {
    renderCard({ authMode: 'set-password' });
    expect(screen.getByRole('heading', { name: 'Придумайте пароль' })).toBeInTheDocument();
    expect(
      screen.getByText('Пароль нужен для входа через сайт. Имя можно поправить сразу.'),
    ).toBeInTheDocument();
  });

  it('shows error text without bot link when showBotLink is false', () => {
    renderCard({ authMode: 'password', error: 'Something went wrong' });
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Открыть/ })).not.toBeInTheDocument();
  });

  it('shows bot link when showBotLink is true', () => {
    renderCard({ authMode: 'telegram-username', error: 'Not found', showBotLink: true });
    const link = screen.getByRole('link', { name: /Открыть/ });
    expect(link).toHaveAttribute('href', expect.stringContaining('t.me/'));
  });

  it('falls back to default heading and subheading for unknown mode', () => {
    renderCard({ authMode: 'unknown-mode' as AuthMode });
    expect(screen.getByRole('heading', { name: 'С возвращением' })).toBeInTheDocument();
    expect(screen.getByText('Войдите, чтобы сделать заказ')).toBeInTheDocument();
  });

  it('renders register footer link', () => {
    renderCard({ authMode: 'password' });
    expect(screen.getByRole('link', { name: 'Зарегистрироваться' })).toHaveAttribute('href', '/register');
  });
});
