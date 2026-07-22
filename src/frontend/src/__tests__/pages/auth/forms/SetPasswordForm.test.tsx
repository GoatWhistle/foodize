import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { t } from '@shared/i18n/useTranslation';
import { SetPasswordForm, getPasswordStrength } from '../../../../pages/auth/forms/SetPasswordForm';
import type { ProfileForm } from '../../../../pages/auth/types';

const Harness = ({
  isLoading = false,
  onSubmit = () => {},
  initialNew = '',
  initialConfirm = '',
}: {
  isLoading?: boolean;
  onSubmit?: (e: FormEvent<HTMLFormElement>) => void;
  initialNew?: string;
  initialConfirm?: string;
}) => {
  const [profileForm, setProfileForm] = useState<ProfileForm>({ first_name: '', last_name: '' });
  const [newPassword, setNewPassword] = useState(initialNew);
  const [confirmPassword, setConfirmPassword] = useState(initialConfirm);
  return (
    <SetPasswordForm
      profileForm={profileForm}
      setProfileForm={setProfileForm}
      newPassword={newPassword}
      setNewPassword={setNewPassword}
      confirmPassword={confirmPassword}
      setConfirmPassword={setConfirmPassword}
      isLoading={isLoading}
      onSubmit={onSubmit}
    />
  );
};

describe('getPasswordStrength', () => {
  it('returns empty state for empty value', () => {
    const r = getPasswordStrength('');
    expect(r.score).toBe(0);
    expect(r.label).toBe(t('auth.passwordStrength.empty'));
  });

  it('returns weak for short simple password', () => {
    expect(getPasswordStrength('abc').label).toBe(t('auth.passwordStrength.weak'));
  });

  it('returns medium for moderately complex password', () => {
    expect(getPasswordStrength('Abcdefg1').label).toBe(t('auth.passwordStrength.medium'));
  });

  it('returns strong for long complex password', () => {
    const r = getPasswordStrength('Abcdefgh1234!@');
    expect(r.label).toBe(t('auth.passwordStrength.strong'));
    expect(r.score).toBe(5);
  });
});

describe('SetPasswordForm', () => {
  it('renders name, password and confirm inputs', () => {
    render(<Harness />);
    expect(screen.getByLabelText(t('auth.placeholders.name'))).toBeInTheDocument();
    expect(screen.getByLabelText(t('auth.placeholders.surname'))).toBeInTheDocument();
    expect(screen.getByLabelText(t('auth.fields.newPassword'))).toBeInTheDocument();
    expect(screen.getByLabelText(t('auth.fields.repeatPassword'))).toBeInTheDocument();
  });

  it('shows password strength label as user types', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    expect(screen.getByText(t('auth.passwordStrength.empty'))).toBeInTheDocument();
    await user.type(screen.getByLabelText(t('auth.fields.newPassword')), 'Abcdefgh1234!@');
    expect(screen.getByText(t('auth.passwordStrength.strong'))).toBeInTheDocument();
  });

  it('updates profile name fields', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.type(screen.getByLabelText(t('auth.placeholders.name')), 'Ivan');
    await user.type(screen.getByLabelText(t('auth.placeholders.surname')), 'Petrov');
    expect(screen.getByLabelText(t('auth.placeholders.name'))).toHaveValue('Ivan');
    expect(screen.getByLabelText(t('auth.placeholders.surname'))).toHaveValue('Petrov');
  });

  it('keeps submit disabled while passwords are invalid or mismatched', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const submit = screen.getByRole('button', { name: t('auth.buttons.savePassword') });
    expect(submit).toBeDisabled();
    await user.type(screen.getByLabelText(t('auth.fields.newPassword')), 'Abcdefg1');
    await user.type(screen.getByLabelText(t('auth.fields.repeatPassword')), 'different');
    expect(submit).toBeDisabled();
  });

  it('enables submit and calls onSubmit when passwords match', async () => {
    const onSubmit = vi.fn((e: FormEvent<HTMLFormElement>) => { e.preventDefault(); });
    const user = userEvent.setup();
    render(<Harness onSubmit={onSubmit} />);
    await user.type(screen.getByLabelText(t('auth.fields.newPassword')), 'Abcdefg1');
    await user.type(screen.getByLabelText(t('auth.fields.repeatPassword')), 'Abcdefg1');
    const submit = screen.getByRole('button', { name: t('auth.buttons.savePassword') });
    expect(submit).toBeEnabled();
    await user.click(submit);
    expect(onSubmit).toHaveBeenCalled();
  });

  it('shows loading label and disables submit when loading', () => {
    render(<Harness isLoading initialNew="Abcdefg1" initialConfirm="Abcdefg1" />);
    const submit = screen.getByRole('button', { name: t('common.actions.saving') });
    expect(submit).toBeDisabled();
  });
});
