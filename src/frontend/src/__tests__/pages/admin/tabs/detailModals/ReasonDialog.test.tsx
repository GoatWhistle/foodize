import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect } from 'vitest';
import { ReasonDialog } from '../../../../../pages/admin/tabs/detailModals/ReasonDialog';
import type { ReasonDialogConfig } from '../../../../../pages/admin/useAdminDashboard';

const dialog: ReasonDialogConfig = {
  title: 'Отклонить',
  message: 'Почему?',
  confirmLabel: 'Отклонить',
  onConfirm: vi.fn(),
};

describe('ReasonDialog', () => {
  it('renders nothing when dialog is null', () => {
    const { container } = render(
      <ReasonDialog dialog={null} loading={false} onCancel={vi.fn()} onConfirm={vi.fn()} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders title, message and disabled confirm until reason typed', async () => {
    const onConfirm = vi.fn();
    render(
      <ReasonDialog dialog={dialog} loading={false} onCancel={vi.fn()} onConfirm={onConfirm} />,
    );
    expect(screen.getByText('Отклонить', { selector: 'h3' })).toBeInTheDocument();
    expect(screen.getByText('Почему?')).toBeInTheDocument();
    const confirmBtn = screen.getByRole('button', { name: 'Отклонить' });
    expect(confirmBtn).toBeDisabled();
    await userEvent.type(screen.getByPlaceholderText('Напишите причину отклонения'), '  bad  ');
    expect(confirmBtn).toBeEnabled();
    await userEvent.click(confirmBtn);
    expect(onConfirm).toHaveBeenCalledWith('bad');
  });

  it('cancels via button and overlay', async () => {
    const onCancel = vi.fn();
    render(
      <ReasonDialog dialog={dialog} loading={false} onCancel={onCancel} onConfirm={vi.fn()} />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Отмена' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('shows loading label and disables controls', () => {
    render(
      <ReasonDialog dialog={dialog} loading onCancel={vi.fn()} onConfirm={vi.fn()} />,
    );
    expect(screen.getByText('Выполняю...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Отмена' })).toBeDisabled();
  });

  it('does not cancel on overlay click while loading', async () => {
    const onCancel = vi.fn();
    const { container } = render(
      <ReasonDialog dialog={dialog} loading onCancel={onCancel} onConfirm={vi.fn()} />,
    );
    const overlay = container.querySelector('.modal-overlay') as HTMLElement;
    await userEvent.pointer({ target: overlay, keys: '[MouseLeft>]' });
    expect(onCancel).not.toHaveBeenCalled();
  });

  it('resets reason when dialog identity changes', async () => {
    const { rerender } = render(
      <ReasonDialog dialog={dialog} loading={false} onCancel={vi.fn()} onConfirm={vi.fn()} />,
    );
    const textarea = screen.getByPlaceholderText<HTMLTextAreaElement>('Напишите причину отклонения');
    await userEvent.type(textarea, 'text');
    expect(textarea.value).toBe('text');
    rerender(
      <ReasonDialog
        dialog={{ ...dialog }}
        loading={false}
        onCancel={vi.fn()}
        onConfirm={vi.fn()}
      />,
    );
    expect(
      screen.getByPlaceholderText<HTMLTextAreaElement>('Напишите причину отклонения').value,
    ).toBe('');
  });
});
