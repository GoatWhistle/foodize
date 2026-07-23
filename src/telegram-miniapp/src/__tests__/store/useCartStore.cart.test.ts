import { describe, it, expect, vi, beforeEach } from "vitest";
import { useCartStore } from "../../store/useCartStore";
import { cartServiceMock, makeLine, resetCartStore } from "./cartStoreHelpers";

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

describe("useCartStore fetching and adding", () => {
  beforeEach(() => {
    resetCartStore();
    vi.clearAllMocks();
  });

  it("should fetch cart successfully", async () => {
    cartServiceMock.getCart.mockResolvedValueOnce({
      data: {
        data: {
          items: [
            {
              menuItem: { id: "m1", name: "Pizza", price: 100 },
              quantity: 2,
              selected_options: [],
              selected_option_ids: [],
            },
          ],
          restaurant_id: "rest-1",
        },
      },
    });

    await useCartStore.getState().fetchCart();

    const state = useCartStore.getState();
    expect(state.cart.length).toBe(1);
    expect(state.cartRestaurantId).toBe("rest-1");
  });

  it("normalizes snake_case cart items to camelCase on fetch", async () => {
    cartServiceMock.getCart.mockResolvedValueOnce({
      data: {
        data: {
          items: [
            {
              menuItem: { id: "m1", name: "Pizza", price: 100 },
              quantity: 1,
              selected_option_ids: ["o1"],
              selected_options: [
                { option_id: "o1", name: "Cheese", price_delta: 15 },
              ],
            },
          ],
          restaurant_id: "rest-1",
        },
      },
    });

    await useCartStore.getState().fetchCart();

    const line = useCartStore.getState().cart[0];
    if (!line) throw new Error("cart line not found");
    expect(line.selectedOptionIds).toEqual(["o1"]);
    expect(line.selectedOptions).toEqual([
      { id: "o1", option_id: "o1", name: "Cheese", price_delta: 15 },
    ]);
    expect(line.lineKey).toBe("m1:o1");
    expect(useCartStore.getState().cartTotal()).toBe(115);
  });

  it("should add to cart successfully when cart is empty", async () => {
    cartServiceMock.updateCart.mockResolvedValueOnce({});
    const menuItem = { id: "m1", name: "Pizza", price: 100 };

    await useCartStore.getState().addToCart(menuItem, "rest-1", [], 2);

    const state = useCartStore.getState();
    expect(state.cart.length).toBe(1);
    expect(state.cart[0]?.menuItem).toEqual(menuItem);
    expect(state.cart[0]?.quantity).toBe(2);
    expect(state.cartRestaurantId).toBe("rest-1");
    expect(cartServiceMock.updateCart).toHaveBeenCalled();
  });

  it("should increment quantity when adding the same item", async () => {
    cartServiceMock.updateCart.mockResolvedValue({});
    const menuItem = { id: "m1", name: "Pizza", price: 100 };

    useCartStore.setState({
      cart: [makeLine(menuItem, 2)],
      cartRestaurantId: "rest-1",
    });

    await useCartStore.getState().addToCart(menuItem, "rest-1", [], 3);

    const state = useCartStore.getState();
    expect(state.cart[0]?.quantity).toBe(5);
  });
});
