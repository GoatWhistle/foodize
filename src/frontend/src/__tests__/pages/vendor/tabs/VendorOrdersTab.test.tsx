import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { useState } from 'react';
import { VendorOrdersTab, NEXT_ORDER_STATUS, NEXT_ORDER_LABEL_KEYS } from '../../../../pages/vendor/tabs/VendorOrdersTab';
import type { Order, Restaurant } from '@shared/types/models';
import { t } from '@shared/i18n/useTranslation';

vi.mock('../../../../components/OrderDetailsModal/OrderDetailsModal', () => ({
  OrderDetailsModal: ({ order, onClose, onStatusChange, onCancel }: {
    order: Order;
    onClose: () => void;
    onStatusChange: (id: string, status: string) => void;
    onCancel: (id: string, reason?: string) => void;
  }) => (
    <div data-testid="order-modal">
      <span>Modal {order.id}</span>
      <button onClick={onClose}>close</button>
      <button onClick={() => { onStatusChange(order.id, 'ACCEPTED'); }}>advance</button>
      <button onClick={() => { onCancel(order.id); }}>cancel</button>
    </div>
  ),
}));

const restaurant = { id: 'r1' } as unknown as Restaurant;
const vendorServiceMock = { exportOrdersCSV: vi.fn(() => Promise.resolve(new Blob())) };

const makeOrder = (overrides: Partial<Order> = {}): Order =>
  ({
    id: 'o1',
    status: 'PENDING',
    created_at: '2026-07-18T10:00:00Z',
    total_price: 500,
    requested_pickup_at: null,
    items: [{ id: 'it1', quantity: 1, menu_item_name: 'Шаурма', selected_options: [] }],
    ...overrides,
  }) as unknown as Order;

const group = (orders: Order[]) => [{ dateKey: '2026-07-18', title: 'Сегодня', orders }];

const Harness = ({
  orders = [makeOrder()],
  grouped,
  ordersLoading = false,
  ordersError = null,
  statusFilter = '',
  total = 1,
  onChange = vi.fn(),
  onCancel = vi.fn(),
}: Record<string, unknown>) => {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [page, setPage] = useState(1);
  return (
    <VendorOrdersTab
      restaurantOrders={orders as Order[]}
      ordersPage={page}
      setOrdersPage={setPage}
      ordersTotal={total as number}
      ordersStatusFilter={statusFilter as string}
      setOrdersStatusFilter={vi.fn()}
      ordersDateFromFilter=""
      setOrdersDateFromFilter={vi.fn()}
      ordersDateToFilter=""
      setOrdersDateToFilter={vi.fn()}
      ordersLoading={ordersLoading as boolean}
      exportLoading={false}
      updatingOrderId={null}
      selectedOrder={selectedOrder}
      setSelectedOrder={setSelectedOrder}
      todayStr="2026-07-18"
      groupedRestaurantOrders={
        (grouped as ReturnType<typeof group> | undefined) ?? group(orders as Order[])
      }
      ordersError={ordersError as string | null}
      handleVendorExport={vi.fn()}
      fetchVendorOrders={vi.fn()}
      handleOrderChange={onChange as never}
      handleCancelOrder={onCancel as never}
      vendorService={vendorServiceMock}
      selectedRestaurant={restaurant}
      getOrderDisplayId={(o) => o.id}
      formatOrderTime={() => '10:00'}
    />
  );
};

describe('VendorOrdersTab', () => {
  it('exports the status maps', () => {
    expect(NEXT_ORDER_STATUS.PENDING).toBe('ACCEPTED');
    expect(NEXT_ORDER_LABEL_KEYS.PENDING).toBe('vendor.orders.nextLabel.accept');
  });

  it('renders grouped orders and toolbar', () => {
    render(<Harness />);
    expect(screen.getByText('Сегодня')).toBeInTheDocument();
    expect(screen.getByText(t('vendor.orders.card.title', { displayId: 'o1' }))).toBeInTheDocument();
    expect(screen.getByText(t('vendor.orders.toolbarTitle'))).toBeInTheDocument();
  });

  it('shows error banner', () => {
    render(<Harness ordersError="Не удалось" />);
    expect(screen.getByText('Не удалось')).toBeInTheDocument();
  });

  it('shows skeleton while loading with no orders', () => {
    render(<Harness orders={[]} grouped={[]} ordersLoading total={0} />);
    expect(screen.queryByText(t('vendor.orders.emptyTitle'))).not.toBeInTheDocument();
  });

  it('shows empty state without filter', () => {
    render(<Harness orders={[]} grouped={[]} total={0} />);
    expect(screen.getByText(t('vendor.orders.emptyTitle'))).toBeInTheDocument();
    expect(screen.getByText(t('vendor.orders.emptySubtitle'))).toBeInTheDocument();
  });

  it('shows empty state with a status filter message', () => {
    render(<Harness orders={[]} grouped={[]} total={0} statusFilter="READY" />);
    expect(screen.getByText(t('vendor.orders.emptySubtitleFiltered'))).toBeInTheDocument();
  });

  it('opens modal on order click and closes it', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByText(t('vendor.orders.card.title', { displayId: 'o1' })));
    expect(screen.getByTestId('order-modal')).toBeInTheDocument();
    await user.click(screen.getByText('close'));
    expect(screen.queryByTestId('order-modal')).not.toBeInTheDocument();
  });

  it('modal status change and cancel invoke handlers', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const onCancel = vi.fn();
    render(<Harness onChange={onChange} onCancel={onCancel} />);
    await user.click(screen.getByText(t('vendor.orders.card.title', { displayId: 'o1' })));
    await user.click(screen.getByText('advance'));
    expect(onChange).toHaveBeenCalledWith('o1', 'ACCEPTED');
    await user.click(screen.getByText('cancel'));
    expect(onCancel).toHaveBeenCalledWith('o1', '');
  });

  it('renders pagination when total exceeds page size', () => {
    const orders = [makeOrder()];
    render(<Harness orders={orders} total={40} />);
    expect(screen.getAllByLabelText(new RegExp(t('catalog.pagination.goToPage', { page: '' }).trim())).length).toBeGreaterThan(0);
  });

  it('handles non-array orders as empty', () => {
    render(<Harness orders={null} grouped={[]} total={0} />);
    expect(screen.getByText(t('vendor.orders.emptyTitle'))).toBeInTheDocument();
  });
});
