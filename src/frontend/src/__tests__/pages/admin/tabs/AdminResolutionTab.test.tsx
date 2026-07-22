import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect } from 'vitest';
import { AdminResolutionTab } from '../../../../pages/admin/tabs/AdminResolutionTab';
import type { Order } from '@shared/types/models';
import type { OrderFilters } from '../../../../pages/admin/hooks/useAdminOrders';
import type { ReasonDialogConfig } from '../../../../pages/admin/useAdminDashboard';
import type { adminService as adminServiceType } from '../../../../services/adminService';
import { t } from '@shared/i18n/useTranslation';
import { at } from '../../../testUtils';

const makeOrder = (over: Partial<Order> = {}): Order =>
  ({
    id: 'o1',
    display_id: 42,
    status: 'PENDING',
    total_price: 500,
    customer_name: 'Иван',
    customer_phone: '+79990001122',
    restaurant_name: 'Пицца',
    ...over,
  }) as unknown as Order;

const forceCancelOrder = vi.fn(() => Promise.resolve());
const adminService = { forceCancelOrder } as unknown as typeof adminServiceType;

const baseProps = (over: Partial<Parameters<typeof AdminResolutionTab>[0]> = {}) => ({
  orders: [makeOrder()],
  ordersLoading: false,
  ordersTotal: 1,
  ordersPage: 1,
  setOrdersPage: vi.fn(),
  orderSearchRaw: '',
  setOrderSearchRaw: vi.fn(),
  orderFilters: { status: '', date_from: '', date_to: '' },
  setOrderFilters: vi.fn(),
  setSelectedOrder: vi.fn(),
  setReasonDialog: vi.fn(),
  setActionError: vi.fn(),
  adminService,
  PAGE_SIZE: 20,
  ...over,
});

describe('AdminResolutionTab', () => {
  it('shows skeleton while loading empty', () => {
    render(<AdminResolutionTab {...baseProps({ orders: [], ordersLoading: true })} />);
    expect(screen.queryByText(t('admin.resolution.emptyTitle'))).not.toBeInTheDocument();
    expect(screen.queryByText(t('admin.resolution.title'))).not.toBeInTheDocument();
  });

  it('renders orders and header', () => {
    render(<AdminResolutionTab {...baseProps()} />);
    expect(screen.getByText(t('admin.resolution.title'))).toBeInTheDocument();
    expect(
      screen.getByText(t('admin.resolution.orderTitle', { displayId: 42 })),
    ).toBeInTheDocument();
    expect(screen.getByText('500 ₽')).toBeInTheDocument();
    expect(screen.getByText('Иван')).toBeInTheDocument();
  });

  it('renders unknown status fallback and no phone/restaurant', () => {
    render(
      <AdminResolutionTab
        {...baseProps({
          orders: [
            makeOrder({
              status: 'WEIRD' as Order['status'],
              customer_name: '',
              customer_phone: '',
              restaurant_name: '',
            }),
          ],
        })}
      />,
    );
    expect(screen.getByText('WEIRD')).toBeInTheDocument();
    expect(screen.getByText(t('admin.resolution.customerFallback'))).toBeInTheDocument();
  });

  it('renders empty state', () => {
    render(<AdminResolutionTab {...baseProps({ orders: [] })} />);
    expect(screen.getByText(t('admin.resolution.emptyTitle'))).toBeInTheDocument();
  });

  it('opens details', async () => {
    const setSelectedOrder = vi.fn();
    const order = makeOrder();
    render(<AdminResolutionTab {...baseProps({ orders: [order], setSelectedOrder })} />);
    await userEvent.click(screen.getByRole('button', { name: t('admin.resolution.details') }));
    expect(setSelectedOrder).toHaveBeenCalledWith(order);
  });

  it('updates search and status filters resetting page', async () => {
    const setOrderSearchRaw = vi.fn();
    const setOrdersPage = vi.fn();
    const onFilters = vi.fn();
    const Harness = () => {
      const [filters, setFilters] = useState<OrderFilters>({ status: '', date_from: '', date_to: '' });
      return (
        <AdminResolutionTab
          {...baseProps({ setOrderSearchRaw, setOrdersPage })}
          orderFilters={filters}
          setOrderFilters={(u) => {
            setFilters((prev) => {
              const next = typeof u === 'function' ? u(prev) : u;
              onFilters(next);
              return next;
            });
          }}
        />
      );
    };
    render(<Harness />);
    await userEvent.type(screen.getByPlaceholderText(t('admin.resolution.searchPlaceholder')), 'x');
    expect(setOrdersPage).toHaveBeenCalledWith(1);
    expect(setOrderSearchRaw).toHaveBeenCalledWith('x');
    await userEvent.selectOptions(screen.getByRole('combobox'), 'PENDING');
    expect(onFilters).toHaveBeenLastCalledWith(expect.objectContaining({ status: 'PENDING' }));
  });

  it('opens force-cancel reason dialog and cancels successfully', async () => {
    const setReasonDialog = vi.fn();
    const setOrdersPage = vi.fn();
    render(<AdminResolutionTab {...baseProps({ setReasonDialog, setOrdersPage })} />);
    await userEvent.click(screen.getByRole('button', { name: t('admin.resolution.forceCancel') }));
    const cfg = at(setReasonDialog.mock.calls, 0)[0] as ReasonDialogConfig;
    expect(cfg.title).toBe(t('admin.resolution.dialogs.forceCancelTitle'));
    await cfg.onConfirm('дубликат');
    expect(forceCancelOrder).toHaveBeenCalledWith('o1', 'дубликат');
    expect(setOrdersPage).toHaveBeenCalledWith(1);
  });

  it('surfaces error when force-cancel fails', async () => {
    forceCancelOrder.mockRejectedValueOnce(new Error('nope'));
    const setReasonDialog = vi.fn();
    const setActionError = vi.fn();
    render(<AdminResolutionTab {...baseProps({ setReasonDialog, setActionError })} />);
    await userEvent.click(screen.getByRole('button', { name: t('admin.resolution.forceCancel') }));
    const cfg = at(setReasonDialog.mock.calls, 0)[0] as ReasonDialogConfig;
    await cfg.onConfirm('r');
    expect(setActionError).toHaveBeenCalled();
  });

  it('hides cancel button for already cancelled order', () => {
    render(<AdminResolutionTab {...baseProps({ orders: [makeOrder({ status: 'CANCELLED' })] })} />);
    expect(screen.queryByRole('button', { name: t('admin.resolution.forceCancel') })).not.toBeInTheDocument();
  });
});
