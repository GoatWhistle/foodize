import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { t } from '@shared/i18n/useTranslation';
import { TelegramUsernameForm } from '../../../../pages/auth/forms/TelegramUsernameForm';

const Harness = ({
  isLoading = false,
  onSubmit = (e: FormEvent<HTMLFormElement>) => { e.preventDefault(); },
  onBack = () => {},
  initial = '',
}: {
  isLoading?: boolean;
  onSubmit?: (e: FormEvent<HTMLFormElement>) => void;
  onBack?: () => void;
  initial?: string;
}) => {
  const [username, setUsername] = useState(initial);
  return (
    <TelegramUsernameForm
      telegramUsername={username}
      setTelegramUsername={setUsername}
      isLoading={isLoading}
      onSubmit={onSubmit}
      onBack={onBack}
    />
  );
};

describe('TelegramUsernameForm', () => {
  it('renders username input with disabled submit initially', () => {
    render(<Harness />);
    expect(screen.getByLabelText(t('auth.fields.telegramUsername'))).toBeInTheDocument();
    expect(screen.getByRole('button', { name: t('auth.buttons.getCode') })).toBeDisabled();
  });

  it('strips @ and invalid characters from input', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const input = screen.getByLabelText(t('auth.fields.telegramUsername'));
    await user.type(input, '@my.user!name');
    expect(input).toHaveValue('myusername');
  });

  it('shows hint when partial invalid username typed', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.type(screen.getByLabelText(t('auth.fields.telegramUsername')), 'abc');
    expect(screen.getByText(t('auth.usernameHints.format'))).toBeInTheDocument();
  });

  it('shows validation error on blur for too-short username', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const input = screen.getByLabelText(t('auth.fields.telegramUsername'));
    await user.type(input, 'abc');
    await user.tab();
    expect(screen.getByText(t('auth.usernameHints.minLength'))).toBeInTheDocument();
  });

  it('shows underscore error when starting with underscore after touch', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const input = screen.getByLabelText(t('auth.fields.telegramUsername'));
    await user.type(input, '_hello');
    await user.tab();
    expect(screen.getByText(t('auth.usernameHints.underscoreEdges'))).toBeInTheDocument();
  });

  it('enables submit for valid username and calls onSubmit', async () => {
    const onSubmit = vi.fn((e: FormEvent<HTMLFormElement>) => { e.preventDefault(); });
    const user = userEvent.setup();
    render(<Harness onSubmit={onSubmit} />);
    await user.type(screen.getByLabelText(t('auth.fields.telegramUsername')), 'validuser');
    const submit = screen.getByRole('button', { name: t('auth.buttons.getCode') });
    expect(submit).toBeEnabled();
    await user.click(submit);
    expect(onSubmit).toHaveBeenCalled();
  });

  it('does not call onSubmit when submitting invalid username via form', async () => {
    const onSubmit = vi.fn();
    render(<Harness onSubmit={onSubmit} initial="abc" />);
    const form = screen.getByLabelText(t('auth.fields.telegramUsername')).closest('form') as HTMLFormElement;
    form.requestSubmit();
    expect(onSubmit).not.toHaveBeenCalled();
    expect(await screen.findByText(t('auth.usernameHints.minLength'))).toBeInTheDocument();
  });

  it('shows max-length error when username exceeds 32 chars on blur', async () => {
    const user = userEvent.setup();
    render(<Harness initial={'a'.repeat(33)} />);
    await user.click(screen.getByLabelText(t('auth.fields.telegramUsername')));
    await user.tab();
    expect(screen.getByText(t('auth.usernameHints.maxLength'))).toBeInTheDocument();
  });

  it('calls onBack when Назад clicked', async () => {
    const onBack = vi.fn();
    const user = userEvent.setup();
    render(<Harness onBack={onBack} />);
    await user.click(screen.getByRole('button', { name: t('common.actions.back') }));
    expect(onBack).toHaveBeenCalled();
  });

  it('shows loading label when loading', () => {
    render(<Harness isLoading initial="validuser" />);
    expect(screen.getByRole('button', { name: t('auth.buttons.sending') })).toBeDisabled();
  });
});
