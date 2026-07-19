import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import type { Order } from '@shared/types/models';
import { OrdersPage } from '../../pages/orders/OrdersPage';
type OrdersLogic = {
  visibleOrders: Order[];
  allOrders: Order[];
  ordersTotal: number;
  totalPages: number;
  ordersLoading: boolean;
  ordersError: string | null;
  statusFilter: string;
  setStatusFilter: ReturnType<typeof vi.fn>;
  page: number;
  setPage: ReturnType<typeof vi.fn>;
  hasMore: boolean;
  sentinelRef: { current: HTMLElement | null };
  refresh: ReturnType<typeof vi.fn>;
};

const mockOrders = [
  { id: 'order-1', display_id: 'order-1', total_price: 500, status: 'PENDING', items: [1] },
  { id: 'order-2', display_id: 'order-2', total_price: 1000, status: 'READY', items: [2] },
] as unknown as Order[];

const defaultLogic: OrdersLogic = {
  visibleOrders: mockOrders,
  allOrders: mockOrders,
  ordersTotal: 2,
  totalPages: 1,
  ordersLoading: false,
  ordersError: null,
  statusFilter: '',
  setStatusFilter: vi.fn(),
  page: 1,
  setPage: vi.fn(),
  hasMore: false,
  sentinelRef: { current: null },
  refresh: vi.fn(),
};

let mockLogic: OrdersLogic = { ...defaultLogic };

vi.mock('@shared/hooks/useOrdersPageLogic.js', () => ({
  useOrdersPageLogic: () => mockLogic,
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

describe('OrdersPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLogic = { ...defaultLogic };
  });

  it('renders orders list', () => {
    render(<BrowserRouter><OrdersPage /></BrowserRouter>);

    expect(screen.getByText('Мои заказы')).toBeInTheDocument();
    expect(screen.getByText('500 ₽')).toBeInTheDocument();
    expect(screen.getByText('1000 ₽')).toBeInTheDocument();
  });

  it('navigates to order status page on click', async () => {
    const user = userEvent.setup();
    render(<BrowserRouter><OrdersPage /></BrowserRouter>);

    await user.click(screen.getByRole('button', { name: 'Заказ #order-1' }));
    expect(mockNavigate).toHaveBeenCalledWith('/orders/order-1');
  });

  it('shows empty state if no active orders', () => {
    mockLogic = {
      ...defaultLogic,
      visibleOrders: [],
      allOrders: [],
      ordersTotal: 0,
      totalPages: 0,
    };

    render(<BrowserRouter><OrdersPage /></BrowserRouter>);

    expect(screen.getByText('Заказов пока нет')).toBeInTheDocument();
  });
});
