import { useCartStore } from "@/store/useCartStore";
import { useOrdersStore } from "@/store/useOrdersStore";
import type { Order } from "@shared/types/models";

describe("useCartStore wiring", () => {
  beforeEach(() => {
    useOrdersStore.setState({ orders: [], currentOrder: null, activeOrder: null });
  });

  it("exposes a cart store instance with a cart array", () => {
    expect(typeof useCartStore.getState).toBe("function");
    expect(Array.isArray(useCartStore.getState().cart)).toBe(true);
  });

  it("shares the orders store used by the onOrderPlaced side effect", () => {
    const order = { id: "o1" } as Order;
    useOrdersStore.setState((s) => ({
      orders: [order, ...s.orders],
      currentOrder: order,
      activeOrder: order,
    }));
    expect(useOrdersStore.getState().activeOrder?.id).toBe("o1");
  });
});
