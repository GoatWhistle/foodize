import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import type { Order } from '@shared/types/models';
import OrderStatusPage from '../../pages/orders/OrderStatusPage';
import { useOrdersStore } from '../../store/useOrdersStore';

type StoreState = {
  fetchOrder: ReturnType<typeof vi.fn>;
  currentOrder: Order | null;
};
type StoreSelector = (s: StoreState) => unknown;

vi.mock('../../store/useOrdersStore', () => ({
  useOrdersStore: vi.fn(),
}));

vi.mock('../../store/useCartStore', () => ({
  useCartStore: Object.assign(vi.fn(), {
    getState: vi.fn(() => ({ repeatOrder: vi.fn().mockResolvedValue(undefined) })),
  }),
}));

vi.mock('@shared/services/orderService.js', () => ({
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
  const fetchOrderMock = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    const state: StoreState = {
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
            selected_options: [],
          },
        ],
      } as unknown as Order,
    };

    vi.mocked(useOrdersStore).mockImplementation(((sel?: StoreSelector) => {
      return sel ? sel(state) : state;
    }) as typeof useOrdersStore);
    (useOrdersStore as unknown as { getState: unknown }).getState = vi.fn(() => state);
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

  it('fetches the order on mount', () => {
    renderWithRouter();

    expect(fetchOrderMock).toHaveBeenCalledTimes(1);
  });

  it('renders skeleton when currentOrder is null', () => {
    vi.mocked(useOrdersStore).mockImplementation(((sel?: StoreSelector) => {
      const state: StoreState = { fetchOrder: fetchOrderMock, currentOrder: null };
      return sel ? sel(state) : state;
    }) as typeof useOrdersStore);
    (useOrdersStore as unknown as { getState: unknown }).getState = vi.fn(() => ({ currentOrder: null }));

    renderWithRouter();

    const skeletons = document.querySelectorAll('.skeleton');
    expect(skeletons.length).toBeGreaterThan(0);
    expect(screen.queryByText('Состав заказа')).toBeNull();
  });

  it('shows CANCELLED status pill and cancel reason', () => {
    const cancelledState: StoreState = {
      fetchOrder: fetchOrderMock,
      currentOrder: {
        id: 'ord-2',
        status: 'CANCELLED',
        display_id: '42',
        total_price: 500,
        cancellation_reason: 'Ресторан закрыт',
        items: [],
      } as unknown as Order,
    };
    vi.mocked(useOrdersStore).mockImplementation(((sel?: StoreSelector) => {
      return sel ? sel(cancelledState) : cancelledState;
    }) as typeof useOrdersStore);
    (useOrdersStore as unknown as { getState: unknown }).getState = vi.fn(() => cancelledState);

    renderWithRouter();

    expect(screen.getByText('Отменён')).toBeDefined();
    expect(screen.getByText('Ресторан закрыт')).toBeDefined();
    expect(screen.queryByText('Отменить')).toBeNull();
  });

  it('shows repeat order button when order is COMPLETED', () => {
    const completedState: StoreState = {
      fetchOrder: fetchOrderMock,
      currentOrder: {
        id: 'ord-3',
        status: 'COMPLETED',
        display_id: '43',
        total_price: 300,
        items: [{ id: 'i1', quantity: 1, menu_item_name: 'Пицца', price_at_purchase: 300, selected_options: [] }],
      } as unknown as Order,
    };
    vi.mocked(useOrdersStore).mockImplementation(((sel?: StoreSelector) => {
      return sel ? sel(completedState) : completedState;
    }) as typeof useOrdersStore);
    (useOrdersStore as unknown as { getState: unknown }).getState = vi.fn(() => completedState);

    renderWithRouter();

    expect(screen.getAllByText('Выдан').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByRole('button', { name: 'Повторить заказ' })).toBeDefined();
    expect(screen.queryByText('Отменить')).toBeNull();
  });

  it('stops polling when status is ready', async () => {
    fetchOrderMock.mockResolvedValue({ status: 'READY' });

    renderWithRouter();

    await act(async () => {
      vi.advanceTimersByTime(5000);
      await Promise.resolve();
      await Promise.resolve();
    });

    const callsAfterReady = fetchOrderMock.mock.calls.length;
    expect(callsAfterReady).toBeGreaterThanOrEqual(1);

    await act(async () => {
      vi.advanceTimersByTime(6000);
      await Promise.resolve();
    });

    expect(fetchOrderMock.mock.calls.length).toBe(callsAfterReady);
  });
});
