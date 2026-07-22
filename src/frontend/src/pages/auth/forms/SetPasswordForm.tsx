import type { Dispatch, FormEvent, SetStateAction } from 'react';
import { t, useTranslation } from '@shared/i18n/useTranslation';
import type { ProfileForm } from '../types';

interface PasswordStrengthResult {
  score: number;
  label: string;
  color: string;
}

const getPasswordStrength = (value: string): PasswordStrengthResult => {
  let score = 0;
  if (value.length >= 8) score += 1;
  if (value.length >= 12) score += 1;
  if (/[a-z]/.test(value) && /[A-Z]/.test(value)) score += 1;
  if (/\d/.test(value)) score += 1;
  if (/[^A-Za-z0-9]/.test(value)) score += 1;

  if (!value) return { score: 0, label: t('auth.passwordStrength.empty'), color: 'var(--border-mid)' };
  if (score <= 2) return { score, label: t('auth.passwordStrength.weak'), color: 'var(--color-error)' };
  if (score <= 4) return { score, label: t('auth.passwordStrength.medium'), color: 'var(--color-warning)' };
  return { score, label: t('auth.passwordStrength.strong'), color: 'var(--color-success)' };
};

const PasswordStrength = ({ value }: { value: string }) => {
  const strength = getPasswordStrength(value);
  return (
    <div className="password-strength">
      <div className="password-strength-track">
        <span style={{ width: `${Math.max(1, strength.score) * 20}%`, background: strength.color }} />
      </div>
      <div style={{ color: strength.color }}>{strength.label}</div>
    </div>
  );
};

interface SetPasswordFormProps {
  profileForm: ProfileForm;
  setProfileForm: Dispatch<SetStateAction<ProfileForm>>;
  newPassword: string;
  setNewPassword: (value: string) => void;
  confirmPassword: string;
  setConfirmPassword: (value: string) => void;
  isLoading: boolean;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
}

export const SetPasswordForm = ({
  profileForm,
  setProfileForm,
  newPassword,
  setNewPassword,
  confirmPassword,
  setConfirmPassword,
  isLoading,
  onSubmit,
}: SetPasswordFormProps) => {
  const { t: translate } = useTranslation();
  return (
  <form className="auth-form" onSubmit={onSubmit} noValidate>
    <div className="form-group">
      <label className="form-label" htmlFor="telegram-first-name">
        {translate('auth.placeholders.name')}
      </label>
      <input
        id="telegram-first-name"
        className="form-input"
        type="text"
        placeholder={translate('auth.placeholders.name')}
        value={profileForm.first_name}
        onChange={(e) => { setProfileForm((f) => ({ ...f, first_name: e.target.value })); }}
        autoComplete="given-name"
      />
    </div>

    <div className="form-group">
      <label className="form-label" htmlFor="telegram-last-name">
        {translate('auth.placeholders.surname')}
      </label>
      <input
        id="telegram-last-name"
        className="form-input"
        type="text"
        placeholder={translate('auth.placeholders.surname')}
        value={profileForm.last_name}
        onChange={(e) => { setProfileForm((f) => ({ ...f, last_name: e.target.value })); }}
        autoComplete="family-name"
      />
    </div>

    <div className="form-group">
      <label className="form-label" htmlFor="telegram-new-password">
        {translate('auth.fields.newPassword')}
      </label>
      <input
        id="telegram-new-password"
        className="form-input"
        type="password"
        placeholder={translate('auth.placeholders.passwordMin')}
        value={newPassword}
        onChange={(e) => { setNewPassword(e.target.value); }}
        required
        minLength={8}
        autoComplete="new-password"
        autoFocus
      />
      <PasswordStrength value={newPassword} />
    </div>

    <div className="form-group">
      <label className="form-label" htmlFor="telegram-confirm-password">
        {translate('auth.fields.repeatPassword')}
      </label>
      <input
        id="telegram-confirm-password"
        className="form-input"
        type="password"
        placeholder={translate('auth.placeholders.repeatPassword')}
        value={confirmPassword}
        onChange={(e) => { setConfirmPassword(e.target.value); }}
        required
        minLength={8}
        autoComplete="new-password"
      />
    </div>

    <button
      type="submit"
      className="btn btn-primary btn-full"
      disabled={isLoading || newPassword.length < 8 || newPassword !== confirmPassword}
      style={{ height: '52px', borderRadius: 'var(--r-sm)' }}
    >
      {isLoading ? translate('common.actions.saving') : translate('auth.buttons.savePassword')}
    </button>
  </form>
  );
};

export { getPasswordStrength };
