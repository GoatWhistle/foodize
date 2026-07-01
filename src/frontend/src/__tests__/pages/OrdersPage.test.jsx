import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import OrdersPage from '../../pages/orders/OrdersPage';

const mockOrders = [
  { id: 'order-1', display_id: 'order-1', total_price: 500, status: 'PENDING', items: [1] },
  { id: 'order-2', display_id: 'order-2', total_price: 1000, status: 'READY', items: [2] },
];

const defaultLogic = {
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

let mockLogic = { ...defaultLogic };

vi.mock('@shared/hooks/useOrdersPageLogic.js', () => ({
  useOrdersPageLogic: () => mockLogic,
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

describe('OrdersPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLogic = { ...defaultLogic };
  });

  it('renders orders list', () => {
    render(<BrowserRouter><OrdersPage /></BrowserRouter>);

    expect(screen.getByText('Мои заказы')).toBeDefined();
    expect(screen.getByText('500 ₽')).toBeDefined();
    expect(screen.getByText('1000 ₽')).toBeDefined();
  });

  it('navigates to order status page on click', () => {
    render(<BrowserRouter><OrdersPage /></BrowserRouter>);

    const orderCards = screen.getAllByRole('button').filter(
      (el) => el.textContent.includes('₽')
    );
    fireEvent.click(orderCards[0]);
    expect(mockNavigate).toHaveBeenCalledWith(
      expect.stringMatching(/\/orders\/order-[12]/)
    );
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

    expect(screen.getByText('Заказов пока нет')).toBeDefined();
  });
});
