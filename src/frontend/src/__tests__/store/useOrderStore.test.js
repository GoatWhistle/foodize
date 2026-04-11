import { describe, it, expect, vi, beforeEach } from "vitest";
import { useOrderStore } from "../../store/useOrderStore";
import { orderService } from "../../services/orderService";

vi.mock("../../services/orderService", () => ({
  orderService: {
    create: vi.fn(),
    getMyOrders: vi.fn(),
    getById: vi.fn(),
  },
}));

describe("useOrderStore", () => {
  beforeEach(() => {
    useOrderStore.setState({
      cart: [],
      cartRestaurantId: null,
      orders: [],
      currentOrder: null,
      ordersLoading: false,
    });
    vi.clearAllMocks();
  });

  it("addToCart adds items to the cart", () => {
    const item = { id: "1", name: "Pizza", price: 100 };
    const restaurantId = "rest-1";

    useOrderStore.getState().addToCart(item, restaurantId);

    const state = useOrderStore.getState();
    expect(state.cart).toHaveLength(1);
    expect(state.cart[0].quantity).toBe(1);
    expect(state.cartRestaurantId).toBe(restaurantId);
  });

  it("addToCart clears previous cart if restaurant changes", () => {
    useOrderStore.setState({
      cart: [{ menuItem: { id: "1" }, quantity: 1 }],
      cartRestaurantId: "old-rest",
    });

    const newItem = { id: "2", name: "Burger", price: 200 };
    useOrderStore.getState().addToCart(newItem, "new-rest");

    const state = useOrderStore.getState();
    expect(state.cart).toHaveLength(1);
    expect(state.cart[0].menuItem.id).toBe("2");
    expect(state.cartRestaurantId).toBe("new-rest");
  });

  it("removeFromCart decreases quantity or removes item", () => {
    const item = { id: "1", name: "Pizza", price: 100 };
    useOrderStore.setState({
      cart: [{ menuItem: item, quantity: 2 }],
      cartRestaurantId: "rest-1",
    });

    useOrderStore.getState().removeFromCart("1");
    expect(useOrderStore.getState().cart[0].quantity).toBe(1);

    useOrderStore.getState().removeFromCart("1");
    expect(useOrderStore.getState().cart).toHaveLength(0);
    expect(useOrderStore.getState().cartRestaurantId).toBe(null);
  });

  it("placeOrder calls service and clears cart", async () => {
    const item = { id: "1", name: "Pizza", price: 100 };
    useOrderStore.setState({
      cart: [{ menuItem: item, quantity: 2 }],
      cartRestaurantId: "rest-1",
    });

    const mockOrder = { id: "order-1", total_price: 200 };
    orderService.create.mockResolvedValueOnce({ data: mockOrder });

    await useOrderStore.getState().placeOrder();

    expect(orderService.create).toHaveBeenCalledWith({
      restaurant_id: "rest-1",
      items: [{ menu_item_id: "1", quantity: 2 }],
    });
    const state = useOrderStore.getState();
    expect(state.cart).toHaveLength(0);
    expect(state.orders[0]).toEqual(mockOrder);
  });
});
