import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { AdminOrdersTab } from '../../../../pages/admin/tabs/AdminOrdersTab';
import type { Order } from '@shared/types/models';
import type { OrderFilters } from '../../../../pages/admin/hooks/useAdminOrders';
import type { adminService as adminServiceType } from '../../../../services/adminService';
import { at } from '../../../testUtils';

const exportOrdersCSV = vi.fn().mockResolvedValue(new Blob());
const adminService = { exportOrdersCSV } as unknown as typeof adminServiceType;

const orders: Order[] = [
  {
    id: 'o1',
    display_id: 101,
    status: 'PENDING',
    total_price: 1500,
    customer_name: 'Bob',
    customer_phone: '+700000009',
    restaurant_name: 'Cafe',
    restaurant_address: 'Main St',
  } as unknown as Order,
  {
    id: 'o2',
    display_id: 102,
    status: 'WEIRD',
    total_price: 2500,
    customer_name: '',
    customer_phone: '',
    restaurant_name: '',
    restaurant_address: '',
  } as unknown as Order,
];

interface Overrides {
  orders?: Order[];
  ordersLoading?: boolean;
  ordersTotal?: number;
  orderFilters?: OrderFilters;
  exportLoading?: boolean;
}

const setOrdersPage = vi.fn();
const setOrderSearchRaw = vi.fn();
const setOrderFilters = vi.fn();
const handleExport = vi.fn();
const setSelectedOrder = vi.fn();

const renderTab = (o: Overrides = {}) =>
  render(
    <MemoryRouter>
      <AdminOrdersTab
        orders={o.orders ?? orders}
        ordersLoading={o.ordersLoading ?? false}
        ordersTotal={o.ordersTotal ?? 2}
        ordersPage={1}
        setOrdersPage={setOrdersPage}
        orderSearchRaw=""
        setOrderSearchRaw={setOrderSearchRaw}
        orderFilters={o.orderFilters ?? { status: '', date_from: '', date_to: '' }}
        setOrderFilters={setOrderFilters}
        exportLoading={o.exportLoading ?? false}
        handleExport={handleExport}
        setSelectedOrder={setSelectedOrder}
        todayStr="2026-07-18"
        adminService={adminService}
        PAGE_SIZE={20}
      />
    </MemoryRouter>
  );

beforeEach(() => {
  vi.clearAllMocks();
});

describe('AdminOrdersTab', () => {
  it('renders orders with status labels and fallbacks', () => {
    renderTab();
    expect(screen.getByText('Заказ #101')).toBeInTheDocument();
    expect(screen.getByText('Заказ #102')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.getByText('Cafe')).toBeInTheDocument();
    expect(screen.getByText('Клиент')).toBeInTheDocument();
    expect(screen.getByText('WEIRD')).toBeInTheDocument();
  });

  it('shows skeleton when loading and empty', () => {
    renderTab({ orders: [], ordersLoading: true });
    expect(screen.queryByText('Заказ #101')).not.toBeInTheDocument();
    expect(screen.queryByText('Заказов пока нет')).not.toBeInTheDocument();
  });

  it('shows empty state when no orders', () => {
    renderTab({ orders: [], ordersTotal: 0 });
    expect(screen.getByText('Заказов пока нет')).toBeInTheDocument();
  });

  it('updates search and resets page', async () => {
    const user = userEvent.setup();
    renderTab();
    await user.type(screen.getByPlaceholderText('Клиент, телефон или ресторан'), 'q');
    expect(setOrdersPage).toHaveBeenCalledWith(1);
    expect(setOrderSearchRaw).toHaveBeenCalled();
  });

  it('updates date_from filter', async () => {
    const user = userEvent.setup();
    renderTab();
    const dateInputs = screen.getAllByDisplayValue('');
    const dateFrom = dateInputs.find((el) => el.getAttribute('type') === 'date');
    if (!dateFrom) throw new Error('no date input');
    await user.type(dateFrom, '2026-07-01');
    expect(setOrdersPage).toHaveBeenCalledWith(1);
    expect(setOrderFilters).toHaveBeenCalledWith(expect.any(Function));
    const updater = setOrderFilters.mock.calls.at(-1)?.[0] as (p: OrderFilters) => OrderFilters;
    expect(updater({ status: '', date_from: '', date_to: '' })).toHaveProperty('date_from');
  });

  it('updates date_to filter', async () => {
    const user = userEvent.setup();
    const { container } = renderTab();
    const dateInputs = Array.from(container.querySelectorAll('input[type="date"]'));
    expect(dateInputs).toHaveLength(2);
    await user.type(at(dateInputs, 1), '2026-07-10');
    expect(setOrdersPage).toHaveBeenCalledWith(1);
    const updater = setOrderFilters.mock.calls.at(-1)?.[0] as (p: OrderFilters) => OrderFilters;
    expect(updater({ status: '', date_from: '', date_to: '' })).toHaveProperty('date_to');
  });

  it('changes status chip and resets page', async () => {
    const user = userEvent.setup();
    renderTab();
    await user.click(screen.getByRole('button', { name: 'Готовы' }));
    expect(setOrderFilters).toHaveBeenCalled();
    const updater = setOrderFilters.mock.calls[0]?.[0] as (p: OrderFilters) => OrderFilters;
    expect(updater({ status: '', date_from: '', date_to: '' }).status).toBe('READY');
    expect(setOrdersPage).toHaveBeenCalledWith(1);
  });

  it('marks the active status chip', () => {
    renderTab({ orderFilters: { status: 'PENDING', date_from: '', date_to: '' } });
    const chip = screen.getByRole('button', { name: 'Новые' });
    expect(chip.className).toContain('active');
  });

  it('exports orders with filter values applied', async () => {
    const user = userEvent.setup();
    renderTab({ orderFilters: { status: 'READY', date_from: '2026-07-01', date_to: '2026-07-10' } });
    await user.click(screen.getByRole('button', { name: /CSV/i }));
    expect(handleExport).toHaveBeenCalled();
    const exportFn = handleExport.mock.calls[0]?.[0] as () => Promise<Blob>;
    await exportFn();
    expect(exportOrdersCSV).toHaveBeenCalledWith({
      date_from: '2026-07-01',
      date_to: '2026-07-10',
      status: 'READY',
    });
  });

  it('exports with undefined when filters empty', async () => {
    const user = userEvent.setup();
    renderTab();
    await user.click(screen.getByRole('button', { name: /CSV/i }));
    const exportFn = handleExport.mock.calls[0]?.[0] as () => Promise<Blob>;
    await exportFn();
    expect(exportOrdersCSV).toHaveBeenCalledWith({
      date_from: undefined,
      date_to: undefined,
      status: undefined,
    });
  });

  it('disables export while exportLoading', () => {
    renderTab({ exportLoading: true });
    expect(screen.getByRole('button', { name: '...' })).toBeDisabled();
  });

  it('opens an order on card click', async () => {
    const user = userEvent.setup();
    renderTab();
    await user.click(screen.getByText('Заказ #101'));
    expect(setSelectedOrder).toHaveBeenCalledWith(orders[0]);
  });

  it('paginates when multiple pages', async () => {
    const user = userEvent.setup();
    renderTab({ ordersTotal: 60 });
    await user.click(screen.getByRole('button', { name: 'Перейти на страницу 2' }));
    expect(setOrdersPage).toHaveBeenCalledWith(2);
  });
});
