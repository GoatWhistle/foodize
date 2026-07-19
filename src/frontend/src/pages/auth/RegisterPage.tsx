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

const REGISTER_VISUAL_TITLE = (
  <>
    Начни
    <br />
    своё <em>вкусное</em>
    <br />
    путешествие
  </>
);

const REGISTER_VISUAL_SUBTITLE =
  'Зарегистрируйтесь за 30 секунд и откройте доступ к лучшим заведениям города.';

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
  if (!name.trim()) return 'Введите имя';
  if (cleanPhone.length < MIN_PHONE_DIGITS) return 'Введите корректный номер телефона';
  if (email && !EMAIL_RE.test(email)) return 'Введите корректный email';
  if (password.length < MIN_PASSWORD_LENGTH) return 'Пароль должен быть не менее 8 символов';
  if (!PASSWORD_LETTER_RE.test(password)) return 'Пароль должен содержать хотя бы одну латинскую букву';
  if (!PASSWORD_DIGIT_OR_SYMBOL_RE.test(password)) return 'Пароль должен содержать хотя бы одну цифру или спецсимвол';
  if (!agreed) return 'Примите условия использования и политику конфиденциальности';
  return '';
};

export const RegisterPage = () => {
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
      setError(translateApiError(err, 'Ошибка при регистрации'));
      setPassword('');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <AuthVisual title={REGISTER_VISUAL_TITLE} subtitle={REGISTER_VISUAL_SUBTITLE} />

      <div className="auth-form-side">
        <div className="auth-card">
          <div className="auth-logo">
            <FoodizeLogo size={30} />
          </div>

          <h1 className="auth-heading">Создать аккаунт</h1>
          <p className="auth-subheading">Быстро и без лишних шагов</p>

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
                Имя
              </label>
              <input
                id="reg-name"
                className="form-input"
                type="text"
                placeholder="Ваше имя"
                value={name}
                onChange={(e) => { setName(e.target.value); }}
                required
                autoFocus
                autoComplete="name"
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="reg-phone">
                Телефон
              </label>
              <input
                id="reg-phone"
                className="form-input"
                type="tel"
                placeholder="+7 (999) 000-00-00"
                value={phone}
                onChange={(e) => { setPhone(formatPhoneNumber(e.target.value)); }}
                required
                autoComplete="tel"
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="reg-email">
                Email (необязательно)
              </label>
              <input
                id="reg-email"
                className="form-input"
                type="email"
                placeholder="mail@foodize.ru"
                value={email}
                onChange={(e) => { setEmail(e.target.value); }}
                autoComplete="email"
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="reg-password">
                Пароль
              </label>
              <input
                id="reg-password"
                className="form-input"
                type="password"
                placeholder="Мин. 8 символов, латинская буква и цифра"
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
                aria-label="Принять условия использования и политику конфиденциальности"
                checked={agreed}
                onChange={(e) => { setAgreed(e.target.checked); }}
              />
              <span>
                Я принимаю{' '}
                <Link to="/legal/terms" target="_blank" rel="noopener noreferrer">
                  Условия использования
                </Link>{' '}
                и{' '}
                <Link to="/legal/privacy" target="_blank" rel="noopener noreferrer">
                  Политику конфиденциальности
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
                  Создаём аккаунт...
                </span>
              ) : (
                'Создать аккаунт'
              )}
            </button>
          </form>

          <div className="auth-footer">
            Уже есть аккаунт? <Link to={ROUTES.LOGIN}>Войти</Link>
          </div>
        </div>
      </div>
    </div>
  );
};
