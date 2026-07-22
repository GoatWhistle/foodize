import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Order } from '@shared/types/models';
import { t } from '@shared/i18n/useTranslation';
import {
  OrderDetailsModal,
  type OrderDetailsModalProps,
} from '../../../components/OrderDetailsModal/OrderDetailsModal';

vi.mock('@shared/services/orderService', () => ({
  orderService: { getOrderEvents: vi.fn() },
}));

const { orderService } = await import('@shared/services/orderService');

const BASE_ORDER = {
  id: 'order-1',
  display_id: 'A-101',
  status: 'PENDING',
  restaurant_name: 'Кафе',
  total_price: 1500,
  created_at: '2026-01-15T10:00:00Z',
  items: [{ id: 'i1', menu_item_name: 'Бургер', quantity: 1, price_at_purchase: 500, selected_options: [] }],
} as unknown as Order;

const renderModal = (props: Partial<OrderDetailsModalProps> = {}) =>
  render(
    <OrderDetailsModal
      order={BASE_ORDER}
      onClose={vi.fn()}
      nextStatus={undefined}
      nextLabel={undefined}
      onStatusChange={vi.fn().mockResolvedValue(undefined)}
      onCancel={undefined}
      updating={null}
      {...props}
    />
  );

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers({ shouldAdvanceTime: true });
  vi.setSystemTime(new Date('2026-01-15T08:00:00'));
  vi.mocked(orderService.getOrderEvents).mockResolvedValue({
    data: { data: [] },
  } as unknown as Awaited<ReturnType<typeof orderService.getOrderEvents>>);
});

afterEach(() => {
  vi.useRealTimers();
});

describe('OrderDetailsModal ETA + cancel flows', () => {
  it('renders ETA picker for ACCEPTED next and disables submit until time chosen', async () => {
    renderModal({ nextStatus: { PENDING: 'ACCEPTED' }, nextLabel: { PENDING: 'Принять' } });
    await waitFor(() => { expect(screen.getByText(t('order.eta.title'))).toBeInTheDocument(); });
    expect(screen.getByRole('button', { name: 'Принять' })).toBeDisabled();
  });

  it('enables submit after choosing eta minutes and submits payload', async () => {
    const onStatusChange = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderModal({
      nextStatus: { PENDING: 'ACCEPTED' },
      nextLabel: { PENDING: 'Принять' },
      onStatusChange,
    });
    await waitFor(() => screen.getByText(t('order.eta.title')));
    await user.click(screen.getByRole('button', { name: t('order.eta.minutesChip', { minutes: 15 }) }));
    await user.click(screen.getByRole('button', { name: 'Принять' }));
    await waitFor(() =>
      { expect(onStatusChange).toHaveBeenCalledWith('order-1', 'ACCEPTED', {
        estimated_ready_in_minutes: 15,
      }); }
    );
    expect(orderService.getOrderEvents).toHaveBeenCalledTimes(2);
  });

  it('submits manual eta time as iso payload', async () => {
    const onStatusChange = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderModal({
      nextStatus: { PENDING: 'ACCEPTED' },
      nextLabel: { PENDING: 'Принять' },
      onStatusChange,
    });
    await waitFor(() => screen.getByText(t('order.eta.title')));
    const timeInput = screen.getByLabelText(t('order.eta.exactTime'));
    await user.clear(timeInput);
    await user.type(timeInput, '10:30');
    await user.click(screen.getByRole('button', { name: 'Принять' }));
    await waitFor(() =>
      { expect(onStatusChange).toHaveBeenCalledWith(
        'order-1',
        'ACCEPTED',
        expect.objectContaining<Record<string, unknown>>({ estimated_ready_at: expect.any(String) as unknown })
      ); }
    );
  });

  it('submits a non-ACCEPTED next without eta payload', async () => {
    const onStatusChange = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderModal({
      order: { ...BASE_ORDER, status: 'ACCEPTED' },
      nextStatus: { ACCEPTED: 'READY' },
      nextLabel: { ACCEPTED: 'Готово' },
      onStatusChange,
    });
    await waitFor(() => screen.getByRole('button', { name: 'Готово' }));
    await user.click(screen.getByRole('button', { name: 'Готово' }));
    await waitFor(() => { expect(onStatusChange).toHaveBeenCalledWith('order-1', 'READY', {}); });
  });

  it('runs full cancel flow and closes on success', async () => {
    const onCancel = vi.fn().mockResolvedValue(undefined);
    const onClose = vi.fn();
    const user = userEvent.setup();
    renderModal({ onCancel, onClose });
    await waitFor(() => screen.getByRole('button', { name: t('order.actions.cancel') }));
    await user.click(screen.getByRole('button', { name: t('order.actions.cancel') }));
    const textarea = screen.getByPlaceholderText(t('order.actions.cancelReasonPlaceholder'));
    await user.type(textarea, ' занят ');
    await user.click(screen.getByRole('button', { name: t('order.actions.confirmCancel') }));
    await waitFor(() => { expect(onCancel).toHaveBeenCalledWith('order-1', 'занят'); });
    expect(onClose).toHaveBeenCalled();
  });

  it('hides cancel form via Назад', async () => {
    const onCancel = vi.fn();
    const user = userEvent.setup();
    renderModal({ onCancel });
    await waitFor(() => screen.getByRole('button', { name: t('order.actions.cancel') }));
    await user.click(screen.getByRole('button', { name: t('order.actions.cancel') }));
    await user.click(screen.getByRole('button', { name: t('common.actions.back') }));
    expect(screen.queryByPlaceholderText(t('order.actions.cancelReasonPlaceholder'))).toBeNull();
  });

  it('closes when the X button is clicked', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    renderModal({ onClose });
    await waitFor(() => screen.getByLabelText(t('common.actions.close')));
    await user.click(screen.getByLabelText(t('common.actions.close')));
    expect(onClose).toHaveBeenCalled();
  });
});
