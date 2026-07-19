import type { FormEvent } from 'react';
import { TelegramLogo } from '@shared/components/BrandIcons/TelegramLogo';
import { formatPhoneNumber } from '@shared/utils/phone';

interface PasswordLoginFormProps {
  phoneNumber: string;
  setPhoneNumber: (value: string) => void;
  password: string;
  setPassword: (value: string) => void;
  isLoading: boolean;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
  onSwitchToTelegram: () => void;
}

export const PasswordLoginForm = ({
  phoneNumber,
  setPhoneNumber,
  password,
  setPassword,
  isLoading,
  onSubmit,
  onSwitchToTelegram,
}: PasswordLoginFormProps) => (
  <form className="auth-form" onSubmit={onSubmit} noValidate>
    <div className="form-group">
      <label className="form-label" htmlFor="login-phone">
        Телефон
      </label>
      <input
        id="login-phone"
        className="form-input"
        type="tel"
        placeholder="+7 (999) 000-00-00"
        value={phoneNumber}
        onChange={(e) => { setPhoneNumber(formatPhoneNumber(e.target.value)); }}
        required
        autoComplete="tel"
        autoFocus
      />
    </div>

    <div className="form-group">
      <label className="form-label" htmlFor="login-password">
        Пароль
      </label>
      <input
        id="login-password"
        className="form-input"
        type="password"
        placeholder="Минимум 8 символов"
        value={password}
        onChange={(e) => { setPassword(e.target.value); }}
        required
        minLength={8}
        autoComplete="current-password"
      />
    </div>

    <button
      id="login-submit-btn"
      type="submit"
      className="btn btn-primary btn-full"
      disabled={isLoading}
      style={{ marginTop: 4, height: '52px', borderRadius: 'var(--r-sm)' }}
    >
      {isLoading ? (
        <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="spinner" style={{ width: 18, height: 18 }} />
          Вход...
        </span>
      ) : (
        'Войти'
      )}
    </button>

    <div className="auth-divider">или</div>

    <button
      type="button"
      className="auth-tg-btn"
      disabled={isLoading}
      onClick={onSwitchToTelegram}
    >
      <TelegramLogo size={20} variant="mono" />
      Войти через Telegram
    </button>
  </form>
);
