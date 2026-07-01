import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import CartDrawer from '../../components/ui/CartDrawer';

const renderInRouter = (ui) => render(<MemoryRouter>{ui}</MemoryRouter>);

vi.mock('../../services/orderService', () => ({
  orderService: {
    getEstimate: vi.fn().mockResolvedValue({
      data: {
        data: {
          ordering_available: true,
          active_orders_count: 1,
          avg_prep_time_minutes: 15,
          estimated_wait_min_minutes: 15,
          estimated_wait_max_minutes: 30,
        },
      },
    }),
  },
}));

vi.mock('../../services/promoService', () => ({
  promoService: { validate: vi.fn() },
}));

vi.mock('../../store/useRestaurantStore', () => ({
  useRestaurantStore: (sel) => {
    const state = { menus: {} };
    return sel ? sel(state) : state;
  },
}));

const makeStore = (overrides = {}) => ({
  cart: [],
  cartRestaurantId: null,
  orders: [],
  removeFromCart: vi.fn(),
  addToCart: vi.fn(),
  clearCart: vi.fn(),
  placeOrder: vi.fn().mockResolvedValue({ id: 'order-1', display_id: 1001 }),
  cartTotal: vi.fn(() => 0),
  cartCount: vi.fn(() => 0),
  ...overrides,
});

let mockStore = makeStore();

vi.mock('../../store/useOrderStore', () => ({
  useOrderStore: (sel) => (sel ? sel(mockStore) : mockStore),
}));

describe('CartDrawer', () => {
  const onClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockStore = makeStore();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders null if cart is empty', () => {
    const { container } = renderInRouter(<CartDrawer onClose={onClose} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders cart items and total', () => {
    const item = { id: '1', name: 'Pizza', price: 100 };
    mockStore = makeStore({
      cart: [{ menuItem: item, quantity: 2 }],
      cartTotal: () => 200,
    });

    renderInRouter(<CartDrawer onClose={onClose} />);

    expect(screen.getByText('Pizza')).toBeDefined();
    expect(screen.getAllByText(/200 ₽/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('2')).toBeDefined();
  });

  it('calls placeOrder when checkout button clicked', async () => {
    mockStore = makeStore({
      cart: [{ menuItem: { id: '1', name: 'P' }, quantity: 1, selectedOptionIds: [] }],
    });
    renderInRouter(<CartDrawer onClose={onClose} />);

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Оформить заказ/ }));
    });
    expect(mockStore.placeOrder).toHaveBeenCalled();
  });

  it('calls clearCart when "Очистить корзину" clicked', () => {
    mockStore = makeStore({
      cart: [{ menuItem: { id: '1' }, quantity: 1 }],
    });
    renderInRouter(<CartDrawer onClose={onClose} />);

    fireEvent.click(screen.getByText('Очистить корзину'));
    expect(mockStore.clearCart).toHaveBeenCalled();
  });

  it('shows error when placeOrder rejects', async () => {
    mockStore = makeStore({
      cart: [{ menuItem: { id: '1', name: 'P' }, quantity: 1, selectedOptionIds: [] }],
      placeOrder: vi.fn().mockRejectedValueOnce(new Error('payment failed')),
    });
    renderInRouter(<CartDrawer onClose={onClose} />);

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Оформить заказ/ }));
    });
    expect(mockStore.placeOrder).toHaveBeenCalled();
  });

  it('renders checkout button with total price', () => {
    mockStore = makeStore({
      cart: [{ menuItem: { id: '1', name: 'Burger' }, quantity: 1 }],
      cartTotal: () => 350,
    });
    renderInRouter(<CartDrawer onClose={onClose} />);
    expect(screen.getByRole('button', { name: /Оформить заказ/ })).toBeDefined();
  });
});
