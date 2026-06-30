import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { ROUTES } from '../../constants/routes';
import { translateApiError } from '../../utils/translateApiError';
import { extractPhoneNumber } from '@shared/utils/phone.js';
import { authService } from '../../services/authService';
import { userService } from '../../services/userService';
import { getPasswordStrength } from './forms/SetPasswordForm';
import AuthCard from './AuthCard';
import PasswordLoginForm from './forms/PasswordLoginForm';
import TelegramUsernameForm from './forms/TelegramUsernameForm';
import TelegramCodeForm from './forms/TelegramCodeForm';
import SetPasswordForm from './forms/SetPasswordForm';

const AuthVisual = () => (
  <div className="auth-visual">
    <div className="auth-visual-pattern" />
    <div className="auth-visual-orbs">
      <div className="auth-visual-orb auth-visual-orb--1" />
      <div className="auth-visual-orb auth-visual-orb--2" />
    </div>
    <div className="auth-visual-content">
<div className="auth-visual-title">
        Еда,
        <br />
        которую
        <br />
        вы <em>любите</em>
      </div>
      <p className="auth-visual-sub">
        Лучшие заведения города — в одном месте. Быстро, удобно, вкусно.
      </p>
    </div>
  </div>
);

const LoginPage = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [telegramUsername, setTelegramUsername] = useState('');
  const [telegramCode, setTelegramCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [profileForm, setProfileForm] = useState({ first_name: '', last_name: '' });
  const [authMode, setAuthMode] = useState('password');
  const [error, setError] = useState('');
  const [showBotLink, setShowBotLink] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const login = useAuthStore((s) => s.login);
  const loginWithTelegramCodeByUsername = useAuthStore((s) => s.loginWithTelegramCodeByUsername);
  const setTelegramSitePassword = useAuthStore((s) => s.setTelegramSitePassword);
  const fetchMe = useAuthStore((s) => s.fetchMe);
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from?.pathname || ROUTES.HOME;

  const clearError = () => { setError(''); setShowBotLink(false); };

  const goBack = () => { clearError(); setAuthMode('password'); };

  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    clearError();
    if (!phoneNumber || !password) { setError('Введите телефон и пароль'); return; }
    setIsLoading(true);
    try {
      await login({ phone_number: extractPhoneNumber(phoneNumber), password });
      navigate(redirectTo);
    } catch (err) {
      setError(translateApiError(err, 'Неверный телефон или пароль'));
      setPassword('');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTelegramUsernameSubmit = async (e) => {
    e?.preventDefault();
    clearError();
    setIsLoading(true);
    try {
      const username = telegramUsername.trim();
      await authService.requestTelegramLoginCodeByUsername({ telegram_username: username });
      setAuthMode('telegram-code');
    } catch (err) {
      const detail = err?.response?.data?.detail || '';
      if (detail.includes('не найден') || err?.response?.status === 404) {
        setShowBotLink(true);
        setError('Аккаунт не найден. Запустите бота — он зарегистрирует вас автоматически:');
      } else {
        setError(translateApiError(err, 'Не удалось отправить код'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleTelegramCodeSubmit = async (e) => {
    e.preventDefault();
    clearError();
    setIsLoading(true);
    try {
      const result = await loginWithTelegramCodeByUsername({
        telegram_username: telegramUsername.trim(),
        code: telegramCode,
      });
      if (result.requiresPassword) { setAuthMode('set-password'); return; }
      navigate(redirectTo);
    } catch (err) {
      setError(translateApiError(err, 'Неверный код из Telegram'));
      setTelegramCode('');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordSetup = async (e) => {
    e.preventDefault();
    clearError();
    if (newPassword !== confirmPassword) { setError('Пароли не совпадают'); return; }
    if (getPasswordStrength(newPassword).score < 3) { setError('Пароль слишком слабый'); return; }
    setIsLoading(true);
    try {
      await setTelegramSitePassword(newPassword);
      if (profileForm.first_name || profileForm.last_name) {
        await userService.updateMe(profileForm);
        await fetchMe();
      }
      navigate(redirectTo);
    } catch (err) {
      setError(translateApiError(err, 'Не удалось сохранить пароль'));
      setNewPassword('');
      setConfirmPassword('');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <AuthVisual />
      <div className="auth-form-side">
        <AuthCard
          authMode={authMode}
          telegramUsername={telegramUsername}
          error={error}
          showBotLink={showBotLink}
        >
          {authMode === 'password' && (
            <PasswordLoginForm
              phoneNumber={phoneNumber}
              setPhoneNumber={setPhoneNumber}
              password={password}
              setPassword={setPassword}
              isLoading={isLoading}
              onSubmit={handlePasswordLogin}
              onSwitchToTelegram={() => {
                clearError();
                setTelegramUsername('');
                setTelegramCode('');
                setAuthMode('telegram-username');
              }}
            />
          )}

          {authMode === 'telegram-username' && (
            <TelegramUsernameForm
              telegramUsername={telegramUsername}
              setTelegramUsername={setTelegramUsername}
              isLoading={isLoading}
              onSubmit={handleTelegramUsernameSubmit}
              onBack={goBack}
            />
          )}

          {authMode === 'telegram-code' && (
            <TelegramCodeForm
              telegramCode={telegramCode}
              setTelegramCode={setTelegramCode}
              isLoading={isLoading}
              onSubmit={handleTelegramCodeSubmit}
              onBack={goBack}
              onResend={handleTelegramUsernameSubmit}
            />
          )}

          {authMode === 'set-password' && (
            <SetPasswordForm
              profileForm={profileForm}
              setProfileForm={setProfileForm}
              newPassword={newPassword}
              setNewPassword={setNewPassword}
              confirmPassword={confirmPassword}
              setConfirmPassword={setConfirmPassword}
              isLoading={isLoading}
              onSubmit={handlePasswordSetup}
            />
          )}
        </AuthCard>
      </div>
    </div>
  );
};

export default LoginPage;
