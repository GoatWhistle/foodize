import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { useTranslation } from '@shared/i18n/useTranslation';

const RESEND_COOLDOWN = 60;

interface TelegramCodeFormProps {
  telegramCode: string;
  setTelegramCode: (value: string) => void;
  isLoading: boolean;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
  onBack: () => void;
  onResend: () => void | Promise<void>;
}

export const TelegramCodeForm = ({
  telegramCode,
  setTelegramCode,
  isLoading,
  onSubmit,
  onBack,
  onResend,
}: TelegramCodeFormProps) => {
  const { t } = useTranslation();
  const [secondsLeft, setSecondsLeft] = useState(RESEND_COOLDOWN);

  useEffect(() => {
    setSecondsLeft(RESEND_COOLDOWN);
  }, []);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setTimeout(() => { setSecondsLeft((s) => s - 1); }, 1000);
    return () => { clearTimeout(timer); };
  }, [secondsLeft]);

  const handleResend = async () => {
    await onResend();
    setSecondsLeft(RESEND_COOLDOWN);
  };

  return (
    <form className="auth-form" onSubmit={onSubmit} noValidate>
      <div className="form-group">
        <label className="form-label" htmlFor="telegram-code">
          {t('auth.fields.telegramCode')}
        </label>
        <input
          id="telegram-code"
          className="form-input"
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          placeholder={t('auth.placeholders.code')}
          value={telegramCode}
          onChange={(e) => { setTelegramCode(e.target.value.replace(/\D/g, '').slice(0, 6)); }}
          required
          autoFocus
        />
      </div>

      <button
        type="submit"
        className="btn btn-primary btn-full"
        disabled={isLoading || telegramCode.length < 4}
        style={{ height: '52px', borderRadius: 'var(--r-sm)' }}
      >
        {isLoading ? t('auth.buttons.checking') : t('auth.buttons.confirmCode')}
      </button>

      <button
        type="button"
        className="btn btn-ghost btn-full"
        disabled={isLoading || secondsLeft > 0}
        onClick={() => {
          void handleResend();
        }}
        style={{ position: 'relative' }}
      >
        {secondsLeft > 0 ? (
          <>
            {t('auth.buttons.resend')}
            <span
              style={{
                marginLeft: 8,
                fontSize: '0.85em',
                color: 'var(--text-2)',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {t('auth.resendIn', { seconds: secondsLeft })}
            </span>
          </>
        ) : (
          t('auth.buttons.resend')
        )}
      </button>

      <button
        type="button"
        className="btn btn-ghost btn-full"
        disabled={isLoading}
        onClick={onBack}
      >
        {t('common.actions.back')}
      </button>
    </form>
  );
};
