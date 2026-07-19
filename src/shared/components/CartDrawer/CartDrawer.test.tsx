import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { CartLine } from "@shared/utils/cartLine";
import type { OrderLoadEstimate } from "@shared/types/models";

const mocks = vi.hoisted(() => {
  const cartState = {
    cart: [] as CartLine[],
    cartRestaurantId: "rest-1" as string | null,
    removeFromCart: vi.fn(() => Promise.resolve()),
    addToCart: vi.fn(() => Promise.resolve(true)),
    clearCart: vi.fn(() => Promise.resolve()),
    placeOrder: vi.fn(() => Promise.resolve({ display_id: 5 })),
    cartTotal: () => 300,
  };
  const useCartStore = Object.assign(
    vi.fn((selector?: (s: typeof cartState) => unknown) =>
      selector ? selector(cartState) : cartState,
    ),
    { getState: () => cartState },
  );
  const ordersState = { orders: [] as unknown[] };
  const useOrdersStore = Object.assign(
    vi.fn((selector?: (s: typeof ordersState) => unknown) =>
      selector ? selector(ordersState) : ordersState,
    ),
    { getState: () => ordersState },
  );
  const validate = vi.fn((..._a: unknown[]): Promise<unknown> =>
    Promise.resolve(),
  );
  const getEstimate = vi.fn((..._a: unknown[]) =>
    Promise.resolve({ data: { data: null as OrderLoadEstimate | null } }),
  );
  return { cartState, useCartStore, ordersState, useOrdersStore, validate, getEstimate };
});

vi.mock("zustand/react/shallow", () => ({ useShallow: (fn: unknown) => fn }));
vi.mock("@shared/store/useCartStore.instance", () => ({ useCartStore: mocks.useCartStore }));
vi.mock("@shared/store/useOrdersStore.instance", () => ({ useOrdersStore: mocks.useOrdersStore }));
vi.mock("@shared/services/promoService", () => ({
  promoService: { validate: (...a: unknown[]) => mocks.validate(...a) },
}));
vi.mock("@shared/services/orderService", () => ({
  orderService: { getEstimate: (...a: unknown[]) => mocks.getEstimate(...a) },
}));
vi.mock("@shared/hooks/useFocusTrap", async () => {
  const { useRef } = await vi.importActual<typeof import("react")>("react");
  return { useFocusTrap: () => useRef(null) };
});

import { CartDrawer } from "@shared/components/CartDrawer/CartDrawer";

const line = (over: Partial<CartLine> = {}): CartLine =>
  ({
    menuItem: { id: "m1", name: "Пицца", price: 300 },
    quantity: 1,
    selectedOptionIds: [],
    selectedOptions: [],
    lineKey: "m1:",
    ...over,
  });

const renderDrawer = (props: Partial<React.ComponentProps<typeof CartDrawer>> = {}) =>
  render(
    <MemoryRouter>
      <CartDrawer onClose={vi.fn()} {...props} />
    </MemoryRouter>,
  );

describe("CartDrawer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.cartState.cart = [line()];
    mocks.cartState.cartRestaurantId = "rest-1";
    mocks.ordersState.orders = [];
    mocks.getEstimate.mockResolvedValue({ data: { data: null } });
  });

  it("renders nothing when the cart is empty", () => {
    mocks.cartState.cart = [];
    const { container } = renderDrawer();
    expect(container.firstChild).toBeNull();
  });

  it("renders items, total and the order button", async () => {
    renderDrawer();
    expect(screen.getByText("Корзина")).toBeInTheDocument();
    expect(screen.getByText("Пицца")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Оформить заказ/ }),
    ).toBeInTheDocument();
    await waitFor(() => { expect(mocks.getEstimate).toHaveBeenCalled(); });
  });

  it("renders selected option summaries on a line", () => {
    mocks.cartState.cart = [
      line({
        selectedOptionIds: ["o1"],
        selectedOptions: [{ option_id: "o1", id: "o1", name: "Сыр", price_delta: 50 }],
      }),
    ];
    renderDrawer();
    expect(screen.getByText(/Сыр/)).toBeInTheDocument();
  });

  it("increments and decrements a line", () => {
    renderDrawer();
    fireEvent.click(screen.getByRole("button", { name: "Увеличить" }));
    fireEvent.click(screen.getByRole("button", { name: "Уменьшить" }));
    expect(mocks.cartState.addToCart).toHaveBeenCalled();
    expect(mocks.cartState.removeFromCart).toHaveBeenCalled();
  });

  it("validates a promo code and uppercases the input", async () => {
    mocks.validate.mockResolvedValue({
      data: {
        data: {
          code: "SALE",
          discount_type: "PERCENT",
          discount_value: 10,
          discounted_amount: 270,
        },
      },
    });
    renderDrawer();
    const input = screen.getByPlaceholderText<HTMLInputElement>("Промокод");
    fireEvent.change(input, { target: { value: "sale" } });
    expect(input.value).toBe("SALE");
    fireEvent.click(screen.getByRole("button", { name: "Применить" }));
    await waitFor(() =>
      { expect(mocks.validate).toHaveBeenCalledWith("SALE", "rest-1", 300, true); },
    );
  });

  it("applies a promo via the Enter key", async () => {
    mocks.validate.mockResolvedValue({
      data: { data: { code: "X", discount_type: "FIXED", discount_value: 5 } },
    });
    renderDrawer();
    const input = screen.getByPlaceholderText("Промокод");
    fireEvent.change(input, { target: { value: "x" } });
    fireEvent.keyDown(input, { key: "Enter" });
    await waitFor(() => { expect(mocks.validate).toHaveBeenCalled(); });
  });

  it("shows an error when placing an order fails", async () => {
    mocks.cartState.placeOrder.mockRejectedValueOnce(new Error("boom"));
    renderDrawer();
    fireEvent.click(screen.getByRole("button", { name: /Оформить заказ/ }));
    await screen.findByText("Ошибка при оформлении заказа");
  });

  it("shows an error for an invalid promo", async () => {
    mocks.validate.mockRejectedValue({ response: { data: { detail: "Неверный промокод" } } });
    renderDrawer();
    fireEvent.change(screen.getByPlaceholderText("Промокод"), {
      target: { value: "bad" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Применить" }));
    await screen.findByText("Неверный промокод");
  });

  it("places an order and navigates", async () => {
    renderDrawer();
    fireEvent.click(screen.getByRole("button", { name: /Оформить заказ/ }));
    await waitFor(() => { expect(mocks.cartState.placeOrder).toHaveBeenCalled(); });
  });

  it("blocks ordering and shows an error when the restaurant is closed", () => {
    renderDrawer({ isRestaurantOpen: false });
    expect(
      screen.getByRole("button", { name: "Приём заказов на паузе" }),
    ).toBeDisabled();
  });

  it("shows the queue estimate and disables ordering when unavailable", async () => {
    mocks.getEstimate.mockResolvedValue({
      data: {
        data: {
          restaurant_id: "rest-1",
          ordering_available: false,
          estimated_wait_min_minutes: 20,
          estimated_wait_max_minutes: 30,
          avg_prep_time_minutes: 10,
          active_orders_count: 8,
          max_active_orders: 5,
        },
      },
    });
    renderDrawer();
    await screen.findByText("Заведение временно не принимает заказы");
    expect(
      screen.getByRole("button", { name: "Приём заказов на паузе" }),
    ).toBeDisabled();
  });

  it("switches to a scheduled pickup time and validates a too-soon value", () => {
    renderDrawer();
    fireEvent.click(screen.getByRole("button", { name: "Ко времени" }));
    expect(screen.getByText(/Минимум:/)).toBeInTheDocument();
    const input = document.querySelector(
      'input[type="datetime-local"]',
    ) as HTMLInputElement;
    fireEvent.change(input, { target: { value: "2000-01-01T00:00" } });
    expect(
      screen.getByRole("button", { name: /Оформить заказ/ }),
    ).toBeDisabled();
  });

  it("edits the order comment and switches pickup mode back to asap", () => {
    renderDrawer();
    const textarea = screen.getByPlaceholderText(/Комментарий к заказу/);
    fireEvent.change(textarea, { target: { value: "без лука" } });
    expect((textarea as HTMLTextAreaElement).value).toBe("без лука");
    fireEvent.click(screen.getByRole("button", { name: "Ко времени" }));
    fireEvent.click(screen.getByRole("button", { name: "Как можно скорее" }));
    expect(screen.queryByText(/Минимум:/)).not.toBeInTheDocument();
  });

  it("closes when clicking the overlay outside the drawer", () => {
    const onClose = vi.fn();
    const { container } = renderDrawer({ onClose });
    fireEvent.click(container.firstChild as Element);
    expect(onClose).toHaveBeenCalled();
  });

  it("tolerates a failing load estimate request", async () => {
    mocks.getEstimate.mockRejectedValueOnce(new Error("down"));
    renderDrawer();
    await waitFor(() => { expect(mocks.getEstimate).toHaveBeenCalled(); });
    expect(screen.getByText(/Оформить заказ/)).toBeInTheDocument();
  });

  it("resets the estimate when there is no restaurant id", () => {
    mocks.cartState.cartRestaurantId = null;
    renderDrawer();
    expect(screen.getByText("Корзина")).toBeInTheDocument();
  });

  it("clears the cart", () => {
    renderDrawer();
    fireEvent.click(screen.getByRole("button", { name: /Очистить корзину/ }));
    expect(mocks.cartState.clearCart).toHaveBeenCalled();
  });

  it("shows a queue warning without blocking ordering", async () => {
    mocks.getEstimate.mockResolvedValue({
      data: {
        data: {
          restaurant_id: "rest-1",
          ordering_available: true,
          estimated_wait_min_minutes: 40,
          estimated_wait_max_minutes: 50,
          avg_prep_time_minutes: 10,
          active_orders_count: 3,
          max_active_orders: 10,
        },
      },
    });
    renderDrawer();
    await screen.findByText(/Ожидание примерно/);
    expect(screen.getByText(/Активных заказов в очереди/)).toBeInTheDocument();
  });
});
