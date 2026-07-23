import { vi } from "vitest";
import type { Order, OrderStatus } from "@shared/types/models";

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

export const mocks = { storeState, useOrdersStore, useCartStore, completeOrder, cancelOrder };

export const createOrderWebSocket = vi.fn(() => ({ close: vi.fn() }));

export const makeOrder = (status: OrderStatus, over: Partial<Order> = {}): Order => ({
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

export const resetOrderStatusMocks = (): void => {
  mocks.storeState.currentOrder = null;
  mocks.storeState.fetchOrder = vi.fn().mockResolvedValue(undefined);
  mocks.completeOrder.mockClear();
  mocks.cancelOrder.mockClear();
  createOrderWebSocket.mockClear();
  localStorage.clear();
};
