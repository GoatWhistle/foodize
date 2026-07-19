import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { useState } from 'react';
import type { FormEvent } from 'react';
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
    expect(r.label).toBe('Введите пароль');
  });

  it('returns weak for short simple password', () => {
    expect(getPasswordStrength('abc').label).toBe('Слабый пароль');
  });

  it('returns medium for moderately complex password', () => {
    expect(getPasswordStrength('Abcdefg1').label).toBe('Средний пароль');
  });

  it('returns strong for long complex password', () => {
    const r = getPasswordStrength('Abcdefgh1234!@');
    expect(r.label).toBe('Сильный пароль');
    expect(r.score).toBe(5);
  });
});

describe('SetPasswordForm', () => {
  it('renders name, password and confirm inputs', () => {
    render(<Harness />);
    expect(screen.getByLabelText('Имя')).toBeInTheDocument();
    expect(screen.getByLabelText('Фамилия')).toBeInTheDocument();
    expect(screen.getByLabelText('Новый пароль')).toBeInTheDocument();
    expect(screen.getByLabelText('Повторите пароль')).toBeInTheDocument();
  });

  it('shows password strength label as user types', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    expect(screen.getByText('Введите пароль')).toBeInTheDocument();
    await user.type(screen.getByLabelText('Новый пароль'), 'Abcdefgh1234!@');
    expect(screen.getByText('Сильный пароль')).toBeInTheDocument();
  });

  it('updates profile name fields', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.type(screen.getByLabelText('Имя'), 'Ivan');
    await user.type(screen.getByLabelText('Фамилия'), 'Petrov');
    expect(screen.getByLabelText('Имя')).toHaveValue('Ivan');
    expect(screen.getByLabelText('Фамилия')).toHaveValue('Petrov');
  });

  it('keeps submit disabled while passwords are invalid or mismatched', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const submit = screen.getByRole('button', { name: 'Сохранить пароль' });
    expect(submit).toBeDisabled();
    await user.type(screen.getByLabelText('Новый пароль'), 'Abcdefg1');
    await user.type(screen.getByLabelText('Повторите пароль'), 'different');
    expect(submit).toBeDisabled();
  });

  it('enables submit and calls onSubmit when passwords match', async () => {
    const onSubmit = vi.fn((e: FormEvent<HTMLFormElement>) => { e.preventDefault(); });
    const user = userEvent.setup();
    render(<Harness onSubmit={onSubmit} />);
    await user.type(screen.getByLabelText('Новый пароль'), 'Abcdefg1');
    await user.type(screen.getByLabelText('Повторите пароль'), 'Abcdefg1');
    const submit = screen.getByRole('button', { name: 'Сохранить пароль' });
    expect(submit).toBeEnabled();
    await user.click(submit);
    expect(onSubmit).toHaveBeenCalled();
  });

  it('shows loading label and disables submit when loading', () => {
    render(<Harness isLoading initialNew="Abcdefg1" initialConfirm="Abcdefg1" />);
    const submit = screen.getByRole('button', { name: 'Сохраняем...' });
    expect(submit).toBeDisabled();
  });
});
