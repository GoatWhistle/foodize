import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import { useOrderStore } from "../../store/useOrderStore";
import { cartService } from "@shared/services/cartService";
import { orderService } from "@shared/services/orderService";
import type { CartLine } from "@shared/store/useOrderStore";
import type { Order } from "@shared/types/models";

vi.mock("@shared/services/cartService", () => ({
  cartService: {
    getCart: vi.fn(),
    updateCart: vi.fn(),
    clearCart: vi.fn(),
  },
}));

vi.mock("@shared/services/orderService", () => ({
  orderService: {
    create: vi.fn(),
    getMyOrders: vi.fn(),
    getById: vi.fn(),
  },
}));

const cartServiceMock = cartService as unknown as {
  getCart: Mock;
  updateCart: Mock;
  clearCart: Mock;
};

const orderServiceMock = orderService as unknown as {
  create: Mock;
  getMyOrders: Mock;
  getById: Mock;
};

const asCartLines = (lines: Partial<CartLine>[]): CartLine[] =>
  lines as CartLine[];

const asOrder = (o: Partial<Order>): Order => o as Order;

describe("useOrderStore orders", () => {
  beforeEach(() => {
    useOrderStore.setState({
      cart: [],
      cartRestaurantId: null,
      orders: [],
      currentOrder: null,
      ordersLoading: false,
      ordersTotal: 0,
      activeOrder: null,
    });
    vi.clearAllMocks();
  });

  it("should repeat order successfully", async () => {
    cartServiceMock.updateCart.mockResolvedValueOnce({});
    cartServiceMock.getCart.mockResolvedValueOnce({
      data: {
        data: {
          items: [
            { menuItem: { id: "m1", name: "Pizza", price: 90 }, quantity: 2 },
          ],
          restaurant_id: "rest-1",
        },
      },
    });

    const repeatable = {
      restaurant_id: "rest-1",
      items: [
        {
          menu_item_id: "m1",
          menu_item_name: "Pizza",
          price_at_purchase: 100,
          quantity: 2,
          selected_options: [
            { option_id: "o1", name: "Cheese", price_delta: 10 },
          ],
        },
      ],
    } as unknown as Order;

    await useOrderStore.getState().repeatOrder(repeatable);

    expect(cartServiceMock.updateCart).toHaveBeenCalled();
    const state = useOrderStore.getState();
    expect(state.cart.length).toBe(1);
  });

  it("should set and clear active order", () => {
    const activeOrder = asOrder({ id: "o1" });
    useOrderStore.getState().setActiveOrder(activeOrder);
    expect(useOrderStore.getState().activeOrder).toEqual(activeOrder);

    useOrderStore.getState().clearActiveOrder();
    expect(useOrderStore.getState().activeOrder).toBeNull();
  });

  it("should fetch active order successfully", async () => {
    orderServiceMock.getMyOrders.mockResolvedValueOnce({
      data: {
        data: [
          { id: "o1", status: "COMPLETED" },
          { id: "o2", status: "READY" },
        ],
      },
    });

    await useOrderStore.getState().fetchActiveOrder();

    expect(useOrderStore.getState().activeOrder).toEqual({
      id: "o2",
      status: "READY",
    });
  });

  it("should place order successfully", async () => {
    orderServiceMock.create.mockResolvedValueOnce({
      data: {
        data: { id: "o1", status: "PENDING" },
      },
    });
    cartServiceMock.clearCart.mockResolvedValueOnce({});

    useOrderStore.setState({
      cart: asCartLines([
        {
          menuItem: { id: "m1" } as CartLine["menuItem"],
          quantity: 1,
          selectedOptionIds: [],
        },
      ]),
      cartRestaurantId: "rest-1",
    });

    const res = await useOrderStore
      .getState()
      .placeOrder("PROMO", "Please rush", "18:00");

    expect(orderServiceMock.create).toHaveBeenCalled();
    expect(cartServiceMock.clearCart).toHaveBeenCalled();
    expect(res).toEqual({ id: "o1", status: "PENDING" });

    const state = useOrderStore.getState();
    expect(state.cart.length).toBe(0);
    expect(state.cartRestaurantId).toBeNull();
    expect(state.orders[0]).toEqual({ id: "o1", status: "PENDING" });
    expect(state.activeOrder).toEqual({ id: "o1", status: "PENDING" });
  });

  it("should fetch my orders successfully", async () => {
    orderServiceMock.getMyOrders.mockResolvedValueOnce({
      data: {
        data: [{ id: "o1" }],
        pagination: { total: 10 },
      },
    });

    await useOrderStore.getState().fetchMyOrders({ page: 1 });

    const state = useOrderStore.getState();
    expect(state.ordersLoading).toBe(false);
    expect(state.orders).toEqual([{ id: "o1" }]);
    expect(state.ordersTotal).toBe(10);
  });

  it("should handle error when fetching my orders", async () => {
    orderServiceMock.getMyOrders.mockRejectedValueOnce(new Error("Failed"));

    await useOrderStore.getState().fetchMyOrders();

    const state = useOrderStore.getState();
    expect(state.ordersLoading).toBe(false);
    expect(state.orders).toEqual([]);
    expect(state.ordersTotal).toBe(0);
  });

  it("should fetch order by id successfully", async () => {
    orderServiceMock.getById.mockResolvedValueOnce({
      data: {
        data: { id: "o1" },
      },
    });

    const res = await useOrderStore.getState().fetchOrder("o1");

    expect(res).toEqual({ id: "o1" });
    expect(useOrderStore.getState().currentOrder).toEqual({ id: "o1" });
  });
});
