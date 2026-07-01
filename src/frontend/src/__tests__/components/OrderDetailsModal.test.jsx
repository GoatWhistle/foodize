import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import OrderDetailsModal from '../../components/ui/OrderDetailsModal';

vi.mock('../../services/orderService', () => ({
  orderService: {
    getOrderEvents: vi.fn(),
  },
}));

vi.mock('../../utils/locales', async () => {
  const actual = await vi.importActual('../../utils/locales');
  return actual;
});

const { orderService } = await import('../../services/orderService');

const BASE_ORDER = {
  id: 'order-1',
  display_id: 'A-101',
  status: 'PENDING',
  restaurant_name: 'Тест Кафе',
  total_price: 1500,
  created_at: '2026-01-15T10:00:00Z',
  items: [
    { id: 'item-1', name: 'Бургер', quantity: 2, unit_price: 500, selected_options: [] },
    { id: 'item-2', name: 'Картошка', quantity: 1, unit_price: 500, selected_options: [] },
  ],
  user: { name: 'Иван Иванов', phone_number: '79001234567' },
  cancellation_reason: null,
};

const render$ = (props = {}) =>
  render(
    <OrderDetailsModal
      order={BASE_ORDER}
      onClose={vi.fn()}
      nextStatus={null}
      nextLabel={null}
      onStatusChange={vi.fn()}
      onCancel={null}
      updating={null}
      {...props}
    />
  );

beforeEach(() => {
  vi.clearAllMocks();
  orderService.getOrderEvents.mockResolvedValue({ data: { data: [] } });
});

describe('OrderDetailsModal', () => {
  it('renders null when order is null', () => {
    const { container } = render(
      <OrderDetailsModal order={null} onClose={vi.fn()} nextStatus={null} nextLabel={null} onStatusChange={vi.fn()} onCancel={null} updating={null} />
    );
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
    const onClose = vi.fn();
    render$({ onClose });
    const overlay = document.querySelector('.modal-overlay');
    fireEvent.mouseDown(overlay, { target: overlay });
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
      expect(screen.getByText(/Отмен/i)).toBeInTheDocument();
    });
  });

  it('does not show cancel button for COMPLETED orders', async () => {
    const onCancel = vi.fn();
    render$({ order: { ...BASE_ORDER, status: 'COMPLETED' }, onCancel });
    await waitFor(() => {
      expect(screen.queryByText('Отменить заказ')).not.toBeInTheDocument();
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
    await waitFor(() => screen.getByText('Готово'));
    fireEvent.click(screen.getByText('Готово'));
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
    expect(screen.queryByText('Подтвердить отмену')).not.toBeInTheDocument();
  });
});
