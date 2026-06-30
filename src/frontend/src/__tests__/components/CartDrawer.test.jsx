import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import CartDrawer from '../../components/ui/CartDrawer';

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
  promoService: {
    validate: vi.fn(),
  },
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
  removeFromCart: vi.fn(),
  addToCart: vi.fn(),
  clearCart: vi.fn(),
  cartTotal: vi.fn(() => 0),
  cartCount: vi.fn(() => 0),
  ...overrides,
});

let mockStore = makeStore();

vi.mock('../../store/useOrderStore', () => ({
  useOrderStore: (sel) => (sel ? sel(mockStore) : mockStore),
}));

describe('CartDrawer', () => {
  const onCheckout = vi.fn();
  const onClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockStore = makeStore();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders null if cart is empty', () => {
    const { container } = render(
      <CartDrawer onClose={onClose} onCheckout={onCheckout} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders cart items and total', () => {
    const item = { id: '1', name: 'Pizza', price: 100 };
    mockStore = makeStore({
      cart: [{ menuItem: item, quantity: 2 }],
      cartTotal: () => 200,
    });

    render(<CartDrawer onClose={onClose} onCheckout={onCheckout} />);

    expect(screen.getByText('Pizza')).toBeDefined();
    expect(screen.getAllByText(/200 ₽/).length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText('2')).toBeDefined();
  });

  it('calls onCheckout when button clicked', () => {
    mockStore = makeStore({
      cart: [{ menuItem: { id: '1', name: 'P' }, quantity: 1 }],
    });
    render(<CartDrawer onClose={onClose} onCheckout={onCheckout} />);

    fireEvent.click(screen.getByText('Оформить заказ'));
    expect(onCheckout).toHaveBeenCalled();
  });

  it('passes scheduled pickup time to checkout', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-21T09:00:00.000Z'));
    mockStore = makeStore({
      cart: [{ menuItem: { id: '1', name: 'P' }, quantity: 1 }],
      cartRestaurantId: 'rest-1',
    });
    render(<CartDrawer onClose={onClose} onCheckout={onCheckout} />);

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Ко времени/ }));
    });
    await act(async () => {
      fireEvent.change(screen.getByDisplayValue('2026-05-21T12:15'), {
        target: { value: '2026-05-21T13:30' },
      });
    });
    await act(async () => {
      fireEvent.click(screen.getByText('Оформить заказ'));
    });

    expect(onCheckout).toHaveBeenCalledWith(
      null,
      '',
      '2026-05-21T10:30:00.000Z'
    );
  });

  it('calls clearCart when cleared', () => {
    mockStore = makeStore({
      cart: [{ menuItem: { id: '1' }, quantity: 1 }],
    });
    render(<CartDrawer onClose={onClose} onCheckout={onCheckout} />);

    fireEvent.click(screen.getByText('Очистить корзину'));
    expect(mockStore.clearCart).toHaveBeenCalled();
  });

  it('shows error when onCheckout rejects', async () => {
    const failingCheckout = vi.fn().mockRejectedValueOnce(new Error('payment failed'));
    mockStore = makeStore({
      cart: [{ menuItem: { id: '1', name: 'P' }, quantity: 1 }],
    });
    render(<CartDrawer onClose={onClose} onCheckout={failingCheckout} />);

    await act(async () => {
      fireEvent.click(screen.getByText('Оформить заказ'));
    });

    expect(failingCheckout).toHaveBeenCalled();
  });
});
