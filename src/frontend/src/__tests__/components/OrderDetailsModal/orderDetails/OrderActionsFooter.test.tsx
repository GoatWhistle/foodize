import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Order } from '@shared/types/models';
import { OrderActionsFooter } from '../../../../components/OrderDetailsModal/orderDetails/OrderActionsFooter';

const ORDER = { id: 'o1', status: 'ACCEPTED' } as Order;

const baseProps = {
  order: ORDER,
  next: 'READY' as const,
  nextLabel: { ACCEPTED: 'Готово' },
  updating: null,
  canCancel: true,
  canSubmitNext: true,
  showCancelForm: false,
  cancelReason: '',
  cancelling: false,
  onShowCancelForm: vi.fn(),
  onHideCancelForm: vi.fn(),
  onCancelReasonChange: vi.fn(),
  onCancel: vi.fn(),
  onSubmitNext: vi.fn(),
};

describe('OrderActionsFooter', () => {
  it('renders next label and calls onSubmitNext', async () => {
    const onSubmitNext = vi.fn();
    render(<OrderActionsFooter {...baseProps} onSubmitNext={onSubmitNext} />);
    const btn = screen.getByRole('button', { name: 'Готово' });
    await userEvent.click(btn);
    expect(onSubmitNext).toHaveBeenCalled();
  });

  it('falls back to "Дальше" when no label for status', () => {
    render(<OrderActionsFooter {...baseProps} nextLabel={{}} />);
    expect(screen.getByRole('button', { name: 'Дальше' })).toBeInTheDocument();
  });

  it('shows "..." when updating this order', () => {
    render(<OrderActionsFooter {...baseProps} updating="o1" />);
    expect(screen.getByRole('button', { name: '...' })).toBeInTheDocument();
  });

  it('shows cancel button and triggers onShowCancelForm', async () => {
    const onShowCancelForm = vi.fn();
    render(<OrderActionsFooter {...baseProps} onShowCancelForm={onShowCancelForm} />);
    await userEvent.click(screen.getByRole('button', { name: /Отменить/ }));
    expect(onShowCancelForm).toHaveBeenCalled();
  });

  it('hides cancel button when canCancel is false', () => {
    render(<OrderActionsFooter {...baseProps} canCancel={false} />);
    expect(screen.queryByRole('button', { name: /Отменить/ })).toBeNull();
  });

  it('hides next button when next is undefined', () => {
    render(<OrderActionsFooter {...baseProps} next={undefined} />);
    expect(screen.queryByRole('button', { name: 'Готово' })).toBeNull();
  });

  it('disables next button when canSubmitNext is false', () => {
    render(<OrderActionsFooter {...baseProps} canSubmitNext={false} />);
    expect(screen.getByRole('button', { name: 'Готово' })).toBeDisabled();
  });

  it('renders cancel form and submits reason', async () => {
    const onCancel = vi.fn();
    const onHideCancelForm = vi.fn();
    const onCancelReasonChange = vi.fn();
    render(
      <OrderActionsFooter
        {...baseProps}
        showCancelForm
        cancelReason="busy"
        onCancel={onCancel}
        onHideCancelForm={onHideCancelForm}
        onCancelReasonChange={onCancelReasonChange}
      />
    );
    const textarea = screen.getByPlaceholderText('Причина отмены (необязательно)');
    await userEvent.type(textarea, 'x');
    expect(onCancelReasonChange).toHaveBeenCalled();
    await userEvent.click(screen.getByRole('button', { name: 'Назад' }));
    expect(onHideCancelForm).toHaveBeenCalled();
    await userEvent.click(screen.getByRole('button', { name: 'Подтвердить отмену' }));
    expect(onCancel).toHaveBeenCalled();
  });

  it('shows "..." on confirm button while cancelling', () => {
    render(<OrderActionsFooter {...baseProps} showCancelForm cancelling />);
    expect(screen.getByRole('button', { name: '...' })).toBeInTheDocument();
  });
});
