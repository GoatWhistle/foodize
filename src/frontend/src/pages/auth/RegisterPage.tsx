import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { ROUTES } from '../../constants/routes';
import { FoodizeLogo } from '@shared/components/FoodizeLogo/FoodizeLogo';
import { translateApiError } from '@shared/utils/translateApiError';
import { useShallow } from 'zustand/react/shallow';
import { formatPhoneNumber, extractPhoneNumber } from '@shared/utils/phone';
import { AuthVisual } from './AuthVisual';
import { t, useTranslation } from '@shared/i18n/useTranslation';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_LETTER_RE = /[A-Za-z]/;
const PASSWORD_DIGIT_OR_SYMBOL_RE = /[0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/;
const MIN_PASSWORD_LENGTH = 8;
const MIN_PHONE_DIGITS = 7;

interface RegistrationInput {
  name: string;
  cleanPhone: string;
  email: string;
  password: string;
  agreed: boolean;
}

const validateRegistration = ({ name, cleanPhone, email, password, agreed }: RegistrationInput): string => {
  if (!name.trim()) return t('auth.errors.enterName');
  if (cleanPhone.length < MIN_PHONE_DIGITS) return t('auth.errors.invalidPhone');
  if (email && !EMAIL_RE.test(email)) return t('auth.errors.invalidEmail');
  if (password.length < MIN_PASSWORD_LENGTH) return t('auth.errors.passwordTooShort');
  if (!PASSWORD_LETTER_RE.test(password)) return t('auth.errors.passwordNeedsLetter');
  if (!PASSWORD_DIGIT_OR_SYMBOL_RE.test(password)) return t('auth.errors.passwordNeedsDigit');
  if (!agreed) return t('auth.errors.acceptTos');
  return '';
};

export const RegisterPage = () => {
  const { t: translate } = useTranslation();
  const registerVisualTitle = (
    <>
      {translate('auth.visual.registerTitleLine1')}
      <br />
      {translate('auth.visual.registerTitleLine2')} <em>{translate('auth.visual.registerTitleAccent')}</em>
      <br />
      {translate('auth.visual.registerTitleLine3')}
    </>
  );
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { register, login, isAuthenticated } = useAuthStore(
    useShallow((s) => ({
      register: s.register,
      login: s.login,
      isAuthenticated: s.user !== null,
    }))
  );
  const navigate = useNavigate();
  if (isAuthenticated) return <Navigate to={ROUTES.HOME} replace />;

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    const cleanPhone = extractPhoneNumber(phone);
    const validationError = validateRegistration({ name, cleanPhone, email, password, agreed });
    if (validationError) { setError(validationError); return; }
    setIsLoading(true);
    try {
      await register({
        name,
        phone_number: cleanPhone,
        password,
      });
      await login({ phone_number: cleanPhone, password });
      void navigate(ROUTES.HOME);
    } catch (err) {
      setError(translateApiError(err, translate('auth.errors.registrationFailed')));
      setPassword('');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <AuthVisual title={registerVisualTitle} subtitle={translate('auth.visual.registerSubtitle')} />

      <div className="auth-form-side">
        <div className="auth-card">
          <div className="auth-logo">
            <FoodizeLogo size={30} />
          </div>

          <h1 className="auth-heading">{translate('auth.headings.register')}</h1>
          <p className="auth-subheading">{translate('auth.subheadings.register')}</p>

          {error && (
            <div className="form-error" style={{ marginBottom: 16 }}>
              {error}
            </div>
          )}

          <form
            className="auth-form"
            onSubmit={(e) => {
              void handleSubmit(e);
            }}
            noValidate
          >
            <div className="form-group">
              <label className="form-label" htmlFor="reg-name">
                {translate('auth.placeholders.name')}
              </label>
              <input
                id="reg-name"
                className="form-input"
                type="text"
                placeholder={translate('auth.placeholders.yourName')}
                value={name}
                onChange={(e) => { setName(e.target.value); }}
                required
                autoFocus
                autoComplete="name"
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="reg-phone">
                {translate('auth.fields.phone')}
              </label>
              <input
                id="reg-phone"
                className="form-input"
                type="tel"
                placeholder={translate('auth.placeholders.phone')}
                value={phone}
                onChange={(e) => { setPhone(formatPhoneNumber(e.target.value)); }}
                required
                autoComplete="tel"
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="reg-email">
                {translate('auth.fields.emailOptional')}
              </label>
              <input
                id="reg-email"
                className="form-input"
                type="email"
                placeholder={translate('auth.placeholders.email')}
                value={email}
                onChange={(e) => { setEmail(e.target.value); }}
                autoComplete="email"
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="reg-password">
                {translate('auth.fields.password')}
              </label>
              <input
                id="reg-password"
                className="form-input"
                type="password"
                placeholder={translate('auth.placeholders.passwordHint')}
                value={password}
                onChange={(e) => { setPassword(e.target.value); }}
                required
                minLength={8}
                autoComplete="new-password"
              />
            </div>

            <label className="auth-tos-label">
              <input
                type="checkbox"
                className="auth-tos-checkbox"
                aria-label={translate('auth.tos.checkboxLabel')}
                checked={agreed}
                onChange={(e) => { setAgreed(e.target.checked); }}
              />
              <span>
                {translate('auth.tos.prefix')}{' '}
                <Link to="/legal/terms" target="_blank" rel="noopener noreferrer">
                  {translate('auth.tos.terms')}
                </Link>{' '}
                {translate('auth.tos.and')}{' '}
                <Link to="/legal/privacy" target="_blank" rel="noopener noreferrer">
                  {translate('auth.tos.privacy')}
                </Link>
              </span>
            </label>

            <button
              id="register-submit-btn"
              type="submit"
              className="btn btn-primary btn-full"
              disabled={isLoading || !agreed}
              style={{
                marginTop: 4,
                height: '52px',
                borderRadius: 'var(--r-sm)',
              }}
            >
              {isLoading ? (
                <span
                  style={{ display: 'flex', alignItems: 'center', gap: 10 }}
                >
                  <span className="spinner" style={{ width: 18, height: 18 }} />
                  {translate('auth.buttons.creatingAccount')}
                </span>
              ) : (
                translate('auth.buttons.createAccount')
              )}
            </button>
          </form>

          <div className="auth-footer">
            {translate('auth.footer.haveAccount')} <Link to={ROUTES.LOGIN}>{translate('auth.footer.loginLink')}</Link>
          </div>
        </div>
      </div>
    </div>
  );
};
