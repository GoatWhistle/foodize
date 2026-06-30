import { Link } from 'react-router-dom';
import { TelegramLogo } from '@phosphor-icons/react';
import FoodizeLogo from '../../components/ui/FoodizeLogo';
import { ROUTES } from '../../constants/routes';
import { TELEGRAM_BOT_USERNAME } from '../../config';

const HEADINGS = {
  password: 'С возвращением',
  'telegram-username': 'Вход через Telegram',
  'telegram-code': 'Введите код',
  'set-password': 'Придумайте пароль',
};

const SUBHEADINGS = {
  password: 'Войдите, чтобы сделать заказ',
  'telegram-username': 'Введите @username — бот пришлёт одноразовый код',
  'set-password': 'Пароль нужен для входа через сайт. Имя можно поправить сразу.',
};

const AuthCard = ({ authMode, telegramUsername, error, showBotLink, children }) => {
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
              background: '#229ED9',
              color: '#fff',
              flexShrink: 0,
            }}
          >
            <TelegramLogo size={20} weight="fill" />
          </span>
        )}
        {HEADINGS[authMode] ?? 'С возвращением'}
      </h1>

      <p className="auth-subheading">
        {authMode === 'telegram-code'
          ? (
            <>
              Код отправлен в{' '}
              <strong style={{ color: 'var(--text-2)' }}>@{telegramUsername}</strong>
            </>
          )
          : SUBHEADINGS[authMode] ?? 'Войдите, чтобы сделать заказ'}
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
                background: '#229ED9',
                color: '#fff',
                borderRadius: 'var(--r-sm)',
                fontWeight: 600,
                fontSize: '0.9rem',
                textDecoration: 'none',
              }}
            >
              <TelegramLogo size={18} weight="fill" />
              Открыть @{TELEGRAM_BOT_USERNAME}
            </a>
          )}
        </div>
      )}

      {children}

      <div className="auth-footer">
        Нет аккаунта? <Link to={ROUTES.REGISTER}>Зарегистрироваться</Link>
      </div>
    </div>
  );
};

export default AuthCard;
