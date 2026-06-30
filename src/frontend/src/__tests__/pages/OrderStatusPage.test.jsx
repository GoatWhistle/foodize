import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import OrderStatusPage from '../../pages/orders/OrderStatusPage';
import { useOrderStore } from '../../store/useOrderStore';
import { orderService } from '../../services/orderService';

vi.mock('../../store/useOrderStore', () => ({
  useOrderStore: vi.fn(),
}));

vi.mock('../../services/orderService', () => ({
  orderService: {
    getOrderEvents: vi.fn().mockResolvedValue({ data: [] }),
    completeOrder: vi.fn().mockResolvedValue({}),
    cancelOrder: vi.fn().mockResolvedValue({}),
  },
}));

vi.mock('../../services/api', () => ({
  createOrderWebSocket: vi.fn(() => ({ close: vi.fn() })),
  default: {},
}));

describe('OrderStatusPage', () => {
  const fetchOrderMock = vi.fn();

  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    const state = {
      fetchOrder: fetchOrderMock,
      currentOrder: {
        id: 'ord-1',
        status: 'PENDING',
        total_price: 500,
        items: [
          {
            id: 'i1',
            quantity: 1,
            menu_item_id: 'm1',
            menu_item_name: 'Бургер',
            menu_item_category: 'BURGER',
            price_at_purchase: 500,
          },
        ],
      },
    };

    vi.mocked(useOrderStore).mockImplementation((sel) => {
      return sel ? sel(state) : state;
    });
    useOrderStore.getState = vi.fn(() => state);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const renderWithRouter = () => {
    return render(
      <MemoryRouter initialEntries={['/orders/ord-1']}>
        <Routes>
          <Route path="/orders/:id" element={<OrderStatusPage />} />
        </Routes>
      </MemoryRouter>
    );
  };

  it('renders order details and initial status', () => {
    renderWithRouter();

    expect(screen.getAllByText('Принят').length).toBeGreaterThan(0);
    expect(screen.getAllByText(/500 ₽/)).toHaveLength(2);
    expect(screen.getByText('Бургер')).toBeDefined();
  });

  it('fetches the order on mount', async () => {
    renderWithRouter();

    expect(fetchOrderMock).toHaveBeenCalledTimes(1);
  });

  it('renders skeleton when currentOrder is null', () => {
    vi.mocked(useOrderStore).mockImplementation((sel) => {
      const state = { fetchOrder: fetchOrderMock, currentOrder: null };
      return sel ? sel(state) : state;
    });
    useOrderStore.getState = vi.fn(() => ({ currentOrder: null }));

    renderWithRouter();

    const skeletons = document.querySelectorAll('.skeleton');
    expect(skeletons.length).toBeGreaterThan(0);
    expect(screen.queryByText('Состав заказа')).toBeNull();
  });

  it('shows CANCELLED status pill and cancel reason', () => {
    const cancelledState = {
      fetchOrder: fetchOrderMock,
      currentOrder: {
        id: 'ord-2',
        status: 'CANCELLED',
        display_id: '42',
        total_price: 500,
        cancellation_reason: 'Ресторан закрыт',
        items: [],
      },
    };
    vi.mocked(useOrderStore).mockImplementation((sel) => {
      return sel ? sel(cancelledState) : cancelledState;
    });
    useOrderStore.getState = vi.fn(() => cancelledState);

    renderWithRouter();

    expect(screen.getByText('Отменён')).toBeDefined();
    expect(screen.getByText('Ресторан закрыт')).toBeDefined();
    expect(screen.queryByText('Отменить')).toBeNull();
  });

  it('shows repeat order button when order is COMPLETED', () => {
    const completedState = {
      fetchOrder: fetchOrderMock,
      currentOrder: {
        id: 'ord-3',
        status: 'COMPLETED',
        display_id: '43',
        total_price: 300,
        items: [{ id: 'i1', quantity: 1, menu_item_name: 'Пицца', price_at_purchase: 300 }],
      },
    };
    vi.mocked(useOrderStore).mockImplementation((sel) => {
      return sel ? sel(completedState) : completedState;
    });
    useOrderStore.getState = vi.fn(() => ({
      ...completedState,
      repeatOrder: vi.fn().mockResolvedValue(undefined),
    }));

    renderWithRouter();

    expect(screen.getByText('Выдан')).toBeDefined();
    expect(screen.getByRole('button', { name: 'Повторить заказ' })).toBeDefined();
    expect(screen.queryByText('Отменить')).toBeNull();
  });

  it('stops polling when status is ready', async () => {
    // Return ready on the next poll
    fetchOrderMock.mockResolvedValue({ status: 'READY' });

    renderWithRouter();

    // 1st call on mount (pending)
    // 2nd call after 5s (ready)
    await act(async () => {
      vi.advanceTimersByTime(5000);
      // Wait for the async callback to finish
      await Promise.resolve();
      await Promise.resolve();
    });

    const callsAfterReady = fetchOrderMock.mock.calls.length;
    expect(callsAfterReady).toBeGreaterThanOrEqual(1);

    await act(async () => {
      vi.advanceTimersByTime(6000);
      await Promise.resolve();
    });

    // Should not have increased further
    expect(fetchOrderMock.mock.calls.length).toBe(callsAfterReady);
  });
});
