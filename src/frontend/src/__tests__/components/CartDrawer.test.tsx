import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { CartDrawer } from '@shared/components/CartDrawer/CartDrawer';
import { t } from '@shared/i18n/useTranslation';
import { formatPrice } from '@shared/utils/price';
const renderInRouter = (ui: ReactNode) => render(<MemoryRouter>{ui}</MemoryRouter>);

type RestaurantState = { menus: Record<string, unknown> };

vi.mock('@shared/services/orderService.js', () => ({
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

vi.mock('@shared/services/promoService.js', () => ({
  promoService: { validate: vi.fn() },
}));

vi.mock('@shared/store/useRestaurantStore.js', () => ({
  useRestaurantStore: (sel?: (s: RestaurantState) => unknown) => {
    const state: RestaurantState = { menus: {} };
    return sel ? sel(state) : state;
  },
}));

const makeStore = (overrides: Record<string, unknown> = {}) => ({
  cart: [],
  cartRestaurantId: null,
  removeFromCart: vi.fn(),
  addToCart: vi.fn(),
  clearCart: vi.fn(),
  placeOrder: vi.fn().mockResolvedValue({ id: 'order-1', display_id: 1001 }),
  cartTotal: vi.fn(() => 0),
  cartCount: vi.fn(() => 0),
  ...overrides,
});

type MockStore = ReturnType<typeof makeStore>;

let mockStore = makeStore();

const ordersStore = { orders: [] as unknown[] };

vi.mock('@shared/store/useCartStore.instance', () => ({
  useCartStore: (sel?: (s: MockStore) => unknown) => (sel ? sel(mockStore) : mockStore),
}));

vi.mock('@shared/store/useOrdersStore.instance', () => ({
  useOrdersStore: (sel?: (s: typeof ordersStore) => unknown) =>
    sel ? sel(ordersStore) : ordersStore,
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
      cart: [{ menuItem: item, quantity: 2, selectedOptionIds: [], selectedOptions: [] }],
      cartTotal: () => 200,
    });

    renderInRouter(<CartDrawer onClose={onClose} />);

    expect(screen.getByText('Pizza')).toBeInTheDocument();
    expect(screen.getAllByText(/200 ₽/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('calls placeOrder when checkout button clicked', async () => {
    mockStore = makeStore({
      cart: [{ menuItem: { id: '1', name: 'P' }, quantity: 1, selectedOptionIds: [], selectedOptions: [] }],
    });
    const user = userEvent.setup();
    renderInRouter(<CartDrawer onClose={onClose} />);

    await user.click(screen.getByRole('button', { name: t('order.checkout.submit', { total: formatPrice(0) }) }));
    expect(mockStore.placeOrder).toHaveBeenCalled();
  });

  it('calls clearCart when "Очистить корзину" clicked', async () => {
    const user = userEvent.setup();
    mockStore = makeStore({
      cart: [{ menuItem: { id: '1' }, quantity: 1, selectedOptionIds: [], selectedOptions: [] }],
    });
    renderInRouter(<CartDrawer onClose={onClose} />);

    await user.click(screen.getByText(t('order.cart.clear')));
    expect(mockStore.clearCart).toHaveBeenCalled();
  });

  it('shows error when placeOrder rejects', async () => {
    mockStore = makeStore({
      cart: [{ menuItem: { id: '1', name: 'P' }, quantity: 1, selectedOptionIds: [], selectedOptions: [] }],
      placeOrder: vi.fn().mockRejectedValueOnce(new Error('payment failed')),
    });
    const user = userEvent.setup();
    renderInRouter(<CartDrawer onClose={onClose} />);

    await user.click(screen.getByRole('button', { name: t('order.checkout.submit', { total: formatPrice(0) }) }));
    expect(mockStore.placeOrder).toHaveBeenCalled();
    expect(await screen.findByText(t('order.checkout.failed'))).toBeInTheDocument();
  });

  it('renders checkout button with total price', () => {
    mockStore = makeStore({
      cart: [{ menuItem: { id: '1', name: 'Burger' }, quantity: 1, selectedOptionIds: [], selectedOptions: [] }],
      cartTotal: () => 350,
    });
    renderInRouter(<CartDrawer onClose={onClose} />);
    expect(screen.getByRole('button', { name: t('order.checkout.submit', { total: formatPrice(350) }) })).toBeInTheDocument();
  });
});
