import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { TelegramLogo } from '@shared/components/BrandIcons/TelegramLogo';
import { FoodizeLogo } from '@shared/components/FoodizeLogo/FoodizeLogo';
import { ROUTES } from '../../constants/routes';
import { TELEGRAM_BOT_USERNAME } from '../../config';
import { useTranslation } from '@shared/i18n/useTranslation';
import type { AuthMode } from './types';

const HEADING_KEYS: Partial<Record<AuthMode, string>> = {
  password: 'auth.headings.password',
  'telegram-username': 'auth.headings.telegramUsername',
  'telegram-code': 'auth.headings.telegramCode',
  'set-password': 'auth.headings.setPassword',
};

const SUBHEADING_KEYS: Partial<Record<AuthMode, string>> = {
  password: 'auth.subheadings.password',
  'telegram-username': 'auth.subheadings.telegramUsername',
  'set-password': 'auth.subheadings.setPassword',
};

interface AuthCardProps {
  authMode: AuthMode;
  telegramUsername: string;
  error: string;
  showBotLink: boolean;
  children: ReactNode;
}

export const AuthCard = ({ authMode, telegramUsername, error, showBotLink, children }: AuthCardProps) => {
  const { t } = useTranslation();
  const isTelegram = authMode === 'telegram-username' || authMode === 'telegram-code';

  return (
    <div className="auth-card">
      <div className="auth-logo">
        <FoodizeLogo size={30} />
      </div>

      <h1 className="auth-heading" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {isTelegram && (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: 'var(--brand-telegram)',
              color: 'var(--color-white)',
              flexShrink: 0,
            }}
          >
            <TelegramLogo size={20} variant="mono" />
          </span>
        )}
        {t(HEADING_KEYS[authMode] ?? 'auth.headings.password')}
      </h1>

      <p className="auth-subheading">
        {authMode === 'telegram-code'
          ? (
            <>
              {t('auth.codeSentTo')}{' '}
              <strong style={{ color: 'var(--text-2)' }}>@{telegramUsername}</strong>
            </>
          )
          : t(SUBHEADING_KEYS[authMode] ?? 'auth.subheadings.password')}
      </p>

      {error && (
        <div className="form-error" style={{ marginBottom: 20 }}>
          {error}
          {showBotLink && (
            <a
              href={`https://t.me/${TELEGRAM_BOT_USERNAME}?start=register`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginTop: 10,
                padding: '10px 14px',
                background: 'var(--brand-telegram-strong)',
                color: 'var(--color-white)',
                borderRadius: 'var(--r-sm)',
                fontWeight: 600,
                fontSize: "var(--text-base)",
                textDecoration: 'none',
              }}
            >
              <TelegramLogo size={18} variant="mono" />
              {t('auth.openBot', { botUsername: String(TELEGRAM_BOT_USERNAME) })}
            </a>
          )}
        </div>
      )}

      {children}

      <div className="auth-footer">
        {t('auth.footer.noAccount')} <Link to={ROUTES.REGISTER}>{t('auth.footer.registerLink')}</Link>
      </div>
    </div>
  );
};
