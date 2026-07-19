import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Order, OrderStatus } from "@shared/types/models";

const mocks = vi.hoisted(() => {
  const storeState: { fetchOrder: ReturnType<typeof vi.fn>; currentOrder: Order | null } = {
    fetchOrder: vi.fn().mockResolvedValue(undefined),
    currentOrder: null,
  };
  const useOrdersStore = Object.assign(
    vi.fn((selector?: (s: typeof storeState) => unknown) =>
      selector ? selector(storeState) : storeState,
    ),
    {
      getState: () => storeState,
      setState: (partial: Partial<typeof storeState>) => Object.assign(storeState, partial),
    },
  );
  const repeatOrder = vi.fn().mockResolvedValue(undefined);
  const useCartStore = Object.assign(vi.fn(), {
    getState: () => ({ repeatOrder }),
  });
  const completeOrder = vi.fn().mockResolvedValue(undefined);
  const cancelOrder = vi.fn().mockResolvedValue(undefined);
  return { storeState, useOrdersStore, useCartStore, completeOrder, cancelOrder };
});

const { storeState, completeOrder, cancelOrder } = mocks;

vi.mock("@shared/store/useOrdersStore.instance", () => ({ useOrdersStore: mocks.useOrdersStore }));
vi.mock("@shared/store/useCartStore.instance", () => ({ useCartStore: mocks.useCartStore }));
vi.mock("@shared/services/orderService", () => ({
  orderService: {
    completeOrder: (...args: unknown[]) => mocks.completeOrder(...args) as unknown,
    cancelOrder: (...args: unknown[]) => mocks.cancelOrder(...args) as unknown,
  },
}));
vi.mock("@shared/hooks/useEtaText", () => ({ useEtaText: () => "Готовность через 10 мин" }));
vi.mock("@shared/components/HorizontalSteps/HorizontalSteps", () => ({
  HorizontalSteps: () => <div data-testid="horizontal-steps" />,
}));

import { OrderStatusPage } from "@shared/pages/OrderStatusPage/OrderStatusPage";

const makeOrder = (status: OrderStatus, over: Partial<Order> = {}): Order => ({
  id: "o1",
  display_id: 77,
  user_id: "u1",
  restaurant_id: "rest-1",
  restaurant_display_id: "R1",
  restaurant_name: "Ресторан",
  restaurant_address: "адрес",
  status,
  total_price: 500,
  created_at: "2026-01-15T12:30:00Z",
  items: [
    {
      id: "i1",
      menu_item_id: "m1",
      menu_item_name: "Бургер",
      menu_item_category: "BURGER",
      menu_item_prep_time: 5,
      quantity: 1,
      price_at_purchase: 500,
      selected_options: [],
    },
  ],
  ...over,
});

const createOrderWebSocket = vi.fn(() => ({ close: vi.fn() }));

const renderPage = (props = {}) =>
  render(
    <MemoryRouter initialEntries={["/orders/77"]}>
      <Routes>
        <Route
          path="/orders/:id"
          element={<OrderStatusPage createOrderWebSocket={createOrderWebSocket} {...props} />}
        />
      </Routes>
    </MemoryRouter>,
  );

describe("OrderStatusPage", () => {
  beforeEach(() => {
    storeState.currentOrder = null;
    storeState.fetchOrder = vi.fn().mockResolvedValue(undefined);
    completeOrder.mockClear();
    cancelOrder.mockClear();
    createOrderWebSocket.mockClear();
    localStorage.clear();
  });

  it("renders the loading skeleton while there is no current order", () => {
    renderPage();
    expect(screen.getByRole("status", { name: "Загрузка заказа" })).toBeInTheDocument();
  });

  it("opens the websocket and fetches the order on mount", () => {
    renderPage();
    expect(storeState.fetchOrder).toHaveBeenCalledWith("77");
    expect(createOrderWebSocket).toHaveBeenCalled();
  });

  it("renders order number, status pill and details once loaded", () => {
    storeState.currentOrder = makeOrder("ACCEPTED");
    renderPage();
    expect(screen.getByText("#77")).toBeInTheDocument();
    expect(screen.getByText("Готовится")).toBeInTheDocument();
    expect(screen.getByTestId("horizontal-steps")).toBeInTheDocument();
    expect(screen.getByText("Состав заказа")).toBeInTheDocument();
    expect(screen.getByText("Бургер")).toBeInTheDocument();
  });

  it("shows the ready call-to-action and completes the order", async () => {
    const user = userEvent.setup();
    storeState.currentOrder = makeOrder("READY");
    renderPage();
    expect(screen.getByText("Подойдите к стойке — ваш заказ готов!")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Получил заказ" }));
    expect(completeOrder).toHaveBeenCalledWith("77");
  });

  it("shows a cancel button for pending orders and cancels", async () => {
    const user = userEvent.setup();
    storeState.currentOrder = makeOrder("PENDING");
    renderPage();
    await user.click(screen.getByRole("button", { name: "Отменить" }));
    expect(cancelOrder).toHaveBeenCalledWith("77", null);
  });

  it("shows the cancellation reason for cancelled orders", () => {
    storeState.currentOrder = makeOrder("CANCELLED", { cancellation_reason: "Нет продуктов" });
    renderPage();
    expect(screen.getByText("Нет продуктов")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Повторить заказ" })).toBeInTheDocument();
  });

  it("renders a back button", () => {
    storeState.currentOrder = makeOrder("ACCEPTED");
    renderPage();
    expect(screen.getByRole("button", { name: /Мои заказы/ })).toBeInTheDocument();
  });

  it("hides order details when showDetails is false", () => {
    storeState.currentOrder = makeOrder("ACCEPTED");
    renderPage({ showDetails: false });
    expect(screen.queryByText("Состав заказа")).not.toBeInTheDocument();
  });

  it("repeats a completed order and navigates to the restaurant", async () => {
    const user = userEvent.setup();
    const repeatOrder = vi.fn().mockResolvedValue(undefined);
    mocks.useCartStore.getState = () => ({ repeatOrder });
    storeState.currentOrder = makeOrder("COMPLETED", {
      restaurant_display_id: "R1",
    });
    renderPage();
    await user.click(screen.getByRole("button", { name: "Повторить заказ" }));
    expect(repeatOrder).toHaveBeenCalled();
  });

  it("invokes a function onBack when the back button is pressed", async () => {
    const user = userEvent.setup();
    const onBack = vi.fn();
    storeState.currentOrder = makeOrder("ACCEPTED");
    renderPage({ onBack });
    await user.click(screen.getByRole("button", { name: /Мои заказы/ }));
    expect(onBack).toHaveBeenCalled();
  });

  it("navigates for a string onBack path", async () => {
    const user = userEvent.setup();
    storeState.currentOrder = makeOrder("ACCEPTED");
    renderPage({ onBack: "/orders" });
    await user.click(screen.getByRole("button", { name: /Мои заказы/ }));
    expect(createOrderWebSocket).toHaveBeenCalled();
  });

  it("shows an error when completing the order fails", async () => {
    const user = userEvent.setup();
    completeOrder.mockRejectedValueOnce(new Error("boom"));
    storeState.currentOrder = makeOrder("READY");
    renderPage();
    await user.click(screen.getByRole("button", { name: "Получил заказ" }));
    expect(
      await screen.findByText("Не удалось подтвердить получение"),
    ).toBeInTheDocument();
  });

  it("shows an error when cancelling the order fails", async () => {
    const user = userEvent.setup();
    cancelOrder.mockRejectedValueOnce(new Error("boom"));
    storeState.currentOrder = makeOrder("PENDING");
    renderPage();
    await user.click(screen.getByRole("button", { name: "Отменить" }));
    expect(
      await screen.findByText("Не удалось отменить заказ"),
    ).toBeInTheDocument();
  });

  it("updates the order from a websocket message and ignores error frames", () => {
    storeState.currentOrder = makeOrder("ACCEPTED");
    renderPage();
    const call = createOrderWebSocket.mock.calls[0] as unknown as unknown[];
    const onMessage = call[1] as (d: Record<string, unknown>) => void;
    onMessage({ error: "boom" });
    onMessage({ id: "o1", display_id: 77, status: "READY" });
    expect(storeState.currentOrder.status).toBe("READY");
  });

  it("reloads the order on websocket close for non-terminal statuses", () => {
    const fetchOrder = vi.fn().mockResolvedValue(undefined);
    storeState.fetchOrder = fetchOrder;
    storeState.currentOrder = makeOrder("ACCEPTED");
    renderPage();
    fetchOrder.mockClear();
    const closeCall = createOrderWebSocket.mock.calls[0] as unknown as unknown[];
    const onClose = closeCall[2] as () => void;
    onClose();
    expect(fetchOrder).toHaveBeenCalled();
  });

  it("fires haptic feedback on a status change", () => {
    const impactOccurred = vi.fn();
    (window as unknown as { Telegram?: unknown }).Telegram = {
      WebApp: { HapticFeedback: { impactOccurred } },
    };
    storeState.currentOrder = makeOrder("ACCEPTED");
    const { rerender } = renderPage();
    storeState.currentOrder = makeOrder("READY");
    rerender(
      <MemoryRouter initialEntries={["/orders/77"]}>
        <Routes>
          <Route
            path="/orders/:id"
            element={
              <OrderStatusPage createOrderWebSocket={createOrderWebSocket} />
            }
          />
        </Routes>
      </MemoryRouter>,
    );
    delete (window as unknown as { Telegram?: unknown }).Telegram;
  });

  it("shows the bon appetit note once for a completed order", () => {
    storeState.currentOrder = makeOrder("COMPLETED", {
      requested_pickup_at: "2026-01-15T13:00:00Z",
    });
    renderPage();
    expect(screen.getByText("Приятного аппетита!")).toBeInTheDocument();
    expect(screen.getByText(/выдача в/)).toBeInTheDocument();
  });

  it("shows a load error in the skeleton when the fetch fails", async () => {
    storeState.currentOrder = null;
    storeState.fetchOrder = vi.fn().mockRejectedValue(new Error("boom"));
    renderPage();
    expect(
      await screen.findByText("Не удалось загрузить заказ"),
    ).toBeInTheDocument();
  });

  it("renders item options and hides the restaurant card when unnamed", () => {
    storeState.currentOrder = makeOrder("ACCEPTED", {
      restaurant_name: "",
      restaurant_address: "",
      items: [
        {
          id: "i1",
          menu_item_name: "Пицца",
          quantity: 2,
          price_at_purchase: 300,
          selected_options: [{ name: "Сыр", price_delta: 50 }],
        },
      ],
    } as never);
    renderPage();
    expect(screen.getByText(/Сыр/)).toBeInTheDocument();
  });

  it("renders the restaurant card with name and address", () => {
    storeState.currentOrder = makeOrder("ACCEPTED", {
      restaurant_name: "Кафе",
      restaurant_address: "ул. Мира, 5",
    });
    renderPage();
    expect(screen.getByText("Кафе")).toBeInTheDocument();
    expect(screen.getByText("ул. Мира, 5")).toBeInTheDocument();
  });
});
