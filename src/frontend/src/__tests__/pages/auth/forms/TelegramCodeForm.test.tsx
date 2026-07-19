import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { TelegramCodeForm } from '../../../../pages/auth/forms/TelegramCodeForm';

const Harness = ({
  isLoading = false,
  onSubmit = (e: FormEvent<HTMLFormElement>) => { e.preventDefault(); },
  onBack = () => {},
  onResend = () => {},
}: {
  isLoading?: boolean;
  onSubmit?: (e: FormEvent<HTMLFormElement>) => void;
  onBack?: () => void;
  onResend?: () => void | Promise<void>;
}) => {
  const [code, setCode] = useState('');
  return (
    <TelegramCodeForm
      telegramCode={code}
      setTelegramCode={setCode}
      isLoading={isLoading}
      onSubmit={onSubmit}
      onBack={onBack}
      onResend={onResend}
    />
  );
};

describe('TelegramCodeForm interactions', () => {
  it('renders code input and disables submit under 4 chars', () => {
    render(<Harness />);
    expect(screen.getByLabelText('Код из Telegram')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Подтвердить код' })).toBeDisabled();
  });

  it('sanitizes input to digits only, max 6', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const input = screen.getByLabelText('Код из Telegram');
    await user.type(input, 'a1b2c3d4e5f6g7');
    expect(input).toHaveValue('123456');
  });

  it('enables submit at 4+ digits and calls onSubmit', async () => {
    const onSubmit = vi.fn((e: FormEvent<HTMLFormElement>) => { e.preventDefault(); });
    const user = userEvent.setup();
    render(<Harness onSubmit={onSubmit} />);
    await user.type(screen.getByLabelText('Код из Telegram'), '1234');
    const submit = screen.getByRole('button', { name: 'Подтвердить код' });
    expect(submit).toBeEnabled();
    await user.click(submit);
    expect(onSubmit).toHaveBeenCalled();
  });

  it('calls onBack when Назад clicked', async () => {
    const onBack = vi.fn();
    const user = userEvent.setup();
    render(<Harness onBack={onBack} />);
    await user.click(screen.getByRole('button', { name: 'Назад' }));
    expect(onBack).toHaveBeenCalled();
  });

  it('disables all controls while loading', () => {
    render(<Harness isLoading />);
    expect(screen.getByRole('button', { name: 'Проверяем...' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Назад' })).toBeDisabled();
  });
});

describe('TelegramCodeForm resend cooldown', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it('shows resend cooldown countdown and disables resend while counting', () => {
    render(<Harness />);
    expect(screen.getByText('60с')).toBeInTheDocument();
    const resend = screen.getByRole('button', { name: /Отправить повторно/ });
    expect(resend).toBeDisabled();
    act(() => { vi.advanceTimersByTime(1000); });
    expect(screen.getByText('59с')).toBeInTheDocument();
  });

  it('enables resend after cooldown reaches zero and calls onResend', async () => {
    const onResend = vi.fn().mockResolvedValue(undefined);
    render(<Harness onResend={onResend} />);
    for (let i = 0; i < 61; i += 1) {
      await act(async () => { await vi.advanceTimersByTimeAsync(1000); });
    }
    const resend = screen.getAllByRole('button', { name: /Отправить повторно/ })[0];
    if (!resend) throw new Error('resend button not found');
    expect(resend).toBeEnabled();
    await act(async () => {
      resend.click();
      await Promise.resolve();
    });
    expect(onResend).toHaveBeenCalled();
    expect(screen.getByText('60с')).toBeInTheDocument();
  });
});
