import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import CartDrawer from '../../components/ui/CartDrawer';
import { useOrderStore } from '../../store/useOrderStore';

// Mock useOrderStore
vi.mock('../../store/useOrderStore', () => {
  const store = {
    cart: [],
    cartRestaurantId: null,
    removeFromCart: vi.fn(),
    addToCart: vi.fn(),
    clearCart: vi.fn(),
    cartTotal: vi.fn(() => 0),
    cartCount: vi.fn(() => 0),
  };
  const useStore = (sel) => (sel ? sel(store) : store);
  useStore.getState = () => store;
  return { useOrderStore: useStore };
});

describe('CartDrawer', () => {
  const onCheckout = vi.fn();
  const onClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders null if cart is empty', () => {
    const { container } = render(
      <CartDrawer onClose={onClose} onCheckout={onCheckout} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders cart items and total', () => {
    const item = { id: '1', name: 'Pizza', price: 100 };
    useOrderStore.getState().cart = [{ menuItem: item, quantity: 2 }];
    useOrderStore.getState().cartTotal = () => 200;

    render(<CartDrawer onClose={onClose} onCheckout={onCheckout} />);

    expect(screen.getByText('Pizza')).toBeDefined();
    expect(screen.getAllByText(/200 ₽/)).toHaveLength(2);
    expect(screen.getByText('2')).toBeDefined();
  });

  it('calls onCheckout when button clicked', () => {
    useOrderStore.getState().cart = [
      { menuItem: { id: '1', name: 'P' }, quantity: 1 },
    ];
    render(<CartDrawer onClose={onClose} onCheckout={onCheckout} />);

    fireEvent.click(screen.getByText('Оформить заказ'));
    expect(onCheckout).toHaveBeenCalled();
  });

  it('calls clearCart when cleared', () => {
    useOrderStore.getState().cart = [{ menuItem: { id: '1' }, quantity: 1 }];
    render(<CartDrawer onClose={onClose} onCheckout={onCheckout} />);

    fireEvent.click(screen.getByText('Очистить корзину'));
    expect(useOrderStore.getState().clearCart).toHaveBeenCalled();
  });
});
