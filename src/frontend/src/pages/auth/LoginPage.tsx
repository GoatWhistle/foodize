import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import type { AuthMode, ProfileForm } from './types';
import { ROUTES } from '../../constants/routes';
import { translateApiError } from '@shared/utils/translateApiError';
import { extractPhoneNumber } from '@shared/utils/phone';
import { authService } from '@shared/services/authService';
import { userService } from '@shared/services/userService';
import { getPasswordStrength } from './forms/SetPasswordForm';
import { AuthCard } from './AuthCard';
import { PasswordLoginForm } from './forms/PasswordLoginForm';
import { TelegramUsernameForm } from './forms/TelegramUsernameForm';
import { TelegramCodeForm } from './forms/TelegramCodeForm';
import { SetPasswordForm } from './forms/SetPasswordForm';
import { AuthVisual } from './AuthVisual';
import { useTranslation } from '@shared/i18n/useTranslation';

export const LoginPage = () => {
  const { t } = useTranslation();
  const loginVisualTitle = (
    <>
      {t('auth.visual.loginTitleLine1')}
      <br />
      {t('auth.visual.loginTitleLine2')}
      <br />
      {t('auth.visual.loginTitleLine3')} <em>{t('auth.visual.loginTitleAccent')}</em>
    </>
  );
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [telegramUsername, setTelegramUsername] = useState('');
  const [telegramCode, setTelegramCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [profileForm, setProfileForm] = useState<ProfileForm>({ first_name: '', last_name: '' });
  const [authMode, setAuthMode] = useState<AuthMode>('password');
  const [error, setError] = useState('');
  const [showBotLink, setShowBotLink] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const login = useAuthStore((s) => s.login);
  const loginWithTelegramCodeByUsername = useAuthStore(
    (s) => s.loginWithTelegramCodeByUsername,
  );
  const setTelegramSitePassword = useAuthStore((s) => s.setTelegramSitePassword);
  const fetchMe = useAuthStore((s) => s.fetchMe);
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = location.state as { from?: { pathname?: string } } | null;
  const redirectTo = locationState?.from?.pathname ?? ROUTES.HOME;

  const clearError = () => { setError(''); setShowBotLink(false); };

  const goBack = () => { clearError(); setAuthMode('password'); };

  const handlePasswordLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    clearError();
    if (!phoneNumber || !password) { setError(t('auth.errors.enterPhoneAndPassword')); return; }
    setIsLoading(true);
    try {
      await login({ phone_number: extractPhoneNumber(phoneNumber), password });
      void navigate(redirectTo);
    } catch (err) {
      setError(translateApiError(err, t('auth.errors.wrongPhoneOrPassword')));
      setPassword('');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTelegramUsernameSubmit = async (e?: FormEvent<HTMLFormElement>) => {
    e?.preventDefault();
    clearError();
    setIsLoading(true);
    try {
      const username = telegramUsername.trim();
      await authService.requestTelegramLoginCodeByUsername({ telegram_username: username });
      setAuthMode('telegram-code');
    } catch (err) {
      const axiosErr = err as {
        response?: { status?: number };
      };
      if (axiosErr.response?.status === 404) {
        setShowBotLink(true);
        setError(t('auth.errors.accountNotFound'));
      } else {
        setError(translateApiError(err, t('auth.errors.codeSendFailed')));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleTelegramCodeSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    clearError();
    setIsLoading(true);
    try {
      const result = await loginWithTelegramCodeByUsername({
        telegram_username: telegramUsername.trim(),
        code: telegramCode,
      });
      if (result.requiresPassword) { setAuthMode('set-password'); return; }
      void navigate(redirectTo);
    } catch (err) {
      setError(translateApiError(err, t('auth.errors.wrongTelegramCode')));
      setTelegramCode('');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordSetup = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    clearError();
    if (newPassword !== confirmPassword) { setError(t('auth.errors.passwordsDoNotMatch')); return; }
    if (getPasswordStrength(newPassword).score < 3) { setError(t('auth.errors.passwordTooWeak')); return; }
    setIsLoading(true);
    try {
      await setTelegramSitePassword(newPassword);
      if (profileForm.first_name || profileForm.last_name) {
        await userService.updateMe(profileForm);
        await fetchMe();
      }
      void navigate(redirectTo);
    } catch (err) {
      setError(translateApiError(err, t('auth.errors.passwordSaveFailed')));
      setNewPassword('');
      setConfirmPassword('');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <AuthVisual title={loginVisualTitle} subtitle={t('auth.visual.loginSubtitle')} />
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
              onSubmit={(e) => {
                void handlePasswordLogin(e);
              }}
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
              onSubmit={(e) => {
                void handleTelegramUsernameSubmit(e);
              }}
              onBack={goBack}
            />
          )}

          {authMode === 'telegram-code' && (
            <TelegramCodeForm
              telegramCode={telegramCode}
              setTelegramCode={setTelegramCode}
              isLoading={isLoading}
              onSubmit={(e) => {
                void handleTelegramCodeSubmit(e);
              }}
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
              onSubmit={(e) => {
                void handlePasswordSetup(e);
              }}
            />
          )}
        </AuthCard>
      </div>
    </div>
  );
};
