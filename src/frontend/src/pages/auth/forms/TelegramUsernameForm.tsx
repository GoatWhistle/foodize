import { useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';

const TG_USERNAME_RE = /^[a-zA-Z0-9_]{5,32}$/;

const validateUsername = (value: string): string | null => {
  if (!value) return null;
  if (value.length < 5) return 'Минимум 5 символов';
  if (value.length > 32) return 'Максимум 32 символа';
  if (!/^[a-zA-Z0-9_]+$/.test(value)) return 'Только a–z, 0–9 и _';
  if (value.startsWith('_') || value.endsWith('_')) return 'Не может начинаться или заканчиваться на _';
  return null;
};

interface TelegramUsernameFormProps {
  telegramUsername: string;
  setTelegramUsername: (value: string) => void;
  isLoading: boolean;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
  onBack: () => void;
}

export const TelegramUsernameForm = ({
  telegramUsername,
  setTelegramUsername,
  isLoading,
  onSubmit,
  onBack,
}: TelegramUsernameFormProps) => {
  const [touched, setTouched] = useState(false);

  const validationError = validateUsername(telegramUsername);
  const isValid = TG_USERNAME_RE.test(telegramUsername) && !telegramUsername.startsWith('_') && !telegramUsername.endsWith('_');
  const showError = touched && validationError;

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/@/g, '').replace(/[^a-zA-Z0-9_]/g, '');
    setTelegramUsername(raw);
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setTouched(true);
    if (!isValid) return;
    onSubmit(e);
  };

  return (
    <form className="auth-form" onSubmit={handleSubmit} noValidate>
      <div className="form-group">
        <label className="form-label" htmlFor="telegram-login-username">
          Telegram @username
        </label>
        <div style={{ position: 'relative' }}>
          <span
            style={{
              position: 'absolute',
              left: 14,
              top: '50%',
              transform: 'translateY(-50%)',
              color: showError ? 'var(--color-error)' : 'var(--text-2)',
              fontWeight: 500,
              pointerEvents: 'none',
              userSelect: 'none',
              transition: 'color 0.15s',
            }}
          >
            @
          </span>
          <input
            id="telegram-login-username"
            className="form-input"
            type="text"
            placeholder="username"
            value={telegramUsername}
            onChange={handleChange}
            onBlur={() => { setTouched(true); }}
            required
            autoComplete="off"
            autoFocus
            style={{
              paddingLeft: 28,
              borderColor: showError ? 'var(--color-error)' : undefined,
              transition: 'border-color 0.15s',
            }}
          />
        </div>

        {showError ? (
          <div style={{ marginTop: 6, fontSize: "var(--text-base)", color: 'var(--color-error)' }}>
            {validationError}
          </div>
        ) : telegramUsername && !isValid ? (
          <div style={{ marginTop: 6, fontSize: "var(--text-base)", color: 'var(--text-2)' }}>
            a–z, 0–9 и _ · минимум 5 символов
          </div>
        ) : null}
      </div>

      <button
        type="submit"
        className="btn btn-primary btn-full"
        disabled={isLoading || !isValid}
        style={{ height: '52px', borderRadius: 'var(--r-sm)' }}
      >
        {isLoading ? 'Отправляем...' : 'Получить код в Telegram'}
      </button>

      <button
        type="button"
        className="btn btn-ghost btn-full"
        disabled={isLoading}
        onClick={onBack}
      >
        Назад
      </button>
    </form>
  );
};
