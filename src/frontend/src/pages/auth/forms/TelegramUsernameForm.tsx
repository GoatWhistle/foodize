import { useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { t, useTranslation } from '@shared/i18n/useTranslation';

const TG_USERNAME_RE = /^[a-zA-Z0-9_]{5,32}$/;

const validateUsername = (value: string): string | null => {
  if (!value) return null;
  if (value.length < 5) return t('auth.usernameHints.minLength');
  if (value.length > 32) return t('auth.usernameHints.maxLength');
  if (!/^[a-zA-Z0-9_]+$/.test(value)) return t('auth.usernameHints.allowedChars');
  if (value.startsWith('_') || value.endsWith('_')) return t('auth.usernameHints.underscoreEdges');
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
  const { t: translate } = useTranslation();
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
          {translate('auth.fields.telegramUsername')}
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
            placeholder={translate('auth.placeholders.username')}
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
            {translate('auth.usernameHints.format')}
          </div>
        ) : null}
      </div>

      <button
        type="submit"
        className="btn btn-primary btn-full"
        disabled={isLoading || !isValid}
        style={{ height: '52px', borderRadius: 'var(--r-sm)' }}
      >
        {isLoading ? translate('auth.buttons.sending') : translate('auth.buttons.getCode')}
      </button>

      <button
        type="button"
        className="btn btn-ghost btn-full"
        disabled={isLoading}
        onClick={onBack}
      >
        {translate('common.actions.back')}
      </button>
    </form>
  );
};
