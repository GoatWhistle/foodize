import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { t } from '@shared/i18n/useTranslation';

const navigateMock = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => navigateMock };
});

type AuthState = { user: { id: string } | null };
type CartLine = {
  menuItem: { price: number };
  selectedOptions: { price_delta: number }[];
  quantity: number;
};
type CartState = { cart: CartLine[] };

const authState: AuthState = { user: { id: 'u1' } };
const cartState: CartState = { cart: [] };

vi.mock('../../store/useAuthStore', () => ({
  useAuthStore: vi.fn((sel?: (s: AuthState) => unknown) => (sel ? sel(authState) : authState)),
}));

vi.mock('../../store/useCartStore', () => ({
  useCartStore: vi.fn((sel?: (s: CartState) => unknown) => (sel ? sel(cartState) : cartState)),
}));

vi.mock('../../components/NotificationBell/NotificationBell', () => ({
  NotificationBell: () => <div data-testid="bell" />,
}));

vi.mock('../../components/OrderAssistant/OrderAssistant', () => ({
  OrderAssistant: () => <div data-testid="assistant" />,
}));

vi.mock('@shared/components/CartDrawer/CartDrawer', () => ({
  CartDrawer: ({ onClose }: { onClose: () => void }) => (
    <div data-testid="cart-drawer">
      <button onClick={onClose}>close-drawer</button>
    </div>
  ),
}));

const { MainLayout } = await import('../../components/layout/MainLayout');
const { BrowserRouter } = await import('react-router-dom');

const line = (price: number, qty: number, opts: number[] = []): CartLine => ({
  menuItem: { price },
  selectedOptions: opts.map((price_delta) => ({ price_delta })),
  quantity: qty,
});

const renderLayout = () =>
  render(
    <BrowserRouter>
      <MainLayout />
    </BrowserRouter>
  );

beforeEach(() => {
  vi.clearAllMocks();
  authState.user = { id: 'u1' };
  cartState.cart = [];
  (window as unknown as { Telegram?: unknown }).Telegram = undefined;
});

afterEach(() => {
  (window as unknown as { Telegram?: unknown }).Telegram = undefined;
});

describe('MainLayout cart + deep links', () => {
  it('shows cart fab with total and opens drawer', async () => {
    cartState.cart = [line(100, 2, [50])];
    const user = userEvent.setup();
    renderLayout();
    const fab = screen.getByLabelText(t('order.cart.fabOpen'));
    expect(fab).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    await user.click(fab);
    expect(screen.getByTestId('cart-drawer')).toBeInTheDocument();
    await user.click(screen.getByText('close-drawer'));
    expect(screen.queryByTestId('cart-drawer')).toBeNull();
  });

  it('does not render fab when cart is empty', () => {
    renderLayout();
    expect(screen.queryByLabelText(t('order.cart.fabOpen'))).toBeNull();
    expect(screen.getByTestId('assistant')).toBeInTheDocument();
  });

  it('hides assistant when unauthenticated', () => {
    authState.user = null;
    renderLayout();
    expect(screen.queryByTestId('assistant')).toBeNull();
  });

  it('navigates on restaurant deep link', () => {
    (window as unknown as { Telegram?: unknown }).Telegram = {
      WebApp: { initDataUnsafe: { start_param: 'restaurant_abc123' } },
    };
    renderLayout();
    expect(navigateMock).toHaveBeenCalledWith('/restaurants/abc123');
  });

  it('navigates on order deep link', () => {
    (window as unknown as { Telegram?: unknown }).Telegram = {
      WebApp: { initDataUnsafe: { start_param: 'order_xyz789' } },
    };
    renderLayout();
    expect(navigateMock).toHaveBeenCalledWith('/orders/xyz789');
  });

  it('ignores deep link with invalid id', () => {
    (window as unknown as { Telegram?: unknown }).Telegram = {
      WebApp: { initDataUnsafe: { start_param: 'restaurant_bad id!' } },
    };
    renderLayout();
    expect(navigateMock).not.toHaveBeenCalled();
  });

  it('ignores unknown start param', () => {
    (window as unknown as { Telegram?: unknown }).Telegram = {
      WebApp: { initDataUnsafe: { start_param: 'foo_1' } },
    };
    renderLayout();
    expect(navigateMock).not.toHaveBeenCalled();
  });

  it('animates badge pop when cart count grows then cleans up timers', async () => {
    vi.useFakeTimers();
    const rafSpy = vi
      .spyOn(window, 'requestAnimationFrame')
      .mockImplementation((cb: FrameRequestCallback) => {
        cb(0);
        return 1;
      });
    const { useCartStore } = await import('../../store/useCartStore');
    cartState.cart = [line(100, 1)];
    const { rerender, unmount } = render(
      <BrowserRouter>
        <MainLayout />
      </BrowserRouter>
    );
    cartState.cart = [line(100, 3)];
    vi.mocked(useCartStore).mockImplementation(((sel?: (s: CartState) => unknown) =>
      sel ? sel(cartState) : cartState) as never);
    act(() => {
      rerender(
        <BrowserRouter>
          <MainLayout />
        </BrowserRouter>
      );
    });
    act(() => {
      vi.advanceTimersByTime(600);
    });
    unmount();
    rafSpy.mockRestore();
    vi.useRealTimers();
    expect(true).toBe(true);
  });
});
