import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Order } from '@shared/types/models';
import { t } from '@shared/i18n/useTranslation';
import { OrderDetailsModal, type OrderDetailsModalProps, } from '../../components/OrderDetailsModal/OrderDetailsModal';
vi.mock('@shared/services/orderService.js', () => ({
  orderService: {
    getOrderEvents: vi.fn(),
  },
}));

vi.mock('@shared/utils/locales.js', async () => {
  const actual = await vi.importActual('@shared/utils/locales.js');
  return actual;
});

const { orderService } = await import('@shared/services/orderService.js');

interface RenderProps {
  order?: Order | null;
  onClose?: () => void;
  nextStatus?: Record<string, string> | null;
  nextLabel?: Record<string, string> | null;
  onStatusChange?: (...args: unknown[]) => unknown;
  onCancel?: ((...args: unknown[]) => unknown) | null;
  updating?: string | null;
}

const BASE_ORDER = {
  id: 'order-1',
  display_id: 'A-101',
  status: 'PENDING',
  restaurant_name: 'Тест Кафе',
  total_price: 1500,
  created_at: '2026-01-15T10:00:00Z',
  items: [
    { id: 'item-1', menu_item_name: 'Бургер', quantity: 2, price_at_purchase: 500, selected_options: [] },
    { id: 'item-2', menu_item_name: 'Картошка', quantity: 1, price_at_purchase: 500, selected_options: [] },
  ],
  user: { name: 'Иван Иванов', phone_number: '79001234567' },
  cancellation_reason: null,
} as unknown as Order;

const render$ = (props: RenderProps = {}) => {
  const merged = {
    order: BASE_ORDER,
    onClose: vi.fn(),
    nextStatus: null,
    nextLabel: null,
    onStatusChange: vi.fn(),
    onCancel: null,
    updating: null,
    ...props,
  };
  return render(
    <OrderDetailsModal
      order={merged.order}
      onClose={merged.onClose}
      nextStatus={merged.nextStatus as OrderDetailsModalProps['nextStatus']}
      nextLabel={merged.nextLabel as OrderDetailsModalProps['nextLabel']}
      onStatusChange={merged.onStatusChange as OrderDetailsModalProps['onStatusChange']}
      onCancel={merged.onCancel as OrderDetailsModalProps['onCancel']}
      updating={merged.updating}
    />
  );
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(orderService.getOrderEvents).mockResolvedValue({
    data: { data: [] },
  } as unknown as Awaited<ReturnType<typeof orderService.getOrderEvents>>);
});

describe('OrderDetailsModal', () => {
  it('renders null when order is null', () => {
    const { container } = render$({ order: null });
    expect(container.firstChild).toBeNull();
  });

  it('renders order display id', async () => {
    render$();
    await waitFor(() => {
      expect(screen.getByText(/A-101/)).toBeInTheDocument();
    });
  });

  it('renders restaurant name', async () => {
    render$();
    await waitFor(() => {
      expect(screen.getByText('Тест Кафе')).toBeInTheDocument();
    });
  });

  it('renders order items', async () => {
    render$();
    await waitFor(() => {
      expect(screen.getByText('Бургер')).toBeInTheDocument();
      expect(screen.getByText('Картошка')).toBeInTheDocument();
    });
  });

  it('calls onClose when overlay clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render$({ onClose });
    await user.click(screen.getByTestId('order-details-overlay'));
    expect(onClose).toHaveBeenCalled();
  });

  it('loads order events on mount', async () => {
    render$();
    await waitFor(() => {
      expect(orderService.getOrderEvents).toHaveBeenCalledWith('order-1');
    });
  });

  it('shows cancel button when canCancel is true', async () => {
    const onCancel = vi.fn();
    render$({ onCancel });
    await waitFor(() => {
      expect(screen.getByRole('button', { name: t('order.actions.cancel') })).toBeInTheDocument();
    });
  });

  it('does not show cancel button for COMPLETED orders', async () => {
    const onCancel = vi.fn();
    render$({ order: { ...BASE_ORDER, status: 'COMPLETED' }, onCancel });
    await waitFor(() => {
      expect(screen.queryByRole('button', { name: t('order.actions.cancel') })).not.toBeInTheDocument();
    });
  });

  it('shows status change button when nextStatus provided', async () => {
    render$({
      order: { ...BASE_ORDER, status: 'ACCEPTED' },
      nextStatus: { ACCEPTED: 'READY' },
      nextLabel: { ACCEPTED: 'Готово' },
    });
    await waitFor(() => {
      expect(screen.getByText('Готово')).toBeInTheDocument();
    });
  });

  it('calls onStatusChange when status button clicked', async () => {
    const onStatusChange = vi.fn().mockResolvedValue(undefined);
    render$({
      order: { ...BASE_ORDER, status: 'ACCEPTED' },
      nextStatus: { ACCEPTED: 'READY' },
      nextLabel: { ACCEPTED: 'Готово' },
      onStatusChange,
    });
    const user = userEvent.setup();
    await waitFor(() => screen.getByText('Готово'));
    await user.click(screen.getByText('Готово'));
    await waitFor(() => {
      expect(onStatusChange).toHaveBeenCalledWith('order-1', 'READY', expect.anything());
    });
  });

  it('does not show cancel button when order is CANCELLED', async () => {
    const onCancel = vi.fn();
    render$({
      order: { ...BASE_ORDER, status: 'CANCELLED' },
      onCancel,
    });
    await waitFor(() => {
      expect(orderService.getOrderEvents).toHaveBeenCalled();
    });
    expect(screen.queryByText(t('order.actions.confirmCancel'))).not.toBeInTheDocument();
  });
});
