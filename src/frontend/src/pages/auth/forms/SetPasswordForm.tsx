import type { Dispatch, FormEvent, SetStateAction } from 'react';
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

  if (!value) return { score: 0, label: 'Введите пароль', color: 'var(--border-mid)' };
  if (score <= 2) return { score, label: 'Слабый пароль', color: '#ef4444' };
  if (score <= 4) return { score, label: 'Средний пароль', color: '#f59e0b' };
  return { score, label: 'Сильный пароль', color: '#22c55e' };
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

const SetPasswordForm = ({
  profileForm,
  setProfileForm,
  newPassword,
  setNewPassword,
  confirmPassword,
  setConfirmPassword,
  isLoading,
  onSubmit,
}: SetPasswordFormProps) => (
  <form className="auth-form" onSubmit={onSubmit} noValidate>
    <div className="form-group">
      <label className="form-label" htmlFor="telegram-first-name">
        Имя
      </label>
      <input
        id="telegram-first-name"
        className="form-input"
        type="text"
        placeholder="Имя"
        value={profileForm.first_name}
        onChange={(e) => setProfileForm((f) => ({ ...f, first_name: e.target.value }))}
        autoComplete="given-name"
      />
    </div>

    <div className="form-group">
      <label className="form-label" htmlFor="telegram-last-name">
        Фамилия
      </label>
      <input
        id="telegram-last-name"
        className="form-input"
        type="text"
        placeholder="Фамилия"
        value={profileForm.last_name}
        onChange={(e) => setProfileForm((f) => ({ ...f, last_name: e.target.value }))}
        autoComplete="family-name"
      />
    </div>

    <div className="form-group">
      <label className="form-label" htmlFor="telegram-new-password">
        Новый пароль
      </label>
      <input
        id="telegram-new-password"
        className="form-input"
        type="password"
        placeholder="Минимум 8 символов"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        required
        minLength={8}
        autoComplete="new-password"
        autoFocus
      />
      <PasswordStrength value={newPassword} />
    </div>

    <div className="form-group">
      <label className="form-label" htmlFor="telegram-confirm-password">
        Повторите пароль
      </label>
      <input
        id="telegram-confirm-password"
        className="form-input"
        type="password"
        placeholder="Ещё раз новый пароль"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
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
      {isLoading ? 'Сохраняем...' : 'Сохранить пароль'}
    </button>
  </form>
);

export { getPasswordStrength };
export default SetPasswordForm;
