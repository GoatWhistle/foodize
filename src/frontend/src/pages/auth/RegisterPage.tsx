import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { ROUTES } from '../../constants/routes';
import FoodizeLogo from '@shared/components/FoodizeLogo/FoodizeLogo';
import { translateApiError } from '@shared/utils/translateApiError';
import { useShallow } from 'zustand/react/shallow';
import { formatPhoneNumber, extractPhoneNumber } from '@shared/utils/phone';

const AuthVisual = () => (
  <div className="auth-visual">
    <div className="auth-visual-pattern" />
    <div className="auth-visual-orbs">
      <div className="auth-visual-orb auth-visual-orb--1" />
      <div className="auth-visual-orb auth-visual-orb--2" />
    </div>
    <div className="auth-visual-content">
      <span className="auth-visual-eyebrow">Предзаказ · Самовывоз</span>
      <div className="auth-visual-title">
        Начни
        <br />
        своё <em>вкусное</em>
        <br />
        путешествие
      </div>
      <p className="auth-visual-sub">
        Зарегистрируйтесь за 30 секунд и откройте доступ к лучшим заведениям
        города.
      </p>
    </div>
  </div>
);

const RegisterPage = () => {
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
      isAuthenticated: s.isAuthenticated,
    }))
  );
  const navigate = useNavigate();
  if (isAuthenticated) return <Navigate to={ROUTES.HOME} replace />;

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    if (!name.trim()) { setError('Введите имя'); return; }
    const cleanPhone = extractPhoneNumber(phone);
    if (cleanPhone.length < 7) { setError('Введите корректный номер телефона'); return; }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError('Введите корректный email'); return; }
    if (password.length < 8) { setError('Пароль должен быть не менее 8 символов'); return; }
    if (!/[A-Za-z]/.test(password)) { setError('Пароль должен содержать хотя бы одну латинскую букву'); return; }
    if (!/[0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) { setError('Пароль должен содержать хотя бы одну цифру или спецсимвол'); return; }
    if (!agreed) { setError('Примите условия использования и политику конфиденциальности'); return; }
    setIsLoading(true);
    try {
      await register({
        name,
        phone_number: cleanPhone,
        email: email || null,
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
      <AuthVisual />

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
                onChange={(e) => setName(e.target.value)}
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
                onChange={(e) => setPhone(formatPhoneNumber(e.target.value))}
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
                onChange={(e) => setEmail(e.target.value)}
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
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
              />
            </div>

            <label className="auth-tos-label">
              <input
                type="checkbox"
                className="auth-tos-checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
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

export default RegisterPage;
