import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EtaModal } from '../../../../pages/staff/components/EtaModal';
import type { StaffOrder } from '../../../../pages/staff/types';
import { t } from '@shared/i18n/useTranslation';

const makeOrder = (prepTimes: number[]): StaffOrder =>
  ({
    id: 'o1',
    display_id: 42,
    items: prepTimes.map((t, idx) => ({
      id: `i${idx}`,
      menu_item_prep_time: t,
    })),
  }) as unknown as StaffOrder;

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  vi.setSystemTime(new Date('2026-01-15T08:00:00'));
});

afterEach(() => {
  vi.useRealTimers();
});

describe('EtaModal', () => {
  it('renders order id and default eta chip from prep times', () => {
    render(
      <EtaModal order={makeOrder([20, 12])} onConfirm={vi.fn()} onCancel={vi.fn()} updating={false} />
    );
    expect(screen.getByText(t('staff.etaModal.title', { displayId: 42 }))).toBeInTheDocument();
    expect(screen.getByRole('button', { name: `${t('staff.etaModal.chipMinutes', { minutes: 20 })}${t('staff.etaModal.recommendedMark')}` })).toBeInTheDocument();
  });

  it('falls back to 15 min default when no prep times', () => {
    render(
      <EtaModal order={makeOrder([])} onConfirm={vi.fn()} onCancel={vi.fn()} updating={false} />
    );
    expect(screen.getByRole('button', { name: `${t('staff.etaModal.chipMinutes', { minutes: 15 })}${t('staff.etaModal.recommendedMark')}` })).toBeInTheDocument();
  });

  it('confirms with selected minutes', async () => {
    const onConfirm = vi.fn();
    const user = userEvent.setup();
    render(
      <EtaModal order={makeOrder([])} onConfirm={onConfirm} onCancel={vi.fn()} updating={false} />
    );
    await user.click(screen.getByRole('button', { name: t('staff.etaModal.chipMinutes', { minutes: 30 }) }));
    await user.click(screen.getByRole('button', { name: t('staff.etaModal.confirm') }));
    expect(onConfirm).toHaveBeenCalledWith({ estimated_ready_in_minutes: 30 });
  });

  it('confirms with manual time as iso', async () => {
    const onConfirm = vi.fn();
    const user = userEvent.setup();
    render(
      <EtaModal order={makeOrder([])} onConfirm={onConfirm} onCancel={vi.fn()} updating={false} />
    );
    const input = screen.getByLabelText(new RegExp(t('staff.etaModal.manualLabel')));
    await user.clear(input);
    await user.type(input, '10:30');
    await user.click(screen.getByRole('button', { name: t('staff.etaModal.confirm') }));
    expect(onConfirm).toHaveBeenCalledWith(
      expect.objectContaining<Record<string, unknown>>({ estimated_ready_at: expect.any(String) as unknown })
    );
  });

  it('disables confirm and shows loader while updating', () => {
    render(
      <EtaModal order={makeOrder([15])} onConfirm={vi.fn()} onCancel={vi.fn()} updating />
    );
    expect(screen.getByRole('button', { name: '...' })).toBeDisabled();
  });

  it('cancels on overlay mousedown and cancel button', async () => {
    const onCancel = vi.fn();
    const user = userEvent.setup();
    const { container } = render(
      <EtaModal order={makeOrder([15])} onConfirm={vi.fn()} onCancel={onCancel} updating={false} />
    );
    await user.click(screen.getByRole('button', { name: t('common.actions.cancel') }));
    expect(onCancel).toHaveBeenCalledTimes(1);
    const overlay = container.querySelector('.modal-overlay') as HTMLElement;
    overlay.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    expect(onCancel).toHaveBeenCalledTimes(2);
  });
});
