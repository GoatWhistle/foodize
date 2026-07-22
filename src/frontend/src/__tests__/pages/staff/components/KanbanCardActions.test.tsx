import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { StaffOrder } from '../../../../pages/staff/types';
import { KanbanCardActions } from '../../../../pages/staff/components/KanbanCardActions';
import { t } from '@shared/i18n/useTranslation';

const ORDER = { id: 'o1', status: 'PENDING' } as unknown as StaffOrder;

const baseProps = {
  order: ORDER,
  onAdvance: vi.fn(),
  onCancel: vi.fn(),
  updating: null,
  nextStatus: 'ACCEPTED' as string | undefined,
  nextLabel: 'Принять' as string | undefined,
  canCancel: true,
};

describe('KanbanCardActions', () => {
  it('renders advance button and calls onAdvance', async () => {
    const onAdvance = vi.fn();
    render(<KanbanCardActions {...baseProps} onAdvance={onAdvance} />);
    await userEvent.click(screen.getByRole('button', { name: 'Принять' }));
    expect(onAdvance).toHaveBeenCalledWith(ORDER);
  });

  it('applies primary button style for READY status', () => {
    render(
      <KanbanCardActions
        {...baseProps}
        order={{ id: 'o1', status: 'READY' } as unknown as StaffOrder}
        nextStatus="COMPLETED"
        nextLabel="Выдать"
      />
    );
    expect(screen.getByRole('button', { name: 'Выдать' })).toHaveClass('btn-primary');
  });

  it('shows "..." while updating this order', () => {
    render(<KanbanCardActions {...baseProps} updating="o1" />);
    expect(screen.getByRole('button', { name: '...' })).toBeDisabled();
  });

  it('hides advance button when no next status', () => {
    render(<KanbanCardActions {...baseProps} nextStatus={undefined} nextLabel={undefined} />);
    expect(screen.queryByRole('button', { name: 'Принять' })).toBeNull();
  });

  it('hides cancel button when canCancel is false', () => {
    render(<KanbanCardActions {...baseProps} canCancel={false} />);
    expect(screen.getByRole('button', { name: 'Принять' })).toBeInTheDocument();
    expect(screen.getAllByRole('button')).toHaveLength(1);
  });

  it('opens cancel form, goes back, and confirms cancel with reason', async () => {
    const onCancel = vi.fn();
    const user = userEvent.setup();
    const { container } = render(
      <KanbanCardActions {...baseProps} onCancel={onCancel} />
    );
    const cancelIconBtn = container.querySelectorAll('button')[1] as HTMLElement;
    await user.click(cancelIconBtn);
    expect(screen.getByPlaceholderText(t('staff.card.cancel.reasonPlaceholder'))).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: t('common.actions.back') }));
    expect(screen.queryByPlaceholderText(t('staff.card.cancel.reasonPlaceholder'))).toBeNull();

    await user.click(container.querySelectorAll('button')[1] as HTMLElement);
    await user.type(screen.getByPlaceholderText(t('staff.card.cancel.reasonPlaceholder')), 'занят');
    await user.click(screen.getByRole('button', { name: t('common.actions.confirm') }));
    expect(onCancel).toHaveBeenCalledWith('o1', 'занят');
  });

  it('confirms cancel with null reason when empty', async () => {
    const onCancel = vi.fn();
    const user = userEvent.setup();
    const { container } = render(
      <KanbanCardActions {...baseProps} onCancel={onCancel} />
    );
    await user.click(container.querySelectorAll('button')[1] as HTMLElement);
    await user.click(screen.getByRole('button', { name: t('common.actions.confirm') }));
    expect(onCancel).toHaveBeenCalledWith('o1', null);
  });

  it('shows "..." on confirm while updating in cancel form', async () => {
    const user = userEvent.setup();
    const { container, rerender } = render(
      <KanbanCardActions {...baseProps} />
    );
    await user.click(container.querySelectorAll('button')[1] as HTMLElement);
    rerender(<KanbanCardActions {...baseProps} updating="o1" />);
    expect(screen.getByRole('button', { name: '...' })).toBeDisabled();
  });
});
